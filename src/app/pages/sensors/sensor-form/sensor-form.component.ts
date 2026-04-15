import { A11yModule } from '@angular/cdk/a11y';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import {
    FormArray,
    FormControl,
    FormGroup,
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
        ReactiveFormsModule,
        RouterModule,
        A11yModule,
        ImportDataButtonComponent,
        ExportDataButtonComponent,
    ],
})
export class SensorFormComponent {
    private readonly notificationService = inject(NotificationService);
    private readonly sensorOfflineService = inject(SensorOfflineService);

    private readonly sensorId = computed(() => this.sensorData()?.id ?? null);

    protected readonly sensorForm = new FormGroup<SensorForm>({
        name: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
        coordinates: new FormArray<FormGroup<CoordinateForm>>([], {
            validators: [Validators.required, Validators.minLength(1)],
        }),
    });

    protected readonly isSubmitting = signal(false);
    protected readonly isEditMode = computed(() => !!this.sensorId());

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

            this.populateFormFromImport();
        });
    }

    protected get coordinates(): FormArray {
        return this.sensorForm.get('coordinates') as FormArray;
    }

    protected handleFormSubmit(): void {
        if (this.sensorForm.invalid || this.isSubmitting())
            return this.validateFormStructure(this.sensorForm);

        this.isSubmitting.set(true);
        this.sensorForm.disable();

        try {
            this.saveSensorData();
            this.notificationService.success(
                'Datos de los sensores actualizados correctamente',
            );
        } catch (error) {
            this.notificationService.error(
                'Hubo un error actualizando los datos del sensor',
            );
        } finally {
            this.isSubmitting.set(false);
            this.sensorForm.enable();
        }
    }

    /**
     * Adds a new coordinate group to the form array.
     * @param coord Optional data to populate the new coordinate group.
     */
    protected addCoordinate(coord: Coordinate | null = null): void {
        this.coordinates.push(this.buildCoordinateGroup(coord));
    }

    protected removeCoordinate(index: number): void {
        this.coordinates.removeAt(index);
    }

    private saveSensorData(): void {
        const payload = this.assemblePayload() as SensorEditRequest;
        this.sensorOfflineService.updateSensor(payload);
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
        this.sensorOfflineService.loadSensor(data);
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
    private validateFormStructure(formGroup: FormGroup | FormArray): void {
        Object.values(formGroup.controls).forEach((control) => {
            if (control instanceof FormGroup || control instanceof FormArray)
                this.validateFormStructure(control);
            else control.markAsTouched();
        });
    }

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
}
