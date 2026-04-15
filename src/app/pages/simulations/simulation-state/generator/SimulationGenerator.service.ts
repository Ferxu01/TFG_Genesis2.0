import { inject, Injectable } from '@angular/core';
import { SensorEntity } from 'app/models/Sensor.model';
import {
    GenerationContext,
    SimulationBatch,
    SimulationGenerationState,
    SimulationRecords,
} from 'app/models/Simulation-state.model';
import { SimulationEntity } from 'app/models/Simulation.model';
import { GenerateSectionService } from 'app/services/generate-section-data.service';
import { SensorOfflineService } from 'app/services/offline/sensor-offline.service';
import { convertSecondsToMilliseconds } from 'app/utils/Date.utils';
import {
    catchError,
    delay,
    EMPTY,
    expand,
    map,
    Observable,
    of,
    Subject,
    switchMap,
    takeUntil,
    takeWhile,
    tap,
    timer,
} from 'rxjs';
import { SimulationStateStore } from '../store/SimulationStateStore.service';
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
    private readonly simulationStateStoreService = inject(SimulationStateStore);

    // generate(
    //     simulation: SimulationEntity,
    //     cancel$: Subject<void>,
    // ): Observable<SimulationBatch> {
    //     return this.sensorOfflineService.getLoadedSensor().pipe(
    //         map((sensor) => this.createContext(simulation, sensor)),
    //         switchMap((context) =>
    //             this.runSimulationGeneration(context, cancel$),
    //         ),
    //         this.handleFatalErrors<SimulationBatch>(),
    //     );
    // }

    generateInstant(simulation: SimulationEntity): SimulationRecords {
        const loadedSensor = this.sensorOfflineService.getLoadedSensor();
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

    private handleFatalErrors<T>(): (source: Observable<T>) => Observable<T> {
        return catchError((error) => {
            console.error('[SimulationGenerator]', error);
            return EMPTY;
        });
    }

    private waitIfPaused(simulation: SimulationEntity): Observable<void> {
        const state = this.simulationStateStoreService.getStateValue(
            simulation.id,
        );
        if (!state?.isPaused) return of(undefined);

        return timer(500).pipe(switchMap(() => this.waitIfPaused(simulation)));
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
        sensor: SensorEntity,
    ): GenerationContext {
        return {
            simulation: {
                ...simulation,
                elementsToSimulate: Math.floor(
                    (simulation.timestampEnd - simulation.timestampIni) /
                        convertSecondsToMilliseconds(simulation.timeStep),
                ),
            },
            sensor,
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

    private runSimulationGeneration(
        context: GenerationContext,
        cancel$: Subject<void>,
    ): Observable<SimulationBatch> {
        return this.runStep(context).pipe(
            expand(() => this.runStep(context)),
            takeWhile(() => !this.isSimulationFinished(context), true),
            takeUntil(cancel$),
        );
    }

    private runStep(context: GenerationContext): Observable<SimulationBatch> {
        if (this.isSimulationFinished(context)) return of([]);

        return this.waitIfPaused(context.simulation).pipe(
            map(() => this.generateBatch(context)),
            switchMap((batch) => this.emitBatch(context, batch)),
        );
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

    private emitBatch(context: GenerationContext, batch: SimulationBatch) {
        return this.delayBatchEmission(context, batch).pipe(
            tap((emittedBatch) =>
                this.advanceSimulationState(context, emittedBatch.length),
            ),
        );
    }

    private generatePayload(
        context: GenerationContext,
        offset: number,
    ): SimulationEntity['parameters'] | null {
        const { simulation, sensor, parameters, state } = context;

        const index = this.simulationDataFactoryService.selectIndex(context);
        if (index === -1) return null;

        const section = simulation.sections[state.sectionIndex];
        const payload = this.simulationDataFactoryService.generatePayload({
            params: parameters,
            sensor: sensor.coordinates[index],
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

    private delayBatchEmission(
        context: GenerationContext,
        batch: SimulationBatch,
    ): Observable<SimulationBatch> {
        if (!batch.length) return of([]);

        const { simulation } = context;

        const randomInterval =
            this.simulationDataFactoryService.getRandomInterval(simulation);
        const delayTime = convertSecondsToMilliseconds(randomInterval);

        return of(batch).pipe(delay(delayTime));
    }
}
