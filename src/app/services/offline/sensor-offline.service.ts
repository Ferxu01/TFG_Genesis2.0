import { Injectable, signal } from '@angular/core';
import { SensorEditRequest, SensorEntity } from 'app/models/Sensor.model';

/**
 * Service responsible for managing the state of a single loaded sensor in offline mode.
 * It provides methods to load, update, and retrieve the current sensor data.
 */
@Injectable({ providedIn: 'root' })
export class SensorOfflineService {
    private readonly loadedSensor = signal<SensorEntity>(null);

    getLoadedSensor(): SensorEntity {
        return this.loadedSensor();
    }

    /**
     * Sets a sensor as the currently loaded sensor.
     * If the sensor lacks a unique identifier, one is generated.
     * @param sensor The sensor data to be loaded.
     */
    loadSensor(sensor): void {
        if (!sensor.id) {
            sensor = {
                ...sensor,
                id: crypto.randomUUID(),
            };
        }

        this.loadedSensor.set(sensor);
    }

    /**
     * Updates the currently loaded sensor with new data.
     * @param sensorUpdate The partial or full sensor data for the update.
     */
    updateSensor(sensor: SensorEditRequest): void {
        const newSensor: SensorEntity = {
            ...sensor,
            id: sensor.id ?? crypto.randomUUID(),
        };

        this.loadedSensor.set(newSensor);
    }
}
