export interface Coordinate {
    lat: number;
    long: number;
    height: number;
    alias: string;
    dev_eui: string;
    join_eui: string;
    dev_addr: string;
}

export type SensorsEntity = Coordinate[];

export type SensorCreateRequest = SensorsEntity;
