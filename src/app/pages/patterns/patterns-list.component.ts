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
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { ExportDataButtonComponent } from 'app/components/export-data-button/export-data-button.component';
import { ImportDataButtonComponent } from 'app/components/import-data-button/import-data-button.component';
import { NotificationService } from 'app/core/services/notification.service';
import { Pattern } from 'app/models/Pattern.model';
import { TimePipe } from 'app/pipes/time.pipe';
import { PatternOfflineService } from 'app/services/offline/pattern-offline.service';
import { SimulationOfflineService } from 'app/services/offline/simulation-offline.service';

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
        MatButtonModule,
        MatIconModule,
        TimePipe,
        ImportDataButtonComponent,
        ExportDataButtonComponent,
        MatTooltipModule,
    ],
})
export class PatternsListComponent {
    private readonly notificationService = inject(NotificationService);
    private readonly patternOfflineService = inject(PatternOfflineService);
    private readonly simulationOfflineService = inject(
        SimulationOfflineService,
    );
    private readonly router = inject(Router);

    protected readonly patterns = computed(() =>
        this.patternOfflineService.patterns(),
    );

    // Computed set of pattern IDs that are currently in use on the loaded simulation configuration, used to disable deletion of patterns that are in use.
    protected readonly usingPatternIds = computed(() =>
        this.simulationOfflineService.usingPatternIds(),
    );

    protected readonly searchQuery = signal('');
    protected readonly showDeleteModal = computed(
        () => !!this.selectedPatternId(),
    );

    // Pending data imported from the import dialog, waiting for user confirmation on how to integrate it with the existing patterns.
    protected readonly pendingImportData = signal<any>(null);
    protected readonly showDataImportedDialog = signal(false);

    protected readonly selectedPatternId = signal<Pattern['id'] | null>(null);

    protected readonly filteredPatterns = computed(() => {
        const patterns = this.patterns();
        const search = this.searchQuery().toLowerCase().trim();
        if (!search) return patterns;

        return patterns.filter((pattern) =>
            pattern.name.toLowerCase().includes(search),
        );
    });

    protected isPatternInUse(patternId: Pattern['id']): boolean {
        return this.usingPatternIds().has(patternId);
    }

    protected handleSearchChange(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        this.searchQuery.set(inputElement.value);
    }

    protected onDeleteClick(patternId: Pattern['id'], event: Event): void {
        event.stopPropagation();
        this.selectedPatternId.set(patternId);
    }

    protected onCancelDelete(): void {
        this.selectedPatternId.set(null);
    }

    protected navigateToEditPattern(patternId: Pattern['id']): void {
        this.router.navigate(['patterns/edit', patternId]);
    }

    protected deletePattern(): void {
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
        this.pendingImportData.set(data);

        if (!this.patterns().length) return this.executeDirectImport(data);

        this.showDataImportedDialog.set(true);
        // this.patternOfflineService.addPatterns(data);
    }

    private executeDirectImport(data: any): void {
        this.patternOfflineService.addPatterns(data);
        this.notificationService.success('Patrones importados correctamente');
        this.closeImportDialog();
    }

    protected appendImportedData(): void {
        const pendingData = this.pendingImportData();
        if (!pendingData) return;

        const patternsToAdd = Array.isArray(pendingData)
            ? pendingData
            : [pendingData];
        this.patternOfflineService.appendPatterns(patternsToAdd);

        this.notificationService.success(
            'Patrones añadidos a la lista existente',
        );
        this.closeImportDialog();
    }

    protected replaceWithImportedData(): void {
        const pendingData = this.pendingImportData();
        if (!pendingData) return;

        const patternsToSet = Array.isArray(pendingData)
            ? pendingData
            : [pendingData];
        this.patternOfflineService.addPatterns(patternsToSet);

        this.notificationService.success(
            'Lista de patrones reemplazada correctamente',
        );
    }

    protected closeImportDialog(): void {
        this.pendingImportData.set(null);
        this.showDataImportedDialog.set(false);
    }
}
