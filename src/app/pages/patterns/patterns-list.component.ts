import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Router, RouterModule } from '@angular/router';
import { ExportDataButtonComponent } from 'app/components/export-data-button/export-data-button.component';
import { ImportDataButtonComponent } from 'app/components/import-data-button/import-data-button.component';
import { Pattern } from 'app/models/Pattern.model';
import { TimePipe } from 'app/pipes/time.pipe';
import { PatternOfflineService } from 'app/services/offline/pattern-offline.service';

/**
 * Component that displays and manages a list of patterns stored offline.
 * It provides filtering, navigation to editing, and bulk import/export functionality.
 */
@Component({
    selector: 'patterns-list',
    templateUrl: './patterns-list.component.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        RouterModule,
        FormsModule,
        MatPaginatorModule,
        MatButtonModule,
        MatIconModule,
        TimePipe,
        ImportDataButtonComponent,
        ExportDataButtonComponent,
    ],
})
export class PatternsListComponent {
    private readonly patternOfflineService = inject(PatternOfflineService);
    private readonly router = inject(Router);

    protected readonly patterns = computed(() =>
        this.patternOfflineService.patterns(),
    );

    protected readonly searchQuery = signal('');
    protected readonly showDeleteModal = computed(
        () => !!this.selectedPatternId(),
    );
    protected readonly selectedPatternId = signal<Pattern['id'] | null>(null);

    protected readonly filteredPatterns = computed(() => {
        const patterns = this.patterns();
        const search = this.searchQuery().toLowerCase().trim();
        if (!search) return patterns;

        return patterns.filter((pattern) =>
            pattern.name.toLowerCase().includes(search),
        );
    });

    protected handleSearchChange(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        this.searchQuery.set(inputElement.value);
    }

    protected onDeleteClick(event: Event, patternId: Pattern['id']): void {
        event.stopPropagation();
        this.selectedPatternId.set(patternId);
    }

    protected onCancelDelete(): void {
        this.selectedPatternId.set(null);
    }

    protected navigateToEditPattern(patternId: Pattern['id']): void {
        this.router.navigate(['patterns/edit', patternId]);
    }

    protected deletePattern(patternId: Pattern['id']): void {
        const id = this.selectedPatternId();
        if (!id) return;

        this.patternOfflineService.deletePattern(id);
        this.onCancelDelete();
    }

    /**
     * Integrates imported pattern data into the pattern´s state.
     * @param data The raw data object received from the import process.
     */
    protected handleDataImport(data: unknown): void {
        this.patternOfflineService.addPatterns(data);
    }
}
