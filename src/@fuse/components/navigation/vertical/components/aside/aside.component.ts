import { BooleanInput } from '@angular/cdk/coercion';
import { NgClass, NgFor, NgIf } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    inject,
    Input,
    OnChanges,
    OnInit,
    SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router } from '@angular/router';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseNavigationItem } from '@fuse/components/navigation/navigation.types';
import { FuseVerticalNavigationBasicItemComponent } from '@fuse/components/navigation/vertical/components/basic/basic.component';
import { FuseVerticalNavigationCollapsableItemComponent } from '@fuse/components/navigation/vertical/components/collapsable/collapsable.component';
import { FuseVerticalNavigationDividerItemComponent } from '@fuse/components/navigation/vertical/components/divider/divider.component';
import { FuseVerticalNavigationGroupItemComponent } from '@fuse/components/navigation/vertical/components/group/group.component';
import { FuseVerticalNavigationSpacerItemComponent } from '@fuse/components/navigation/vertical/components/spacer/spacer.component';
import { FuseVerticalNavigationComponent } from '@fuse/components/navigation/vertical/vertical.component';
import { filter } from 'rxjs';

@Component({
    selector: 'fuse-vertical-navigation-aside-item',
    templateUrl: './aside.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgClass,
        MatTooltipModule,
        NgIf,
        MatIconModule,
        NgFor,
        FuseVerticalNavigationBasicItemComponent,
        FuseVerticalNavigationCollapsableItemComponent,
        FuseVerticalNavigationDividerItemComponent,
        FuseVerticalNavigationGroupItemComponent,
        FuseVerticalNavigationSpacerItemComponent,
    ],
})
export class FuseVerticalNavigationAsideItemComponent
    implements OnChanges, OnInit
{
    private readonly destroyRef = inject(DestroyRef);
    private readonly _changeDetectorRef = inject(ChangeDetectorRef);
    private readonly _router = inject(Router);
    private readonly _fuseNavigationService = inject(FuseNavigationService);

    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_autoCollapse: BooleanInput;
    static ngAcceptInputType_skipChildren: BooleanInput;
    /* eslint-enable @typescript-eslint/naming-convention */

    @Input() activeItemId: string;
    @Input() autoCollapse: boolean;
    @Input() item: FuseNavigationItem;
    @Input() name: string;
    @Input() skipChildren: boolean;

    active: boolean = false;
    private _fuseVerticalNavigationComponent: FuseVerticalNavigationComponent;

    /**
     * On changes
     *
     * @param changes
     */
    ngOnChanges(changes: SimpleChanges): void {
        // Active item id
        if ('activeItemId' in changes) {
            // Mark if active
            this._markIfActive(this._router.url);
        }
    }

    /**
     * On init
     */
    ngOnInit(): void {
        // Mark if active
        this._markIfActive(this._router.url);

        // Attach a listener to the NavigationEnd event
        this._router.events
            .pipe(
                filter(
                    (event): event is NavigationEnd =>
                        event instanceof NavigationEnd
                ),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((event: NavigationEnd) => {
                // Mark if active
                this._markIfActive(event.urlAfterRedirects);
            });

        // Get the parent navigation component
        this._fuseVerticalNavigationComponent =
            this._fuseNavigationService.getComponent(this.name);

        // Subscribe to onRefreshed on the navigation component
        this._fuseVerticalNavigationComponent.onRefreshed
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
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Check if the given item has the given url
     * in one of its children
     *
     * @param item
     * @param currentUrl
     * @private
     */
    private _hasActiveChild(
        item: FuseNavigationItem,
        currentUrl: string
    ): boolean {
        const children = item.children;

        if (!children) {
            return false;
        }

        for (const child of children) {
            if (child.children) {
                if (this._hasActiveChild(child, currentUrl)) {
                    return true;
                }
            }

            // Skip items other than 'basic'
            if (child.type !== 'basic') {
                continue;
            }

            // Check if the child has a link and is active
            if (
                child.link &&
                this._router.isActive(child.link, child.exactMatch || false)
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Decide and mark if the item is active
     *
     * @private
     */
    private _markIfActive(currentUrl: string): void {
        // Check if the activeItemId is equals to this item id
        this.active = this.activeItemId === this.item.id;

        // If the aside has a children that is active,
        // always mark it as active
        if (this._hasActiveChild(this.item, currentUrl)) {
            this.active = true;
        }

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
}
