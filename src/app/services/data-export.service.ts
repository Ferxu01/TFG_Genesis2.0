import { inject, Injectable } from '@angular/core';
import { BaseExportService } from 'app/core/services/data-export/base-export.service';
import { CsvExportStrategyService } from '../core/services/data-export/csv-export-strategy.service';
import { JsonExportStrategyService } from '../core/services/data-export/json-export-strategy.service';
import { ExportOptions } from '../core/services/data-export/models/export-options.model';

/**
 * Supported file formats for data exportation.
 */
export enum ExportFormat {
    JSON = 'json',
    CSV = 'csv',
}

/**
 * Orchestrator service for data exportation.
 * It uses the Strategy Pattern to delegate the download logic to the appropriate
 * format-specific service based on the requested ExportFormat.
 */
@Injectable({ providedIn: 'root' })
export class DataExportService {
    private readonly jsonStrategy = inject(JsonExportStrategyService);
    private readonly csvStrategy = inject(CsvExportStrategyService);

    /**
     * Internal resolver to map the ExportFormat enum to the corresponding service implementation.
     * @param format The format to resolve.
     * @returns A service implementing the BaseExportService interface.
     * @throws Error if the provided format does not have a registered strategy.
     */
    private resolveStrategy(format: ExportFormat): BaseExportService {
        switch (format) {
            case ExportFormat.JSON:
                return this.jsonStrategy;
            case ExportFormat.CSV:
                return this.csvStrategy;
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Triggers the file download process for the provided data.
     * @param data The raw data or collection of objects to export.
     * @param format The desired file format (JSON or CSV).
     * @param options Configuration options for the export (filename, headers, etc.).
     */
    download<T>(
        data: T | T[],
        format: ExportFormat,
        options?: ExportOptions<T>,
    ): void {
        const strategy = this.resolveStrategy(format);
        strategy.download(data, options);
    }
}
