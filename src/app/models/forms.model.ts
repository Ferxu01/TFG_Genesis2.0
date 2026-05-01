import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { FunctionType } from './Pattern.model';

export interface SimulationFormModel {
    name: FormControl<string>;
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

export interface SensorCoordinateForm {
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
