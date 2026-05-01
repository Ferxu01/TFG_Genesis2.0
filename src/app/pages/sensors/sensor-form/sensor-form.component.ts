import { A11yModule } from '@angular/cdk/a11y';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    computed,
    effect,
    inject,
    OnDestroy,
    signal,
    untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
    AbstractControl,
    FormArray,
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ExportDataButtonComponent } from 'app/components/export-data-button/export-data-button.component';
import { ImportDataButtonComponent } from 'app/components/import-data-button/import-data-button.component';
import { NotificationService } from 'app/core/services/notification.service';
import { SensorCoordinateForm } from 'app/models/forms.model';
import {
    Coordinate,
    SensorCreateRequest,
    SensorsEntity,
} from 'app/models/Sensor.model';
import { SensorOfflineService } from 'app/services/offline/sensor-offline.service';
import { startWith } from 'rxjs';

/**
 * Component for managing sensor configurations and their geographic coordinates.
 * Supports dynamic addition/removal of coordinates and bulk data import/export
 * using offline storage synchronization.
 */
@Component({
    selector: 'sensor-form',
    templateUrl: './sensor-form.component.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonToggleModule,
        FormsModule,
        ReactiveFormsModule,
        A11yModule,
        ImportDataButtonComponent,
        ExportDataButtonComponent,
    ],
})
export class SensorFormComponent implements OnDestroy {
    private readonly notificationService = inject(NotificationService);
    private readonly sensorOfflineService = inject(SensorOfflineService);
    private readonly _cdr = inject(ChangeDetectorRef);

    protected readonly coordinates = new FormArray<
        FormGroup<SensorCoordinateForm>
    >([], {
        validators: [Validators.required, Validators.minLength(1)],
    });

    // Pending data imported from the import dialog, waiting for user confirmation on how to integrate it with the existing patterns.
    private readonly pendingImportData = signal<SensorsEntity>([]);

    // Watch for changes in the coordinates form array to trigger re-evaluation of filteredSensors
    private readonly coordinatesSignal = toSignal(
        this.coordinates.valueChanges.pipe(startWith(this.coordinates.value)),
    );
    protected readonly searchQuery = signal('');
    protected readonly filteredSensors = computed(() => {
        const searchQuery = this.searchQuery().toLowerCase().trim();
        const controls = this.coordinates.controls;

        // Re-execute when any form input changes
        this.coordinatesSignal();

        if (!searchQuery) return controls;

        return controls.filter((control) => {
            const val = control.value;
            const matches =
                val.alias?.toLowerCase().includes(searchQuery) ||
                val.dev_eui?.toLowerCase().includes(searchQuery) ||
                val.join_eui?.toLowerCase().includes(searchQuery) ||
                val.dev_addr?.toLowerCase().includes(searchQuery);

            return matches;
        });
    });

    protected readonly showDataImportedDialog = signal(false);

    protected readonly sensorData = computed(() =>
        this.sensorOfflineService.getLoadedSensors(),
    );
    protected readonly isSensorDataImported = computed(
        () => !!this.sensorData(),
    );

    constructor() {
        effect(() => {
            const sensorData = this.sensorData();
            if (!sensorData) return;

            untracked(() => {
                this.populateFormFromImport();
            });

            // Force change detection to update the view with the loaded sensor data when changing from other page to this one
            // Because usage of OnPush strategy here
            this._cdr.detectChanges();
        });
    }

    /**
     * Adds a new coordinate group to the form array.
     * @param coord Optional data to populate the new coordinate group.
     */
    protected addCoordinate(coord: Coordinate | null = null): void {
        this.coordinates.push(this.buildCoordinateGroup(coord));
    }

    protected removeSensor(control: AbstractControl): void {
        const index = this.coordinates.controls.indexOf(
            control as FormGroup<SensorCoordinateForm>,
        );
        if (index === -1) return;
        this.coordinates.removeAt(index);
    }

    protected handleSearchChange(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        this.searchQuery.set(inputElement.value);
    }

    private saveSensorData(): void {
        const payload = this.assemblePayload() as SensorCreateRequest;
        this.sensorOfflineService.loadSensors(payload);

        this.notificationService.success(
            'Datos de los sensores actualizados correctamente',
        );
    }

