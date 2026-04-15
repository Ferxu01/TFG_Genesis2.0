import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';

interface ExportDialogData {
    title?: string;
    message?: string;
    defaultFormat?: ExportFormat;
}

type ExportFormat = 'csv' | 'json';

export interface ExportDialogResult {
    confirmed: boolean;
    format?: ExportFormat;
}

/**
 * A reusable dialog component that prompts the user to select a file format
 * (CSV or JSON) before proceeding with a data export operation.
 */
@Component({
    selector: 'export-format-dialog',
    templateUrl: './export-format-dialog.component.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatDialogModule,
        MatButtonModule,
        MatRadioModule,
        ReactiveFormsModule,
    ],
})
export class ExportFormatDialogComponent {
    private readonly dialogRef = inject(
        MatDialogRef<ExportFormatDialogComponent, ExportDialogResult>,
    );

    protected readonly dialogConfig = inject<ExportDialogData>(MAT_DIALOG_DATA);

    /** Form control to track the user's selected export format. */
    protected readonly formatControl = new FormControl<ExportFormat>(
        this.dialogConfig?.defaultFormat ?? 'csv',
        { nonNullable: true },
    );

    protected handleConfirm(): void {
        this.dialogRef.close({
            confirmed: true,
            format: this.formatControl.value,
        });
    }

    protected handleCancel(): void {
        this.dialogRef.close({ confirmed: false });
    }
}
