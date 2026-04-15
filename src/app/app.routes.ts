import { Route } from '@angular/router';
import { LayoutComponent } from 'app/layout/layout.component';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [
    { path: '', pathMatch: 'full', redirectTo: 'simulations' },

    // Redirect signed-in user to the '/example'
    //
    // After the user signs in, the sign-in page will redirect the user to the 'signed-in-redirect'
    // path. Below is another redirection for that path to redirect the user to the desired
    // location. This is a small convenience to keep all main routes together here on this file.
    {
        path: 'signed-in-redirect',
        pathMatch: 'full',
        redirectTo: 'simulations',
    },

    {
        path: '',
        component: LayoutComponent,
        data: { layout: 'modern' },
        children: [
            {
                path: 'simulations',
                loadChildren: () =>
                    import('app/pages/simulations/simulations.routes'),
            },
            {
                path: 'sensors',
                loadChildren: () => import('app/pages/sensors/sensors.routes'),
            },
            {
                path: 'patterns',
                loadChildren: () =>
                    import('app/pages/patterns/patterns-list.routes'),
            },
        ],
    },
    {
        path: '**',
        redirectTo: 'simulations',
    },
];
