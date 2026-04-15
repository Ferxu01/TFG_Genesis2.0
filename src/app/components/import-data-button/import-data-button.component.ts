import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
    signal,
} from '@angular/core';

/**
 * Component that handles file selection and JSON parsing to import data into the application.
 * It provides validation for the file format and emits the parsed content.
 */
@Component({
    selector: 'app-import-data-button',
    templateUrl: './import-data-button.component.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportDataButtonComponent {
    @Input() label?: string;
    @Input() disabled = false;
    @Output() dataImported = new EventEmitter<unknown>();

    /** Internal state for the most recently processed data or error state. */
    protected readonly lastImportedData = signal<unknown>(null);

    /**
     * Handles the file input change event, reads the selected file,
     * and attempts to parse its content as JSON.
     * * @param event The native browser change event from the file input.
     */
    protected handleFileSelection(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        if (!inputElement.files?.length) return;

        const selectedFile = inputElement.files[0];
        this.readFileContent(selectedFile);
    }

    /**
     * Initializes the FileReader to process the selected file.
     * @param file The File object to be read.
     */
    private readFileContent(file: File): void {
        const reader = new FileReader();

        reader.onload = () => {
            this.processFileResult(reader.result as string);
        };

        reader.readAsText(file);
    }

    /**
     * Attempts to parse the file string as JSON and emits the result.
     * If parsing fails, it sets an internal error state.
     * * @param content Raw string content from the file.
     */
    private processFileResult(content: string): void {
        try {
            const parsedContent = JSON.parse(content);
            this.lastImportedData.set(parsedContent);
            this.dataImported.emit(parsedContent);
        } catch (error) {
            // Update state with error information for UI feedback
            this.lastImportedData.set({ error: 'Archivo JSON inválido' });
        }
    }
}
