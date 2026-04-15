import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    ContentChild,
    EventEmitter,
    HostBinding,
    Input,
    Output,
    TemplateRef,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Pattern } from 'app/models/Pattern.model';
import { Section } from '../../models/Section.model';
import { ChartSectionListItemComponent } from './chart-section-list-item/chart-section-list-item.component';

export interface SectionReorderEvent {
    previousIndex: number;
    currentIndex: number;
}

interface SectionEditRequest {
    index: number;
    pattern: Pattern;
}

/**
 * Component that manages a list of chart sections.
 * It provides functionality for reordering items via drag-and-drop,
 * removing sections, and handling edit requests using custom templates.
 */
@Component({
    selector: 'chart-section-list',
    templateUrl: './chart-section-list.component.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatIconModule,
        DragDropModule,
        NgTemplateOutlet,
        ChartSectionListItemComponent,
    ],
})
export class ChartSectionListComponent {
    /** Sets the default layout classes for the component host. */
    @HostBinding('class') class = 'flex flex-col gap-2 mt-2';

    @Input({ required: true }) sections: Pattern[] = [];

    /** The index of the section currently being edited, if any. */
    @Input() activeEditingIndex: number | null = null;

    /** Notifies when a section has been moved to a new position. */
    @Output() sectionReordered = new EventEmitter<SectionReorderEvent>();

    /** Notifies when a section has been requested for removal. */
    @Output() sectionRemoved = new EventEmitter<number>();

    /** Notifies when a section has been selected for editing. */
    @Output() editRequested = new EventEmitter<SectionEditRequest>();

    @ContentChild('editSectionTemplate', { read: TemplateRef })
    protected editSectionTemplate?: TemplateRef<SectionEditRequest>;

    /**
     * Handles the drag-and-drop drop event.
     * Only emits the reorder event if the position has actually changed.
     * * @param event The CDK Drag-Drop event containing index information.
     */
    protected handleSectionDrop(event: CdkDragDrop<Section[]>): void {
        const { previousIndex, currentIndex } = event;
        if (previousIndex === currentIndex) return;
        this.sectionReordered.emit({ previousIndex, currentIndex });
    }

    /**
     * Emits the index of the section to be removed.
     * @param index The position of the section in the list.
     */
    protected removeSection(index: number): void {
        this.sectionRemoved.emit(index);
    }

    /**
     * Emits an edit request containing the section's pattern and its index.
     * @param pattern The pattern data associated with the section.
     * @param index The position of the section in the list.
     */
    protected requestEdit(pattern: Pattern, index: number): void {
        this.editRequested.emit({ pattern, index });
    }
}
