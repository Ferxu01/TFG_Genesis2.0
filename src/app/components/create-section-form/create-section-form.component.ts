import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
    signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Pattern } from 'app/models/Pattern.model';

/**
 * Component that provides a form to either create a new section or edit an existing one
 * by selecting a pattern from a list.
 */
@Component({
    selector: 'create-section-form',
    templateUrl: './create-section-form.component.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatButtonModule, MatOptionModule, MatSelectModule, MatIconModule],
})
export class CreateSectionFormComponent {
    /** Sets the available patterns to be displayed in the selection dropdown. */
    @Input() set patterns(value: Pattern[]) {
        this.availablePatterns.set(value);
    }

    /** * Determines the mode of the form.
     * If true, the form behaves as an editor; otherwise, it acts as a creator.
     */
    @Input() set editing(value: boolean) {
        this.isEditMode.set(value);
    }
    @Input() disabled = false;

    @Output() create = new EventEmitter<Pattern>();
    @Output() edit = new EventEmitter<Pattern>();
    @Output() cancel = new EventEmitter<void>();

    /** Internal state to track if we are in edit or creation mode. */
    private readonly isEditMode = signal(false);

    protected readonly availablePatterns = signal<Pattern[]>([]);
    protected readonly selectedPatternId = signal<Pattern['id'] | null>(null);

    protected handleCancel(): void {
        this.cancel.emit();
        this.selectedPatternId.set(null);
    }

    protected handleConfirmation(): void {
        const selectedPattern = this.selectedPatternId();
        if (!selectedPattern) return;

        const pattern = this.availablePatterns().find(
            (pattern) => pattern.id === selectedPattern,
        );
        if (!pattern) return;

        if (this.isEditMode()) this.edit.emit(pattern);
        else this.create.emit(pattern);
    }
}
