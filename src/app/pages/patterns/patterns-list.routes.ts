import { Routes } from '@angular/router';
import { PatternFormComponent } from './pattern-form/pattern-form.component';
import { PatternsListComponent } from './patterns-list.component';

export default [
    {
        path: '',
        children: [
            { path: '', component: PatternsListComponent },
            { path: 'create', component: PatternFormComponent },
            { path: 'edit/:id', component: PatternFormComponent },
        ],
    },
] as Routes;
