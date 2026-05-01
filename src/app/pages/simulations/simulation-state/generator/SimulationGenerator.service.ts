import { inject, Injectable } from '@angular/core';
import { SensorsEntity } from 'app/models/Sensor.model';
import {
    GenerationContext,
    SimulationGenerationState,
    SimulationRecords,
} from 'app/models/Simulation-state.model';
import { SimulationEntity } from 'app/models/Simulation.model';
import { GenerateSectionService } from 'app/services/generate-section-data.service';
import { SensorOfflineService } from 'app/services/offline/sensor-offline.service';
import { convertSecondsToMilliseconds } from 'app/utils/Date.utils';
import { SimulationDataFactoryService } from './SimulationDataFactory.service';

/**
 * Service responsible for the core logic of data generation.
 * It handles both real-time (streamed) and instant (bulk) simulation data creation
 * by managing timestamps, section points, and sensor coordinates.
 */
@Injectable({ providedIn: 'root' })
export class SimulationGeneratorService {
    private readonly simulationDataFactoryService = inject(
        SimulationDataFactoryService,
    );
    private readonly generateSectionService = inject(GenerateSectionService);
    private readonly sensorOfflineService = inject(SensorOfflineService);

    generateInstant(simulation: SimulationEntity): SimulationRecords {
        const loadedSensor = this.sensorOfflineService.getLoadedSensors();
        if (!loadedSensor) return [];

        const context = this.createContext(simulation, loadedSensor);
        const records: SimulationRecords = [];

        while (!this.isSimulationFinished(context)) {
            const batch = this.generateBatch(context);
            if (!batch.length) break;

            records.push(...batch);
            this.advanceSimulationState(context, batch.length);
        }

        return records;
    }

    private isSimulationFinished(context: GenerationContext): boolean {
        const { state, simulation } = context;
        return state.currentTimestamp >= simulation.timestampEnd;
    }

    private advanceSectionState(context: GenerationContext): void {
        const { state, simulation } = context;
        const section = simulation.sections[state.sectionIndex];

        state.indexInSection++;

        if (state.indexInSection < section.numSectionPoints) return;

        state.indexInSection = 0;
        state.sectionIndex++;
        state.usedSensorIndexes.clear();

        if (state.sectionIndex >= simulation.sections.length)
            state.sectionIndex = 0;
    }

    private advanceSimulationState(
        context: GenerationContext,
        generated: number,
    ): void {
        const { state, simulation } = context;
        const stepMs = convertSecondsToMilliseconds(simulation.timeStep);

        state.currentTimestamp += generated * stepMs;
        state.currentGenerated += generated;
    }

    private calculateRemainingSteps(
        state: SimulationGenerationState,
        simulation: SimulationEntity,
    ): number {
        const timeStep = convertSecondsToMilliseconds(simulation.timeStep);
        if (timeStep <= 0) return 0;

        return Math.floor(
            (simulation.timestampEnd - state.currentTimestamp) / timeStep,
        );
    }

    private calculateBatchSize(
        numElements: number,
        context: GenerationContext,
    ): number {
        const { state, simulation } = context;
        const remainingSteps = this.calculateRemainingSteps(state, simulation);

        return Math.max(0, Math.min(numElements, remainingSteps));
    }

    private createContext(
        simulation: SimulationEntity,
        sensors: SensorsEntity,
    ): GenerationContext {
        return {
            simulation: {
                ...simulation,
                elementsToSimulate: Math.floor(
                    (simulation.timestampEnd - simulation.timestampIni) /
                        convertSecondsToMilliseconds(simulation.timeStep),
                ),
            },
            sensors,
            parameters: this.simulationDataFactoryService.parseParameters(
                simulation.parameters,
            ),
            state: {
                currentTimestamp: simulation.timestampIni,
                sectionIndex: 0,
                indexInSection: 0,
                usedSensorIndexes: new Set<number>(),
                currentGenerated: 0,
            },
        };
    }

    private generateBatch(context: GenerationContext) {
        const { state, simulation } = context;
        state.usedSensorIndexes.clear();
        const randomRecords =
            this.simulationDataFactoryService.getRandomRecordsCount(
                simulation,
                state.currentGenerated,
            );

        const batchSize = this.calculateBatchSize(randomRecords, context);
        if (batchSize <= 0) return [];

        return Array.from({ length: batchSize })
            .map((_, index) => this.generatePayload(context, index))
            .filter((payload) => !!payload);
    }

    private generatePayload(
        context: GenerationContext,
        offset: number,
    ): SimulationEntity['parameters'] | null {
        const { simulation, sensors, parameters, state } = context;

        const index = this.simulationDataFactoryService.selectIndex(context);
        if (index === -1) return null;

        const section = simulation.sections[state.sectionIndex];
        const payload = this.simulationDataFactoryService.generatePayload({
            params: parameters,
            sensor: sensors[index],
            sectionValue: this.generateSectionService.generateSectionPoint(
                section,
                state.indexInSection,
            ),
            timestamp:
                state.currentTimestamp +
                offset * convertSecondsToMilliseconds(simulation.timeStep),
        });

        this.advanceSectionState(context);
        return payload;
    }
}
