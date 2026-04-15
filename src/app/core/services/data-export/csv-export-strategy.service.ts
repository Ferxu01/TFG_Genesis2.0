import { Injectable } from '@angular/core';
import { BaseExportService } from './base-export.service';
import { ExportDataStrategy } from './models/export-data-strategy';
import { ExportOptions } from './models/export-options.model';

/**
 * Concrete implementation of BaseExportService for CSV format.
 * It transforms data objects into a semicolon-separated values string,
 * handling specific formatting for numbers and strings to ensure Excel compatibility.
 */
@Injectable({ providedIn: 'root' })
export class CsvExportStrategyService<T>
    extends BaseExportService<T>
    implements ExportDataStrategy
{
    protected readonly mimeType = 'text/csv;charset=utf-8;';
    protected readonly fileExtension = '.csv';

    /**
     * Transforms the provided data into a CSV formatted string.
     * It uses the object keys as headers and applies mapping and formatting to each row.
     * @param data Array of items to be exported.
     * @param options Configuration including an optional mapper function for data transformation.
     * @returns A string representing the CSV content.
     */
    protected buildContent(data: T[], options?: ExportOptions<T>): string {
        if (!data || data.length === 0) return '';

        const dataMapper = options?.mapper ?? ((item: any) => item);
        const processedData = data.map(dataMapper);
        const columnHeaders = Object.keys(processedData[0]);

        const csvHeaderRow = columnHeaders.join(';');

        const csvDataRows = processedData.map((record) =>
            columnHeaders
                .map((key) => this.formatCsvValue(record[key]))
                .join(';'),
        );

        return [csvHeaderRow, ...csvDataRows].join('\n');
    }

    /**
     * Formats individual values for CSV compatibility.
     * - Numbers: Fixed to 2 decimals with comma as separator.
     * - Strings: Wrapped in double quotes with escaped internal quotes.
     * @param value The raw value to be formatted.
     * @returns A formatted string representation of the value.
     */
    private formatCsvValue(value: any): string {
        if (typeof value === 'number')
            return value.toFixed(2).replace('.', ',');

        if (typeof value === 'string') {
            const escapedString = value.replace(/"/g, '""');
            return `"${escapedString}"`;
        }

        return value ?? '';
    }
}
