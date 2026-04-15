import {
    Component,
    DestroyRef,
    inject,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, RouterOutlet } from '@angular/router';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import {
    FuseHorizontalNavigationComponent,
    FuseNavigationItem,
    FuseNavigationService,
    FuseVerticalNavigationComponent,
} from '@fuse/components/navigation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector: 'modern-layout',
    templateUrl: './modern.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        RouterOutlet,
        RouterModule,
        MatDividerModule,
        FuseLoadingBarComponent,
        FuseVerticalNavigationComponent,
        FuseHorizontalNavigationComponent,
    ],
})
export class ModernLayoutComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly _fuseMediaWatcherService = inject(FuseMediaWatcherService);
    private readonly _fuseNavigationService = inject(FuseNavigationService);
    private readonly _authService = inject(AuthService);

    isScreenSmall = false;
    currentUser$ = this._authService.getCurrentUser();
    navigationItems: FuseNavigationItem[] = [];

    constructor() {
        this.setNavigationItems();
    }

    private setNavigationItems(): void {
        this.navigationItems = [
            {
                id: 'simulaciones',
                title: 'Simulaciones',
                type: 'basic',
                link: '/simulations',
                icon: 'heroicons_outline:adjustments-horizontal',
            },
            {
                id: 'sensores',
                title: 'Sensores',
                type: 'basic',
                link: '/sensors',
                icon: 'heroicons_outline:map',
            },
            {
                id: 'patrones',
                title: 'Patrones',
                type: 'basic',
                link: '/patterns',
                icon: 'heroicons_outline:server-stack',
            },
        ];
    }

    get currentYear(): number {
        return new Date().getFullYear();
    }

    ngOnInit(): void {
        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(({ matchingAliases }) => {
                this.isScreenSmall = !matchingAliases.includes('md');
            });
    }

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void {
        // Get the navigation
        const navigation =
            this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(
                name,
            );

        if (navigation) navigation.toggle();
    }
}
