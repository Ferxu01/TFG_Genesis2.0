import { Injectable } from '@angular/core';
import { ExportOptions } from 'app/core/services/data-export/models/export-options.model';

/**
 * Abstract base service that defines the blueprint for data exportation.
 * It handles the common logic for generating blobs and triggering browser downloads,
 * while leaving the specific content formatting to its subclasses.
 * * @template T The type of data structure to be exported.
 */
@Injectable({ providedIn: 'root' })
export abstract class BaseExportService<T = any> {
    /** The specific file extension for the exported file (e.g., '.json', '.csv'). */
    protected abstract readonly fileExtension: string;

    /** The media type (MIME type) of the content to ensure correct browser handling. */
    protected abstract readonly mimeType: string;

    /** Internal storage for the target file name during the export process. */
    protected exportFileName: string = 'export-data';

    /**
     * Orchestrates the download process: builds content, creates a blob, and triggers the download.
     * @param data The source data (single object or array) to be exported.
     * @param options Optional configuration including custom file names or formatting rules.
     */
    download(data: T | T[], options?: ExportOptions<T>): void {
        if (!data) return;

        this.exportFileName = options?.fileName ?? 'exported-file';

        const content = this.buildContent(data, options);
        const blob = this.createBlob(content);

        this.executeBlobDownload(blob);
    }

    /**
     * Must be implemented by subclasses to transform the raw data into a string format
     * compatible with the specific export type (JSON string, CSV rows, etc.).
     * @param data The data to transform.
     * @param options Export configuration.
     */
    protected abstract buildContent(
        data: T | T[],
        options?: ExportOptions<T>,
    ): string;

    /**
     * Wraps raw content into a Blob object using the service's defined MIME type.
     * @param data The string content to wrap.
     * @returns A Blob representing the file data.
     */
    protected createBlob(data: any): Blob {
        return new Blob([data], { type: this.mimeType });
    }

    /**
     * Creates a temporary URL and an anchor element to trigger the browser's download dialog.
     * @param data The Blob to be downloaded.
     */
    protected executeBlobDownload(data: Blob): void {
        const fullFileName = `${this.exportFileName}${this.fileExtension}`;
        const objectUrl = window.URL.createObjectURL(data);

        const anchorElement = document.createElement('a');
        anchorElement.href = objectUrl;
        anchorElement.download = fullFileName;

        anchorElement.click();

        window.URL.revokeObjectURL(objectUrl);
    }
}
