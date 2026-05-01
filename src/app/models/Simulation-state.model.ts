import { SensorsEntity } from 'app/models/Sensor.model';
import { SimulationEntity } from 'app/models/Simulation.model';

type SimulationParameters = SimulationEntity['parameters'];
export type SimulationRecords = SimulationParameters[];
export type SimulationBatch = SimulationRecords;

export interface GenerationContext {
    readonly simulation: SimulationEntity;
    readonly sensors: SensorsEntity;
    readonly parameters: SimulationParameters;
    readonly state: SimulationGenerationState;
}

interface SimulationProgress {
    isRunning: boolean;
    isPaused: boolean;
    isFinished: boolean;
    elapsedTime: number;
    currentGenerated: number;
}

export interface SimulationGenerationState {
    currentTimestamp: number;
    sectionIndex: number;
    indexInSection: number;
    usedSensorIndexes: Set<number>;
    currentGenerated: number;
}

export interface SimulationState extends SimulationProgress {
    simulation: SimulationEntity;
    sensors: SensorsEntity;
    records: SimulationRecords;
}
