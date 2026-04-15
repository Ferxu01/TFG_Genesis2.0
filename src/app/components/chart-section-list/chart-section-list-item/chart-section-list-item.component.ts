import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
    signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Pattern } from 'app/models/Pattern.model';
import { Section } from 'app/models/Section.model';
import { TimePipe } from 'app/pipes/time.pipe';

/**
 * Component responsible for displaying and managing an individual section item within a chart list.
 * It handles interactions for section removal confirmation and editing requests.
 */
@Component({
    selector: 'chart-section-list-item',
    templateUrl: './chart-section-list-item.component.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIconModule, MatButtonModule, TimePipe],
})
export class ChartSectionListItemComponent {
    @Input({ required: true }) set section(value: Section) {
        this.currentSection.set(value);
    }

    protected isConfirmationModalVisible = false;

    @Output() removedSection = new EventEmitter<void>();
    @Output() editSection = new EventEmitter<Pattern>();

    protected readonly currentSection = signal<Section | null>(null);

    protected showConfirmModal(): void {
        this.isConfirmationModalVisible = true;
    }

    protected onCancelRemove(): void {
        this.isConfirmationModalVisible = false;
    }

    protected remove(): void {
        this.removedSection.emit();
        this.isConfirmationModalVisible = false;
    }

    protected edit(): void {
        this.editSection.emit();
    }
}