    /**
     * Maps form values into a payload structure compatible with API/Service requests.
     * @returns A structured request object for creation or editing.
     */
    private assemblePayload(): SensorCreateRequest {
        return this.coordinates.getRawValue().map((coordinate) => ({
            lat: Number(coordinate.lat),
            long: Number(coordinate.long),
            height: Number(coordinate.height),
            alias: coordinate.alias,
            dev_eui: coordinate.dev_eui,
            join_eui: coordinate.join_eui,
            dev_addr: coordinate.dev_addr,
        }));
    }

    protected handleDataImport(data: SensorsEntity): void {
        if (!this.isValidSensorData(data)) {
            return this.notificationService.error(
                'Formato no válido. Asegúrese de que todos los sensores tengan el formato correcto.',
            );
        }

        this.pendingImportData.set(data);
        const existingCoordinates = !!this.coordinates.length;

        if (!existingCoordinates) return this.executeDirectImport();

        this.showDataImportedDialog.set(true);
    }

    protected appendImportedData(): void {
        const pendingSensorsData = this.pendingImportData();
        if (!pendingSensorsData.length) return;

        const currentSensorsData = this.sensorOfflineService.getLoadedSensors();
        const updatedCoordinates = [
            ...(currentSensorsData ?? []),
            ...pendingSensorsData,
        ];

        this.sensorOfflineService.loadSensors(updatedCoordinates);
        this.populateFormFromImport();
        this.notificationService.success('Sensores añadidos a la lista actual');
    }

    protected replaceWithImportedData(): void {
        const pendingData = this.pendingImportData();
        this.sensorOfflineService.loadSensors(pendingData);
        this.populateFormFromImport();
        this.notificationService.success(
            'Lista de sensores reemplazada correctamente',
        );
    }

    protected closeImportDialog(): void {
        this.pendingImportData.set([]);
        this.showDataImportedDialog.set(false);
    }

    private executeDirectImport(): void {
        const pendingData = this.pendingImportData();
        if (!pendingData) return;

        this.sensorOfflineService.loadSensors(pendingData);
        this.populateFormFromImport();
        this.notificationService.success(
            'Datos de los sensores cargados correctamente',
        );
    }

    private buildCoordinateGroup(
        coordinate: any = null,
    ): FormGroup<SensorCoordinateForm> {
        return new FormGroup<SensorCoordinateForm>({
            lat: new FormControl(coordinate?.lat ?? '', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            long: new FormControl(coordinate?.long ?? '', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            height: new FormControl(coordinate?.height ?? '', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            alias: new FormControl(coordinate?.alias ?? '', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            dev_eui: new FormControl(coordinate?.dev_eui ?? '', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            join_eui: new FormControl(coordinate?.join_eui ?? '', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            dev_addr: new FormControl(coordinate?.dev_addr ?? '', {
                nonNullable: true,
                validators: [Validators.required],
            }),
        });
    }

    /**
     * Recursively marks all controls as touched to expose validation errors.
     */

    private populateFormFromImport(): void {
        const sensorsData = this.sensorData();
        if (!sensorsData) {
            return this.notificationService.error(
                'Hubo un error al cargar los datos de los sensores',
            );
        }

        this.coordinates.clear({ emitEvent: false });

        if (!sensorsData.length) return this.addCoordinate();

        sensorsData.forEach((coord) =>
            this.coordinates.push(this.buildCoordinateGroup(coord), {
                emitEvent: false,
            }),
        );
    }

    /**
     * Validate if the imported data has the required structure to be processed
     */
    private isValidSensorData(data: any): boolean {
        if (!data || typeof data !== 'object') return false;

        // Normalizamos a array para validar (soporta un solo objeto o una lista)
        const items = Array.isArray(data) ? data : [data];
        if (items.length === 0) return false;

        return items.every((item) => {
            return (
                item &&
                typeof item === 'object' &&
                // Validamos campos numéricos
                typeof item.lat === 'number' &&
                typeof item.long === 'number' &&
                typeof item.height === 'number' &&
                // Validamos campos de texto (que no sean solo espacios)
                typeof item.alias === 'string' &&
                item.alias.trim() !== '' &&
                typeof item.dev_eui === 'string' &&
                item.dev_eui.trim() !== '' &&
                typeof item.join_eui === 'string' &&
                item.join_eui.trim() !== '' &&
                typeof item.dev_addr === 'string' &&
                item.dev_addr.trim() !== ''
            );
        });
    }

    ngOnDestroy(): void {
        this.saveSensorData();
    }
}
