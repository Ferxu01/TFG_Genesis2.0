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
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { ExportDataButtonComponent } from 'app/components/export-data-button/export-data-button.component';
import { ImportDataButtonComponent } from 'app/components/import-data-button/import-data-button.component';
import { NotificationService } from 'app/core/services/notification.service';
import { CoordinateForm, SensorForm } from 'app/models/forms.model';
import {
    Coordinate,
    SensorCreateRequest,
    SensorEditRequest,
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
        MatSelectModule,
        MatButtonToggleModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        A11yModule,
        ImportDataButtonComponent,
        ExportDataButtonComponent,
    ],
})
export class SensorFormComponent implements OnDestroy {
    private readonly notificationService = inject(NotificationService);
    private readonly sensorOfflineService = inject(SensorOfflineService);
    private readonly _cdr = inject(ChangeDetectorRef);

    protected readonly sensorForm = new FormGroup<SensorForm>({
        name: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
        coordinates: new FormArray<FormGroup<CoordinateForm>>([], {
            validators: [Validators.required, Validators.minLength(1)],
        }),
    });

    private readonly sensorId = computed(() => this.sensorData()?.id ?? null);

    // Pending data imported from the import dialog, waiting for user confirmation on how to integrate it with the existing patterns.
    private readonly pendingImportData = signal<any>(null);

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
        this.sensorOfflineService.getLoadedSensor(),
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

    protected get coordinates(): FormArray {
        return this.sensorForm.get('coordinates') as FormArray;
    }

    /**
     * Adds a new coordinate group to the form array.
     * @param coord Optional data to populate the new coordinate group.
     */
    protected addCoordinate(coord: Coordinate | null = null): void {
        this.coordinates.push(this.buildCoordinateGroup(coord));
    }

    protected removeCoordinate(control: AbstractControl): void {
        const index = this.coordinates.controls.indexOf(control);
        if (index === -1) return;
        this.coordinates.removeAt(index);
    }

    protected handleSearchChange(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        this.searchQuery.set(inputElement.value);
    }

    private saveSensorData(): void {
        const payload = this.assemblePayload() as SensorEditRequest;
        this.sensorOfflineService.updateSensor(payload);

        this.notificationService.success(
            'Datos de los sensores actualizados correctamente',
        );
    }

    /**
     * Maps form values into a payload structure compatible with API/Service requests.
     * @returns A structured request object for creation or editing.
     */
    private assemblePayload(): SensorCreateRequest | SensorEditRequest {
        const { name, coordinates } = this.sensorForm.getRawValue();
        const mappedCoordinates = coordinates.map((coordinate) => ({
            lat: Number(coordinate.lat),
            long: Number(coordinate.long),
            height: Number(coordinate.height),
            alias: coordinate.alias,
            dev_eui: coordinate.dev_eui,
            join_eui: coordinate.join_eui,
            dev_addr: coordinate.dev_addr,
        }));

        const payload = {
            name,
            coordinates: mappedCoordinates,
        };

        if (!this.sensorId()) return payload;

        return {
            ...payload,
            id: this.sensorId(),
        };
    }

    protected handleDataImport(data: unknown): void {
        this.pendingImportData.set(data);
        const notExistingCoordinates = !!this.coordinates.length;

        if (!notExistingCoordinates) return this.executeDirectImport();

        this.showDataImportedDialog.set(true);
    }

    protected appendImportedData(): void {
        const pendingData = this.pendingImportData();
        if (!pendingData || !pendingData.coordinates.length) return;

        const currentData = this.sensorOfflineService.getLoadedSensor();
        const updatedCoordinates = [
            ...(currentData?.coordinates ?? []),
            ...pendingData.coordinates,
        ];
        const updatedSensorData = {
            ...currentData,
            name: currentData?.name || pendingData.name || '',
            coordinates: updatedCoordinates,
        };

        this.sensorOfflineService.loadSensor(updatedSensorData);
        this.populateFormFromImport();
        this.notificationService.success('Sensores añadidos a la lista actual');
    }

    protected replaceWithImportedData(): void {
        const pendingData = this.pendingImportData();
        this.sensorOfflineService.loadSensor(pendingData);
        this.populateFormFromImport();
        this.notificationService.success(
            'Lista de sensores reemplazada correctamente',
        );
    }

    protected closeImportDialog(): void {
        this.pendingImportData.set(null);
        this.showDataImportedDialog.set(false);
    }

    private executeDirectImport(): void {
        const pendingData = this.pendingImportData();
        if (!pendingData) return;

        this.sensorOfflineService.loadSensor(pendingData);
        this.populateFormFromImport();
        this.notificationService.success(
            'Datos de los sensores cargados correctamente',
        );
    }

    private buildCoordinateGroup(
        coordinate: any = null,
    ): FormGroup<CoordinateForm> {
        return new FormGroup<CoordinateForm>({
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
        const sensorData = this.sensorData();
        if (!sensorData) {
            return this.notificationService.error(
                'Hubo un error al cargar los datos de los sensores',
            );
        }

        this.sensorForm.reset();

        this.sensorForm.patchValue({
            name: sensorData.name ?? '',
        });

        this.coordinates.clear();

        if (!sensorData.coordinates.length) return this.addCoordinate();

        sensorData.coordinates.forEach((coord) =>
            this.coordinates.push(this.buildCoordinateGroup(coord)),
        );
    }

    ngOnDestroy(): void {
        this.saveSensorData();
    }
}
