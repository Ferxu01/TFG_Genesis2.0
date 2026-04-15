import { Injectable, signal } from '@angular/core';
import { Nullable } from 'app/models/Nullable.model';
import { Pattern } from 'app/models/Pattern.model';

/**
 * Service managing the offline storage and CRUD operations for simulation patterns.
 */
@Injectable({ providedIn: 'root' })
export class PatternOfflineService {
    private readonly _patterns = signal<Pattern[]>([]);

    readonly patterns = this._patterns.asReadonly();

    getPatternById(id: Pattern['id']): Nullable<Pattern> {
        return this._patterns().find((p) => p.id === id) ?? null;
    }

    createPattern(patternData: Pattern): Pattern {
        const newPattern: Pattern = {
            ...patternData,
            id: crypto.randomUUID(),
        };

        this._patterns.update((patterns) => [...patterns, newPattern]);
        return newPattern;
    }

    editPattern(id: Pattern['id'], patternData: Pattern): void {
        this._patterns.update((patterns) =>
            patterns.map((p) => (p.id === id ? { ...patternData, id } : p)),
        );
    }

    deletePattern(id: Pattern['id']): void {
        this._patterns.update((patterns) =>
            patterns.filter((p) => p.id !== id),
        );
    }

    addPatterns(patterns: any): void {
        this._patterns.update((current) => [...current, ...patterns]);
    }
}
