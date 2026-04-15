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
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import { FuseNavigationItem } from '@fuse/components/navigation/navigation.types';
import { FuseVerticalNavigationComponent } from '@fuse/components/navigation/vertical/vertical.component';

@Component({
    selector: 'fuse-vertical-navigation-spacer-item',
    templateUrl: './spacer.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [NgClass],
})
export class FuseVerticalNavigationSpacerItemComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly _changeDetectorRef = inject(ChangeDetectorRef);
    private readonly _fuseNavigationService = inject(FuseNavigationService);

    @Input() item: FuseNavigationItem;
    @Input() name: string;

    private _fuseVerticalNavigationComponent: FuseVerticalNavigationComponent;

    ngOnInit(): void {
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
}
