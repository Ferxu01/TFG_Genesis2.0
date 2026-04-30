import { computed, Injectable, signal } from '@angular/core';
import { SensorEntity } from 'app/models/Sensor.model';
import { SimulationEntity } from 'app/models/Simulation.model';

/**
 * Service dedicated to managing the state of a single simulation in offline mode.
 * It handles the loading, updating, and association of sensors to the simulation.
 */
@Injectable({ providedIn: 'root' })
export class SimulationOfflineService {
    private readonly loadedSimulation = signal<SimulationEntity>(null);

    public readonly usingPatternIds = computed(() => {
        const simulation = this.loadedSimulation();
        if (!simulation || !simulation.sections) return new Set<string>();

        return new Set(
            simulation.sections.map((section) => section.pattern.id),
        );
    });

    getLoadedSimulation(): SimulationEntity {
        return this.loadedSimulation();
    }

    /**
     * Sets a simulation as the current state.
     * Automatically generates a unique identifier if one is not provided.
     * @param simulation The simulation data to load.
     */
    loadSimulation(simulation: any): void {
        if (!simulation.id) {
            simulation = {
                ...simulation,
                id: crypto.randomUUID(),
            };
        }

        this.loadedSimulation.set(simulation);
    }

    /**
     * Updates the current simulation state with new data.
     * @param updatedData The partial or full simulation object to update.
     */
    updateSimulation(simulation: any): void {
        const newSimulation: SimulationEntity = {
            ...simulation,
            id: simulation.id ?? crypto.randomUUID(),
        };

        this.loadedSimulation.set(newSimulation);
    }

    attachSensorToSimulation(sensorId: SensorEntity['id']): void {
        const simulation = this.loadedSimulation();
        if (!simulation) return;

        this.loadedSimulation.set({
            ...simulation,
            sensorId,
        });
    }
}
