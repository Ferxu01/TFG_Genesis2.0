import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    inject,
    Input,
    OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FuseHorizontalNavigationComponent } from '@fuse/components/navigation/horizontal/horizontal.component';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseNavigationItem } from '@fuse/components/navigation/navigation.types';

@Component({
    selector: 'fuse-horizontal-navigation-divider-item',
    templateUrl: './divider.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgClass],
})
export class FuseHorizontalNavigationDividerItemComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly _changeDetectorRef = inject(ChangeDetectorRef);
    private readonly _fuseNavigationService = inject(FuseNavigationService);

    @Input() item: FuseNavigationItem;
    @Input() name: string;

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
}
