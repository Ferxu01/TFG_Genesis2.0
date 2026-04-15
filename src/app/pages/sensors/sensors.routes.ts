import { Routes } from '@angular/router';
import { SensorFormComponent } from './sensor-form/sensor-form.component';

export default [
    {
        path: '',
        children: [{ path: '', component: SensorFormComponent }],
    },
] as Routes;
