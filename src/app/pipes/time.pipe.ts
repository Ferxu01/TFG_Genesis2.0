import { Pipe, PipeTransform } from '@angular/core';

/** Supported display formats for the duration transformation. */
type DurationFormat = 'hh:mm:ss' | 'long' | 'short';

/**
 * Pipe that transforms a numeric value (representing total seconds) into a readable time duration string.
 * Supports digital clock format (hh:mm:ss), long descriptive format, and short abbreviated format.
 */
@Pipe({
    name: 'time',
    standalone: true,
})
export class TimePipe implements PipeTransform {
    /**
     * Transforms seconds into the specified duration string format.
     * @param value The total number of seconds to format.
     * @param format The desired output style: 'hh:mm:ss', 'long', or 'short'.
     * @returns A formatted string or an empty string if the value is invalid.
     */
    transform(
        value: number | null | undefined,
        format: DurationFormat = 'hh:mm:ss',
    ): string {
        if (value === null || value === undefined || isNaN(value)) return '';

        const totalSeconds = Math.floor(value);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        switch (format) {
            case 'long':
                return this.formatLong(hours, minutes, seconds);

            case 'short':
                return this.formatShort(hours, minutes, seconds);

            case 'hh:mm:ss':
            default:
                return this.formatDigital(hours, minutes, seconds);
        }
    }

    /**
     * Formats the time in a digital clock style (00:00:00).
     */
    private formatDigital(
        hours: number,
        minutes: number,
        seconds: number,
    ): string {
        return `${this.padValue(hours)}:${this.padValue(minutes)}:${this.padValue(seconds)}`;
    }

    /**
     * Adds a leading zero to numbers below 10.
     */
    private padValue(value: number): string {
        return value.toString().padStart(2, '0');
    }

    /**
     * Formats the time using full English words (e.g., "1 hour 2 minutes").
     */
    private formatLong(
        hours: number,
        minutes: number,
        seconds: number,
    ): string {
        const timeParts: string[] = [];

        if (hours > 0)
            timeParts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
        if (minutes > 0)
            timeParts.push(
                `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`,
            );
        if (seconds > 0)
            timeParts.push(
                `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`,
            );

        return timeParts.length > 0 ? timeParts.join(' ') : '0 segundos';
    }

    /**
     * Formats the time using short abbreviations (e.g., "1h 2m 5s").
     */
    private formatShort(
        hours: number,
        minutes: number,
        seconds: number,
    ): string {
        const timeParts: string[] = [];

        if (hours > 0) timeParts.push(`${hours}h`);
        if (minutes > 0) timeParts.push(`${minutes}m`);

        if (seconds > 0 || timeParts.length === 0) {
            timeParts.push(`${seconds}s`);
        }

        return timeParts.join(' ');
    }
}
