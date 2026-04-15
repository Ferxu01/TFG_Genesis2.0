import { inject, Injectable } from '@angular/core';
import { SimulationEntity } from 'app/models/Simulation.model';
import { SimulationStateStore } from '../store/SimulationStateStore.service';

/**
 * Service responsible for managing time tracking for active simulations.
 * It handles individual intervals to increment the elapsed time of each simulation.
 */
@Injectable({ providedIn: 'root' })
export class SimulationTimerService {
    private readonly store = inject(SimulationStateStore);
    private timers: { [key: SimulationEntity['id']]: any } = {};

    startTimer(simId: SimulationEntity['id']): void {
        this.stopTimer(simId);

        this.timers[simId] = setInterval(() => {
            const state = this.store.getStateValue(simId);
            if (!state || state.isPaused) return;
            this.store.updateState(simId, {
                elapsedTime: state.elapsedTime + 1,
            });
        }, 1000);
    }

    stopTimer(simId: SimulationEntity['id']): void {
        if (this.timers[simId]) clearInterval(this.timers[simId]);
        delete this.timers[simId];
    }

    clearAll(): void {
        Object.values(this.timers).forEach(clearInterval);
        this.timers = {};
    }
}
