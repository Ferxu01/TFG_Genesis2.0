import { BooleanInput } from '@angular/cdk/coercion';
import { NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    forwardRef,
    inject,
    Input,
    OnInit,
    ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseHorizontalNavigationBasicItemComponent } from '@fuse/components/navigation/horizontal/components/basic/basic.component';
import { FuseHorizontalNavigationDividerItemComponent } from '@fuse/components/navigation/horizontal/components/divider/divider.component';
import { FuseHorizontalNavigationComponent } from '@fuse/components/navigation/horizontal/horizontal.component';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseNavigationItem } from '@fuse/components/navigation/navigation.types';

@Component({
    selector: 'fuse-horizontal-navigation-branch-item',
    templateUrl: './branch.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgIf,
        NgClass,
        MatMenuModule,
        NgTemplateOutlet,
        NgFor,
        FuseHorizontalNavigationBasicItemComponent,
        forwardRef(() => FuseHorizontalNavigationBranchItemComponent),
        FuseHorizontalNavigationDividerItemComponent,
        MatTooltipModule,
        MatIconModule,
    ],
})
export class FuseHorizontalNavigationBranchItemComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly _changeDetectorRef = inject(ChangeDetectorRef);
    private readonly _fuseNavigationService = inject(FuseNavigationService);

    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_child: BooleanInput;
    /* eslint-enable @typescript-eslint/naming-convention */

    @Input() child: boolean = false;
    @Input() item: FuseNavigationItem;
    @Input() name: string;
    @ViewChild('matMenu', { static: true }) matMenu: MatMenu;

    private _fuseHorizontalNavigationComponent: FuseHorizontalNavigationComponent;

    ngOnInit(): void {
        // Get the parent navigation component
        this._fuseHorizontalNavigationComponent =
            this._fuseNavigationService.getComponent(this.name);

        // Subscribe to onRefreshed on the navigation component
        this._fuseHorizontalNavigationComponent.onRefreshed
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Trigger the change detection
     */
    triggerChangeDetection(): void {
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
