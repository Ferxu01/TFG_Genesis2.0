import {
    DestroyRef,
    Directive,
    ElementRef,
    inject,
    OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Directive({
    selector: '[fuseScrollReset]',
    exportAs: 'fuseScrollReset',
    standalone: true,
})
export class FuseScrollResetDirective implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly _elementRef = inject(ElementRef);
    private readonly _router = inject(Router);

    ngOnInit(): void {
        // Subscribe to NavigationEnd event
        this._router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(() => {
                // Reset the element's scroll position to the top
                this._elementRef.nativeElement.scrollTop = 0;
            });
    }
}
