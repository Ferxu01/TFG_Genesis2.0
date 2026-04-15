import {
    ChangeDetectionStrategy,
    Component,
    inject,
    Input,
    signal,
} from '@angular/core';
import {
    DataExportService,
    ExportFormat,
} from 'app/services/data-export.service';

/**
 * A generic button component that handles the exportation of data
 * into a specific downloadable format (currently JSON).
 * @template T The type of data being exported.
 */
@Component({
    selector: 'app-export-data-button',
    templateUrl: './export-data-button.component.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportDataButtonComponent<T> {
    private readonly dataExportService = inject(DataExportService);

    @Input() label?: string;
    @Input() disabled = false;
    @Input({ required: true }) set data(value: T | T[]) {
        this.exportableData.set(value);
    }

    private readonly exportableData = signal<T | T[] | null>(null);

    /**
     * Triggers the download process through the DataExportService.
     * It ensures there is data available before attempting the export.
     */
    protected handleExportAction(): void {
        const currentData = this.exportableData();
        if (!currentData) return;
        this.dataExportService.download(currentData, ExportFormat.JSON);
    }
}
