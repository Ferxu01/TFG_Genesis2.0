import { JsonPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    Input,
    signal,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Nullable } from 'app/models/Nullable.model';

/**
 * Component responsible for rendering a list of simulated data records.
 * It provides a preview summary for each record and allows expanding
 * items to view their full JSON structure.
 */
@Component({
    selector: 'simulation-viewer',
    templateUrl: './simulation-viewer.component.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatFormFieldModule, JsonPipe],
})
export class SimulationViewerComponent {
    /**
     * Updates the local simulation data and resets expansion states.
     * @param value The array of generated simulation records.
     */
    @Input() set generatedSimulation(value: Nullable<unknown[]>) {
        this.simulationRecords.set(value ?? []);
        this.expandedIndexes.set(new Set<number>());
    }

    private readonly simulationRecords = signal<unknown[]>([]);

    private readonly expandedIndexes = signal(new Set<number>());

    protected readonly hasSimulationData = computed(
        () => !!this.simulationRecords().length,
    );

    protected readonly simulation = computed(() => this.simulationRecords());

    /**
     * Toggles the expansion state of a specific record by its index.
     * @param index The position of the item in the records array.
     */
    protected toggleRecordExpansion(index: number): void {
        this.expandedIndexes.update((currentSet) => {
            const newSet = new Set(currentSet);

            if (newSet.has(index)) newSet.delete(index);
            else newSet.add(index);

            return newSet;
        });
    }

    protected isRecordExpanded(index: number): boolean {
        return this.expandedIndexes().has(index);
    }

    protected getRecordSummary(item: unknown): string {
        if (!item || typeof item !== 'object') return String(item);

        const entries = Object.entries(item as Record<string, unknown>);
        const PREVIEW_LIMIT = 3;

        const previewContent = entries
            .slice(0, PREVIEW_LIMIT)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

        const hasMoreFields = entries.length > PREVIEW_LIMIT;

        return `{ ${previewContent}${hasMoreFields ? ', …' : ''} }`;
    }
}
