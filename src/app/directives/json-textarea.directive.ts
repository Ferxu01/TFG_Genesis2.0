import { Directive, HostListener } from '@angular/core';

/**
 * Directive that enhances textarea elements to support tab indentation.
 * Specifically useful for JSON or code editing where the 'Tab' key should
 * insert a character instead of changing focus.
 */
@Directive({
    selector: '[appJsonTextarea]',
    standalone: true,
})
export class JsonTextareaDirective {
    /**
     * Listens for keydown events to intercept the 'Tab' key.
     * Prevents the default focus-traversal behavior and inserts a tab character at the cursor position.
     * @param event The native keyboard event.
     */
    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        if (event.key !== 'Tab') return;

        event.preventDefault();

        const textareaElement = event.target as HTMLTextAreaElement;
        const selectionStart = textareaElement.selectionStart;
        const selectionEnd = textareaElement.selectionEnd;

        this.insertTabAtCursor(textareaElement, selectionStart, selectionEnd);
        this.updateCursorPosition(textareaElement, selectionStart);
    }

    /**
     * Injects a tab character into the textarea value, replacing any active selection.
     * @param textarea The target HTML element.
     * @param start Starting position of the cursor or selection.
     * @param end Ending position of the cursor or selection.
     */
    private insertTabAtCursor(
        textarea: HTMLTextAreaElement,
        start: number,
        end: number,
    ): void {
        const currentValue = textarea.value;

        textarea.value =
            currentValue.substring(0, start) +
            '\t' +
            currentValue.substring(end);
    }

    /**
     * Places the cursor immediately after the newly inserted tab character.
     * @param textarea The target HTML element.
     * @param originalStart The cursor position before the insertion.
     */
    private updateCursorPosition(
        textarea: HTMLTextAreaElement,
        originalStart: number,
    ): void {
        const newPosition = originalStart + 1;
        textarea.selectionStart = textarea.selectionEnd = newPosition;
    }
}
