import { Injectable } from '@angular/core';
import { Coordinate } from 'app/models/Sensor.model';
import { GenerationContext } from 'app/models/Simulation-state.model';
import { SimulationEntity } from 'app/models/Simulation.model';

interface PatternContext {
    sensor: Coordinate;
    sectionValue: number;
    timestamp: number;
}

type PatternResolver = (input: string, ctx: PatternContext) => any;
type PatternKey =
    | '^int'
    | '^float'
    | '^bool'
    | '^time'
    | '^pattern'
    | '^positionlong'
    | '^positionlat'
    | '^positioncote'
    | '^positionalias'
    | '^positiondeveui'
    | '^positionjoineui'
    | '^positiondevaddr';

/**
 * Factory service designed to generate simulated data payloads and manage random intervals.
 * It uses a pattern-matching system to resolve dynamic values within simulation parameters.
 */
@Injectable({ providedIn: 'root' })
export class SimulationDataFactoryService {
    private readonly patternMap: Record<PatternKey, PatternResolver> = {
        '^int': (str) => {
            const [_, min, max] = /\[(\d+),(\d+)\]/.exec(str) || [];
            return (
                Math.floor(Math.random() * (Number(max) - Number(min) + 1)) +
                Number(min)
            );
        },
        '^float': (str: string) => {
            const [_, min, max] = /\[(\d+),(\d+)\]/.exec(str) || [];
            return +(
                Math.random() * (Number(max) - Number(min)) +
                Number(min)
            ).toFixed(2);
        },
        '^bool': () => Math.random() < 0.5,
        '^time': (_, ctx) => ctx.timestamp,
        '^pattern': (_, ctx) => ctx.sectionValue,
        '^positionlong': (_, ctx) => ctx.sensor.long,
        '^positionlat': (_, ctx) => ctx.sensor.lat,
        '^positioncote': (_, ctx) => ctx.sensor.height,
        '^positionalias': (_, ctx) => ctx.sensor.alias,
        '^positiondeveui': (_, ctx) => ctx.sensor.dev_eui,
        '^positionjoineui': (_, ctx) => ctx.sensor.join_eui,
        '^positiondevaddr': (_, ctx) => ctx.sensor.dev_addr,
    };

    generatePayload({
        params,
        sensor,
        sectionValue,
        timestamp,
    }: {
        params: SimulationEntity['parameters'];
        sensor: Coordinate;
        sectionValue: number;
        timestamp: number;
    }) {
        const parsedParameters = this.parseParameters(params);
        return this.resolveObjectPatterns(parsedParameters, {
            sensor,
            sectionValue,
            timestamp,
        });
    }

    /**
     * Calculates a random time interval based on simulation constraints.
     */
    getRandomInterval(sim: SimulationEntity): number {
        const {
            minIntervalBetweenRecords: min,
            maxIntervalBetweenRecords: max,
        } = sim;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Determines the number of records to generate in a single instant, respecting limits.
     */
    getRandomRecordsCount(
        sim: SimulationEntity,
        totalGenerated: number = 0,
    ): number {
        return Math.min(
            Math.floor(
                Math.random() *
                    (sim.maxRecordsPerInstant - sim.minRecordsPerInstant + 1),
            ) + sim.minRecordsPerInstant,
            sim.elementsToSimulate - totalGenerated || Infinity,
        );
    }

    private resolveObjectPatterns(obj: any, ctx: PatternContext) {
        if (typeof obj !== 'object' || obj === null) return obj;

        return Object.fromEntries(
            Object.entries(obj).map(([key, val]) => [
                key,
                typeof val === 'string' && val.startsWith('^')
                    ? this.resolvePattern(val, ctx)
                    : typeof val === 'object'
                      ? this.resolveObjectPatterns(val, ctx)
                      : val,
            ]),
        );
    }

    private resolvePattern(value: string, ctx: PatternContext) {
        const prefix = value.split('[')[0].split('(')[0];
        const resolver = this.patternMap[prefix];
        if (!resolver) return value;

        return resolver(value, ctx);
    }

    selectIndex(context: GenerationContext): number {
        const { sensor, simulation, state } = context;
        if (!sensor.coordinates.length) return -1;

        const usedIndexes = state.usedSensorIndexes;

        const canRepeat = !simulation.noRepeat;
        if (canRepeat)
            return Math.floor(Math.random() * sensor.coordinates.length);

        const availableIndexes = sensor.coordinates
            .map((_, index) => index)
            .filter((index) => !usedIndexes.has(index));
        if (!availableIndexes.length) return -1;

        const selectedIndex =
            availableIndexes[
                Math.floor(Math.random() * availableIndexes.length)
            ];
        usedIndexes.add(selectedIndex);

        return selectedIndex;
    }

    parseParameters(parameters: SimulationEntity['parameters']): any {
        if (parameters && typeof parameters === 'object') return parameters;

        if (typeof parameters === 'string') {
            try {
                return JSON.parse(parameters);
            } catch (error) {
                console.error('Error parsing parameters JSON:', error);
                throw new Error(
                    'Los parámetros no tienen un formato JSON válido',
                );
            }
        }

        return {};
    }
}
