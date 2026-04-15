import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { FunctionType } from './Pattern.model';
import { SensorEntity } from './Sensor.model';

export interface SimulationFormModel {
    name: FormControl<string>;
    sensorId: FormControl<SensorEntity['id']>;
    timestampIni: FormControl<number | null>;
    timestampEnd: FormControl<number | null>;
    timeStep: FormControl<number>;
    sections: FormArray<FormGroup<SectionFormModel>>;
    parameters: FormControl<string>;
    minRecordsPerInstant: FormControl<number>;
    maxRecordsPerInstant: FormControl<number>;
    minIntervalBetweenRecords: FormControl<number>;
    maxIntervalBetweenRecords: FormControl<number>;
    noRepeat: FormControl<boolean>;
    date: FormControl<string>;
}

export interface SensorForm {
    name: FormControl<string>;
    coordinates: FormArray<FormGroup<CoordinateForm>>;
}

export interface CoordinateForm {
    lat: FormControl<string>;
    long: FormControl<string>;
    height: FormControl<string>;
    alias: FormControl<string>;
    dev_eui: FormControl<string>;
    join_eui: FormControl<string>;
    dev_addr: FormControl<string>;
}

export interface SectionFormModel {
    pattern: FormGroup<PatternFormModel>;
    numSectionPoints: FormControl<number>;
}

export interface PatternFormModel {
    id?: FormControl<string>;
    name: FormControl<string>;
    fType: FormControl<FunctionType>;
    duration: FormControl<number>;
    initValue: FormControl<number>;
    endValue: FormControl<number>;
    minTolerance: FormControl<number>;
    maxTolerance: FormControl<number>;
}
