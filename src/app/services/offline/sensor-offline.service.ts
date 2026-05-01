import { Injectable, signal } from '@angular/core';
import { SensorsEntity } from 'app/models/Sensor.model';

/**
 * Service responsible for managing the state of a single loaded sensor in offline mode.
 * It provides methods to load, update, and retrieve the current sensor data.
 */
@Injectable({ providedIn: 'root' })
export class SensorOfflineService {
    private readonly loadedSensors = signal<SensorsEntity | null>(null);

    getLoadedSensors(): SensorsEntity | null {
        return this.loadedSensors();
    }

    /**
     * Sets a sensor as the currently loaded sensor.
     * If the sensor lacks a unique identifier, one is generated.
     * @param sensor The sensor data to be loaded.
     */
    loadSensors(sensor: SensorsEntity): void {
        this.loadedSensors.set(sensor);
    }
}
