import { Routes } from '@angular/router';
import { SimulationFormComponent } from './simulation-form/simulation-form.component';

export default [
    {
        path: '',
        children: [{ path: '', component: SimulationFormComponent }],
    },
] as Routes;
