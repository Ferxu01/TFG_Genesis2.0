import { Section } from './Section.model';

interface BaseSimulation {
    name: string;
    parameters: string;
    minRecordsPerInstant: number;
    maxRecordsPerInstant: number;
    minIntervalBetweenRecords: number;
    maxIntervalBetweenRecords: number;
    noRepeat: boolean;
    date: string;
}

export interface SimulationEntity extends BaseSimulation {
    id: number;
    timestampIni: number;
    timestampEnd: number;
    timeStep: number;
    sections: Section[];
    elementsToSimulate: number;
}
