import { Injectable } from '@angular/core';
import { Section } from '../models/Section.model';
import { createRandomValueWithTolerance } from '../utils/ValuePattern.utils';

/**
 * Service responsible for calculating numerical data points for simulation sections.
 * It supports various mathematical interpolation patterns (linear, curve, parabolic)
 * and applies random tolerance offsets to the generated values.
 */
@Injectable({ providedIn: 'root' })
export class GenerateSectionService {
    /**
     * Generates an array of all data points defined for a specific section.
     * @param section The section configuration containing the pattern and point count.
     * @returns An array of calculated numeric values.
     */
    generateSectionPoints(section: Section): number[] {
        const points = [];

        for (let i = 0; i < section.numSectionPoints; i++) {
            const point = this.generateSectionPoint(section, i);
            points.push(point);
        }

        return points;
    }

    /**
     * Calculates a single numeric point based on its index and the section's interpolation pattern.
     * @param section The section configuration.
     * @param index The position of the point within the section.
     * @returns The final calculated value with tolerance applied.
     */
    generateSectionPoint(section: Section, index: number): number {
        const { pattern, numSectionPoints } = section;

        const {
            initValue: minValue,
            endValue: maxValue,
            fType,
            minTolerance,
            maxTolerance,
        } = pattern;

        const t = numSectionPoints === 1 ? 1 : index / (numSectionPoints - 1);

        let baseValue: number;

        switch (fType) {
            case 'linear':
                baseValue = minValue + (maxValue - minValue) * t;
                break;

            case 'curve':
                baseValue = minValue + (maxValue - minValue) * Math.pow(t, 2);
                break;

            case 'parabolic':
                baseValue =
                    minValue + (maxValue - minValue) * (4 * t * (1 - t));
                break;

            default:
                throw new Error(`Tipo de función no soportado: ${fType}`);
        }

        baseValue = parseFloat(baseValue.toFixed(2));

        const toleranceOffset = createRandomValueWithTolerance({
            minTolerance,
            maxTolerance,
        });

        return Number((baseValue + toleranceOffset).toFixed(2));
    }
}
