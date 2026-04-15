import { DOCUMENT } from '@angular/common';
import {
    Component,
    DestroyRef,
    inject,
    Inject,
    OnInit,
    Renderer2,
    ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { FuseConfig, FuseConfigService } from '@fuse/services/config';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FusePlatformService } from '@fuse/services/platform';
import { FUSE_VERSION } from '@fuse/version';
import { combineLatest, filter, map } from 'rxjs';
import { EmptyLayoutComponent } from './layouts/empty/empty.component';
import { ModernLayoutComponent } from './layouts/modern/modern.component';

@Component({
    selector: 'layout',
    templateUrl: './layout.component.html',
    styleUrls: ['./layout.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [EmptyLayoutComponent, ModernLayoutComponent],
})
export class LayoutComponent implements OnInit {
    private readonly _activatedRoute = inject(ActivatedRoute);
    private readonly _renderer2 = inject(Renderer2);
    private readonly _router = inject(Router);
    private readonly _fuseConfigService = inject(FuseConfigService);
    private readonly _fuseMediaWatcherService = inject(FuseMediaWatcherService);
    private readonly _fusePlatformService = inject(FusePlatformService);
    private readonly destroyRef = inject(DestroyRef);

    config: FuseConfig;
    layout: string;
    scheme: 'dark' | 'light';
    theme: string;

    constructor(@Inject(DOCUMENT) private _document: any) {}

    ngOnInit(): void {
        // Set the theme and scheme based on the configuration
        combineLatest([
            this._fuseConfigService.config$,
            this._fuseMediaWatcherService.onMediaQueryChange$([
                '(prefers-color-scheme: dark)',
                '(prefers-color-scheme: light)',
            ]),
        ])
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                map(([config, mql]) => {
                    const options = {
                        scheme: config.scheme,
                        theme: config.theme,
                    };

                    if (config.scheme === 'auto') {
                        // Decide the scheme using the media query
                        options.scheme = mql.breakpoints[
                            '(prefers-color-scheme: dark)'
                        ]
                            ? 'dark'
                            : 'light';
                    }

                    return options;
                })
            )
            .subscribe((options) => {
                // Store the options
                this.scheme = options.scheme;
                this.theme = options.theme;

                // Update the scheme and theme
                this._updateScheme();
                this._updateTheme();
            });

        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((config: FuseConfig) => {
                // Store the config
                this.config = config;

                // Update the layout
                this._updateLayout();
            });

        // Subscribe to NavigationEnd event
        this._router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(() => {
                // Update the layout
                this._updateLayout();
            });

        // Set the app version
        this._renderer2.setAttribute(
            this._document.querySelector('[ng-version]'),
            'fuse-version',
            FUSE_VERSION
        );

        // Set the OS name
        this._renderer2.addClass(
            this._document.body,
            this._fusePlatformService.osName
        );
    }

    /**
     * Update the selected layout
     */
    private _updateLayout(): void {
        // Get the current activated route
        let route = this._activatedRoute;
        while (route.firstChild) {
            route = route.firstChild;
        }

        // 1. Set the layout from the config
        this.layout = this.config.layout;

        // 2. Get the query parameter from the current route and
        // set the layout and save the layout to the config
        const layoutFromQueryParam = route.snapshot.queryParamMap.get('layout');
        if (layoutFromQueryParam) {
            this.layout = layoutFromQueryParam;
            if (this.config) {
                this.config.layout = layoutFromQueryParam;
            }
        }

        // 3. Iterate through the paths and change the layout as we find
        // a config for it.
        //
        // The reason we do this is that there might be empty grouping
        // paths or componentless routes along the path. Because of that,
        // we cannot just assume that the layout configuration will be
        // in the last path's config or in the first path's config.
        //
        // So, we get all the paths that matched starting from root all
        // the way to the current activated route, walk through them one
        // by one and change the layout as we find the layout config. This
        // way, layout configuration can live anywhere within the path and
        // we won't miss it.
        //
        // Also, this will allow overriding the layout in any time so we
        // can have different layouts for different routes.
        const paths = route.pathFromRoot;
        paths.forEach((path) => {
            // Check if there is a 'layout' data
            if (
                path.routeConfig &&
                path.routeConfig.data &&
                path.routeConfig.data.layout
            ) {
                // Set the layout
                this.layout = path.routeConfig.data.layout;
            }
        });
    }

    /**
     * Update the selected scheme
     *
     * @private
     */
    private _updateScheme(): void {
        // Remove class names for all schemes
        this._document.body.classList.remove('light', 'dark');

        // Add class name for the currently selected scheme
        this._document.body.classList.add(this.scheme);
    }

    /**
     * Update the selected theme
     *
     * @private
     */
    private _updateTheme(): void {
        // Find the class name for the previously selected theme and remove it
        this._document.body.classList.forEach((className: string) => {
            if (className.startsWith('theme-')) {
                this._document.body.classList.remove(
                    className,
                    className.split('-')[1]
                );
            }
        });

        // Add class name for the currently selected theme
        this._document.body.classList.add(this.theme);
    }
}
