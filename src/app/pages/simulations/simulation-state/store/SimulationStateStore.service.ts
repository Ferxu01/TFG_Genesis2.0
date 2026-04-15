import { Injectable } from '@angular/core';
import {
    SimulationRecords,
    SimulationState,
} from 'app/models/Simulation-state.model';
import { SimulationEntity } from 'app/models/Simulation.model';
import { BehaviorSubject, map, Observable } from 'rxjs';

type SimulationId = SimulationEntity['id'];
type ReadonlySimulationState = Readonly<Record<SimulationId, SimulationState>>;

/**
 * Reactive store that manages the state of all simulations in the application.
 * It provides methods to update simulation progress, manage records, and track lifecycle status.
 */
@Injectable({ providedIn: 'root' })
export class SimulationStateStore {
    private readonly simulationsState$ =
        new BehaviorSubject<ReadonlySimulationState>({});

    getSimulationState(
        simulationId: SimulationId,
    ): Observable<SimulationState | null> {
        return this.simulationsState$.pipe(map((state) => state[simulationId]));
    }

    /**
     * Retrieves all simulations that are currently running or not yet closed from the UI.
     */
    getActiveSimulations(): Observable<SimulationState[]> {
        return this.simulationsState$.pipe(
            map((states) =>
                Object.values(states).filter(
                    (state) => state.isRunning || !state.isFinished,
                ),
            ),
        );
    }

    getStateValue(id: number): SimulationState | null {
        return this.simulationsState$.value[id] ?? null;
    }

    updateState(id: number, changes: Partial<SimulationState>): void {
        const current = this.simulationsState$.value;
        const prev = current[id];
        if (!prev) return;

        this.simulationsState$.next({
            ...current,
            [id]: { ...prev, ...changes },
        });
    }

    addRecords(id: SimulationId, newRecords: SimulationRecords): void {
        const current = this.simulationsState$.value;
        const state = current[id];
        if (!state) return;

        const totalGenerados =
            (state.currentGenerated ?? 0) + newRecords.length;

        this.simulationsState$.next({
            ...current,
            [id]: {
                ...state,
                records: [...(state.records ?? []), ...newRecords],
                currentGenerated: totalGenerados,
            },
        });
    }

    setInitialState(simulation: SimulationEntity, isRunning = true): void {
        const initialState: SimulationState = {
            simulation,
            sensor: null,
            records: [],
            isRunning,
            isPaused: false,
            isFinished: false,
            elapsedTime: 0,
            currentGenerated: 0,
        };
        this.simulationsState$.next({
            ...this.simulationsState$.value,
            [simulation.id]: initialState,
        });
    }
}
