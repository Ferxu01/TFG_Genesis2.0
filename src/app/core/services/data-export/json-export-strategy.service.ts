import { Injectable } from '@angular/core';
import { BaseExportService } from './base-export.service';
import { ExportDataStrategy } from './models/export-data-strategy';
import { ExportOptions } from './models/export-options.model';

/**
 * Concrete implementation of BaseExportService for JSON format.
 * It converts data structures into a formatted JSON string, allowing for
 * optional data mapping before serialization.
 */
@Injectable({ providedIn: 'root' })
export class JsonExportStrategyService<T>
    extends BaseExportService<T>
    implements ExportDataStrategy
{
    protected readonly mimeType = 'application/json';
    protected readonly fileExtension = '.json';

    /**
     * Transforms the input data into a prettified JSON string.
     * @param data The source data (object or array) to be serialized.
     * @param options Configuration including an optional mapper to transform items before export.
     * @returns A string representing the JSON content, indented with 2 spaces.
     */
    protected buildContent(data: T | T[], options?: ExportOptions<T>): string {
        const arrayData = Array.isArray(data) ? data : [data];
        if (!arrayData.length) return '';

        const dataMapper = options?.mapper;
        const processedData = dataMapper ? arrayData.map(dataMapper) : data;

        return JSON.stringify(processedData, null, 2);
    }
}
