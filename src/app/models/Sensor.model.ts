export interface Coordinate {
    lat: number;
    long: number;
    height: number;
    alias: string;
    dev_eui: string;
    join_eui: string;
    dev_addr: string;
}

export interface SensorEntity {
    id: number | string;
    name: string;
    coordinates: Coordinate[];
}

type BaseSensorRequest = Pick<SensorEntity, 'name' | 'coordinates'>;

export type SensorCreateRequest = BaseSensorRequest;

export type SensorEditRequest = BaseSensorRequest & { id: SensorEntity['id'] };
