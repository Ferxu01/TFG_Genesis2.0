import { ClipboardModule } from '@angular/cdk/clipboard';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
    FormArray,
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import {
    ChartSectionListComponent,
    SectionReorderEvent,
} from 'app/components/chart-section-list/chart-section-list.component';
import { CreateSectionFormComponent } from 'app/components/create-section-form/create-section-form.component';
import { ExportDataButtonComponent } from 'app/components/export-data-button/export-data-button.component';
import { ImportDataButtonComponent } from 'app/components/import-data-button/import-data-button.component';
import { NotificationService } from 'app/core/services/notification.service';
import { JsonTextareaDirective } from 'app/directives/json-textarea.directive';
import {
    PatternFormModel,
    SectionFormModel,
    SimulationFormModel,
} from 'app/models/forms.model';
import { Pattern } from 'app/models/Pattern.model';
import { Section } from 'app/models/Section.model';
import { SensorEntity } from 'app/models/Sensor.model';
import { SimulationEntity } from 'app/models/Simulation.model';
import { ActiveSimulationComponent } from 'app/pages/simulations/components/active-simulation/active-simulation.component';
import { PatternOfflineService } from 'app/services/offline/pattern-offline.service';
import { SensorOfflineService } from 'app/services/offline/sensor-offline.service';
import { SimulationOfflineService } from 'app/services/offline/simulation-offline.service';
import SIMULATION_PARAMETERS_PLACEHOLDER from 'assets/json/clipboard-simulation-parameters.json';
import { DateTime } from 'luxon';
import {
    BehaviorSubject,
    combineLatest,
    debounceTime,
    filter,
    startWith,
    takeWhile,
    tap,
} from 'rxjs';
import { SimulationViewerComponent } from '../components/simulation-viewer/simulation-viewer.component';
import { SimulationControllerService } from '../simulation-state/controller/SimulationController.service';
import { SimulationStateStore } from '../simulation-state/store/SimulationStateStore.service';

@Component({
    selector: 'simulation-form',
    templateUrl: './simulation-form.component.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DatePipe],
    imports: [
        NgClass,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatButtonToggleModule,
        MatExpansionModule,
        MatTooltipModule,
        MatMenuModule,
        MatCheckboxModule,
        MatDatepickerModule,
        ClipboardModule,
        DragDropModule,
        AsyncPipe,
        JsonTextareaDirective,
        ActiveSimulationComponent,
        SimulationViewerComponent,
        ChartSectionListComponent,
        CreateSectionFormComponent,
        ImportDataButtonComponent,
        ExportDataButtonComponent,
    ],
})
export class SimulationFormComponent implements OnInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly router = inject(Router);
    private readonly sanitizer = inject(DomSanitizer);

    private readonly simulationOfflineService = inject(
        SimulationOfflineService,
    );
    private readonly sensorOfflineService = inject(SensorOfflineService);
    private readonly patternsOfflineService = inject(PatternOfflineService);
    private readonly notificationService = inject(NotificationService);
    private readonly simulationController = inject(SimulationControllerService);
    private readonly simulationStateStore = inject(SimulationStateStore);

    protected timestampIniDisplay: string | null = null;
    protected timestampEndDisplay: string | null = null;

    protected readonly creatingSection = signal(false);
    protected editingSectionIndex: number | null = null;

    protected readonly dataToExport = computed(() => {
        const simulationData = this.simulationData();
        if (!simulationData) return null;

        const { sensorId, id, ...rest } = simulationData;
        return rest;
    });

    protected readonly isSimulationDataImported = computed(
        () => !!this.simulationOfflineService.getLoadedSimulation(),
    );
    protected readonly patterns = this.patternsOfflineService.patterns;

    protected readonly simulationForm = new FormGroup<SimulationFormModel>({
        name: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
        sensorId: new FormControl(0, {
            nonNullable: true,
            validators: [Validators.required],
        }),
        timestampIni: new FormControl(null, {
            nonNullable: true,
            validators: [Validators.required],
        }),
        timestampEnd: new FormControl(null, {
            nonNullable: true,
            validators: [Validators.required],
        }),
        timeStep: new FormControl(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)],
        }),
        sections: new FormArray<FormGroup<SectionFormModel>>([]),
        parameters: new FormControl('', {
            validators: [Validators.required],
        }),
        minRecordsPerInstant: new FormControl(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)],
        }),
        maxRecordsPerInstant: new FormControl(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)],
        }),
        minIntervalBetweenRecords: new FormControl(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)],
        }),
        maxIntervalBetweenRecords: new FormControl(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)],
        }),
        noRepeat: new FormControl(false),
        date: new FormControl(DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'), {
            validators: [Validators.required],
        }),
    });

    protected readonly sensor = computed(() =>
        this.sensorOfflineService.getLoadedSensor(),
    );

    protected readonly sensor$ = toObservable(this.sensor);

    protected isSubmitting = false;
    protected readonly isLoading = signal(false);

    protected readonly simulationId = computed(
        () => this.simulationData()?.id ?? null,
    );
    protected readonly simulationData = computed(() =>
        this.simulationOfflineService.getLoadedSimulation(),
    );

    protected readonly showAlert = signal(false);

    protected readonly showTooltip = signal(false);

    protected readonly activeSimulations$ =
        this.simulationStateStore.getActiveSimulations();

    protected readonly generatedSimulation$ = new BehaviorSubject<any[]>([]);

    private readonly jsonData = SIMULATION_PARAMETERS_PLACEHOLDER;
    protected readonly rawFormatJson = JSON.stringify(this.jsonData, null, 2);

    constructor() {
        effect(() => {
            const simulationData = this.simulationData();
            if (!simulationData) return;

            this.populateFormFromImport();
        });
    }

    ngOnInit(): void {
        this.setupFormListeners();
    }

    /**
     * Opens the section editing mode for a specific pattern section.
     * @param event Object containing the pattern data and its index in the FormArray.
     */
    protected onClickedEditButton(event: {
        pattern: Pattern;
        index: number;
    }): void {
        this.editingSectionIndex = event.index;
    }

    protected cancelSectionEdition(): void {
        this.editingSectionIndex = null;
    }

    protected onConfirmEdit(updatedPattern: Pattern): void {
        if (this.editingSectionIndex === null) return;

        const updatedSectionForm = this.createSectionForm(updatedPattern);
        this.getCurrentSections().setControl(
            this.editingSectionIndex,
            updatedSectionForm,
        );

        this.editingSectionIndex = null;
    }

    protected onRemoveSection(index: number) {
        const sections = this.getCurrentSections();
        if (index < 0 || index >= sections.length) return;

        sections.removeAt(index);
    }

    /**
     * Handles the drag and drop event to reorder sections in the FormArray.
     * @param event CDK DragDrop event containing previous and current indices.
     */
    protected onReorderSections(event: SectionReorderEvent): void {
        const sections = this.getCurrentSections();
        const { previousIndex, currentIndex } = event;

        if (
            previousIndex < 0 ||
            previousIndex >= sections.length ||
            currentIndex < 0 ||
            currentIndex >= sections.length
        )
            return;

        const movedSection = sections.at(previousIndex);
        sections.removeAt(previousIndex);
        sections.insert(currentIndex, movedSection);
    }

    /**
     * Updates the form's start timestamp based on string input from the UI.
     * @param value Date string in 'dd/MM/yyyy HH:mm:ss' format.
     */
    protected onTimestampIniChange(value: string): void {
        this.timestampIniDisplay = value;

        const datetime = DateTime.fromFormat(value, 'dd/MM/yyyy HH:mm:ss');
        if (!datetime.isValid) return;

        this.simulationForm.controls.timestampIni.setValue(datetime.toMillis());
    }

    /**
     * Updates the form's end timestamp based on string input from the UI.
     * @param value Date string in 'dd/MM/yyyy HH:mm:ss' format.
     */
    protected onTimestampEndChange(value: string): void {
        this.timestampEndDisplay = value;

        const datetime = DateTime.fromFormat(value, 'dd/MM/yyyy HH:mm:ss');
        if (!datetime.isValid) return;

        this.simulationForm.controls.timestampEnd.setValue(datetime.toMillis());
    }

    /**
     * Sanitizes and formats the JSON placeholder for display in the UI.
     * @returns SafeHtml containing the stringified JSON wrapped in <pre> tags.
     */
    protected getFormattedMockParameters(): SafeHtml {
        const jsonString = JSON.stringify(this.jsonData, null, 2).trim();
        return this.sanitizer.bypassSecurityTrustHtml(
            '<pre>' + jsonString + '</pre>',
        );
    }

    protected onCreateSection(pattern: Pattern): void {
        const sectionForm = this.createSectionForm(pattern);
        this.getCurrentSections().push(sectionForm);
        this.creatingSection.set(false);
    }

    protected getCurrentSections(): FormArray {
        return this.simulationForm.get('sections') as FormArray;
    }

    protected handleFormSubmit(): void {
        if (this.simulationForm.invalid || this.isSubmitting)
            return this.markFormGroupTouched(this.simulationForm);

        this.isSubmitting = true;
        this.simulationForm.disable();

        this.updateSimulationOffline();

        this.isSubmitting = false;
        this.simulationForm.enable();
    }

    private updateSimulationOffline(): void {
        const rawForm = this.simulationForm.getRawValue();
        const payload = {
            ...rawForm,
            id: this.simulationId(),
            noRepeat: rawForm.noRepeat ? 1 : 0,
        };

        this.simulationOfflineService.updateSimulation(payload);
        this.notificationService.success(
            'Datos de la simulación actualizados correctamente',
        );
    }

    /**
     * Toggles the pause/resume state of a running simulation.
     */
    protected onTogglePauseSimulation(
        simulationId: SimulationEntity['id'],
    ): void {
        this.simulationController.togglePause(simulationId);
    }

    protected onStopSimulation(simulationId: SimulationEntity['id']): void {
        this.simulationController.stop(simulationId);
    }

    protected onClosedSimulation(simulationId: SimulationEntity['id']): void {
        this.simulationController.close(simulationId);
    }

    // TODO: Maybe it will be using in the future
    // protected startSimulation(simulationId: SimulationEntity['id']): void {
    //     console.log(`▶️ Iniciando simulación ${simulationId} en form...`);

    //     const simulationData = this.buildSimulationEntityFromForm();

    //     this.simulationController.runPeriodic(simulationData);

    //     this.simulationStateStore
    //         .getSimulationState(simulationData.id)
    //         .pipe(
    //             tap((state) => this.generatedSimulation$.next(state.records)),
    //             takeWhile((state) => state.isRunning, true),
    //             takeUntilDestroyed(this.destroyRef),
    //         )
    //         .subscribe();
    // }

    protected initInstantSimulation(
        simulationId: SimulationEntity['id'],
    ): void {
        const simulationData = this.buildSimulationEntityFromForm();

        this.simulationController.runInstant(simulationData);

        this.simulationStateStore
            .getSimulationState(simulationData.id)
            .pipe(
                tap((state) => this.generatedSimulation$.next(state.records)),
                takeWhile((state) => state.isRunning, true),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    protected cancel(): void {
        this.router.navigate(['/simulations']);
    }

    protected setPlaceholderDateToNow(): void {
        const datetime = DateTime.now().toFormat('dd/MM/yyyy HH:mm:ss');
        this.onTimestampIniChange(datetime);
    }

    protected setPlaceholderDateToThreeDaysLater(): void {
        const datetime = DateTime.now()
            .plus({ days: 3 })
            .toFormat('dd/MM/yyyy HH:mm:ss');
        this.onTimestampEndChange(datetime);
    }

    protected toggleTooltip(): void {
        this.showTooltip.set(!this.showTooltip());
    }

    protected onDataImported(data: unknown): void {
        this.simulationOfflineService.loadSimulation(data);
        this.populateFormFromImport();

        this.notificationService.success(
            'Datos de simulación cargados correctamente',
        );
    }

    /**
     * Resets form and maps properties from the currently loaded simulation data into the form controls.
     */
    private populateFormFromImport(): void {
        const simulation = this.simulationData();
        if (!simulation) {
            return this.notificationService.error(
                'Hubo un error al cargar los datos de la simulación',
            );
        }

        this.simulationForm.reset();
        this.simulationForm.patchValue({
            name: simulation.name,
            timeStep: simulation.timeStep,
            parameters: simulation.parameters,
            minRecordsPerInstant: simulation.minRecordsPerInstant,
            maxRecordsPerInstant: simulation.maxRecordsPerInstant,
            minIntervalBetweenRecords: simulation.minIntervalBetweenRecords,
            maxIntervalBetweenRecords: simulation.maxIntervalBetweenRecords,
            noRepeat: !!simulation.noRepeat,
            date: simulation.date,
        });

        if (simulation.timestampIni) {
            const ini = DateTime.fromMillis(simulation.timestampIni).toFormat(
                'dd/MM/yyyy HH:mm:ss',
            );

            this.timestampIniDisplay = ini;
            this.simulationForm.controls.timestampIni.setValue(
                simulation.timestampIni,
            );
        }

        if (simulation.timestampEnd) {
            const end = DateTime.fromMillis(simulation.timestampEnd).toFormat(
                'dd/MM/yyyy HH:mm:ss',
            );

            this.timestampEndDisplay = end;
            this.simulationForm.controls.timestampEnd.setValue(
                simulation.timestampEnd,
            );
        }

        // 🔹 Reconstruir secciones
        this.populateSections(simulation.sections);
    }

    private populateSections(sections: Section[]): void {
        const formArray = this.getCurrentSections();
        formArray.clear();

        if (!sections.length) return;
        sections.forEach(({ numSectionPoints, pattern }) => {
            const sectionForm = new FormGroup<SectionFormModel>({
                pattern: new FormGroup<PatternFormModel>({
                    id: new FormControl(pattern.id, {
                        nonNullable: true,
                    }),
                    name: new FormControl(pattern.name, {
                        nonNullable: true,
                    }),
                    fType: new FormControl(pattern.fType, {
                        nonNullable: true,
                    }),
                    duration: new FormControl(pattern.duration, {
                        nonNullable: true,
                    }),
                    initValue: new FormControl(pattern.initValue, {
                        nonNullable: true,
                    }),
                    endValue: new FormControl(pattern.endValue, {
                        nonNullable: true,
                    }),
                    minTolerance: new FormControl(pattern.minTolerance, {
                        nonNullable: true,
                    }),
                    maxTolerance: new FormControl(pattern.maxTolerance, {
                        nonNullable: true,
                    }),
                }),
                numSectionPoints: new FormControl(numSectionPoints, {
                    nonNullable: true,
                }),
            });

            formArray.push(sectionForm);
        });
    }

    private buildSimulationEntityFromForm(): SimulationEntity {
        const formValue = this.simulationForm.getRawValue();

        return {
            ...formValue,
            id: this.simulationId(),
            elementsToSimulate: this.getTotalSectionPoints(),
        };
    }

    private createSectionForm(pattern: Pattern): FormGroup<SectionFormModel> {
        const timeStep = this.simulationForm.get('timeStep')?.value ?? 1;

        return new FormGroup<SectionFormModel>({
            pattern: new FormGroup<PatternFormModel>({
                id: new FormControl(pattern.id, { nonNullable: true }),
                name: new FormControl(pattern.name, { nonNullable: true }),
                fType: new FormControl(pattern.fType, { nonNullable: true }),
                duration: new FormControl(pattern.duration, {
                    nonNullable: true,
                }),
                initValue: new FormControl(pattern.initValue, {
                    nonNullable: true,
                }),
                endValue: new FormControl(pattern.endValue, {
                    nonNullable: true,
                }),
                minTolerance: new FormControl(pattern.minTolerance, {
                    nonNullable: true,
                }),
                maxTolerance: new FormControl(pattern.maxTolerance, {
                    nonNullable: true,
                }),
            }),
            numSectionPoints: new FormControl(
                Math.floor(pattern.duration / timeStep),
                { nonNullable: true },
            ),
        });
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.values(formGroup.controls).forEach((control) => {
            if (control instanceof FormGroup)
                this.markFormGroupTouched(control);
            else control.markAsTouched();
        });
    }

    private recalculateSectionPoints(timeStep: number): void {
        const sections = this.simulationForm.get('sections') as FormArray;

        sections.controls
            .map((section) => ({
                duration: section.get('pattern')?.value?.duration,
                numSectionsPointsControl: section.get('numSectionPoints'),
            }))
            .filter(
                (
                    s,
                ): s is {
                    duration: number;
                    numSectionsPointsControl: FormControl<number>;
                } =>
                    typeof s.duration === 'number' &&
                    s.duration &&
                    !!s.numSectionsPointsControl,
            )
            .forEach(({ duration, numSectionsPointsControl }) => {
                const calculatedPoints = Math.floor(duration / timeStep);
                numSectionsPointsControl.setValue(calculatedPoints, {
                    emitEvent: false,
                });
            });
    }

    /**
     * Initializes RxJS observers for JSON validation, timeStep changes, and cross-field validation.
     */
    private setupFormListeners(): void {
        this.simulationForm
            .get('parameters')
            ?.valueChanges.pipe(
                debounceTime(300),
                tap((value) => this.validateJsonParameters(value)),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();

        this.simulationForm
            .get('timeStep')
            ?.valueChanges.pipe(
                startWith(this.simulationForm.get('timeStep')?.value),
                filter(
                    (timeStep): timeStep is number =>
                        typeof timeStep === 'number' && timeStep > 0,
                ),
                tap((timeStep) => this.recalculateSectionPoints(timeStep)),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();

        combineLatest([
            this.simulationForm
                .get('noRepeat')
                ?.valueChanges.pipe(startWith(false)),
            this.sensor$.pipe(startWith(null)),
        ])
            .pipe(
                tap(([noRepeat, sensor]) => {
                    if (!noRepeat || !sensor) return;

                    this.validateNoRepeat(sensor);
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    /**
     * Validates if the parameters string is a valid JSON. Sets showAlert signal accordingly.
     * @param parameters The string value to validate.
     */
    private validateJsonParameters(parameters: string): void {
        try {
            JSON.parse(parameters);
            this.showAlert.set(false);
        } catch {
            this.showAlert.set(true);
        }
    }

    /**
     * Validates if 'records per instant' settings exceed the available sensor coordinates when 'noRepeat' is enabled.
     * @param sensor The current sensor entity containing coordinate data.
     */
    private validateNoRepeat(sensor: SensorEntity): void {
        if (!sensor?.coordinates?.length) return;

        const maxCoordinates = sensor.coordinates.length;
        const minRecords =
            this.simulationForm.get('minRecordsPerInstant')?.value ?? 0;
        const maxRecords =
            this.simulationForm.get('maxRecordsPerInstant')?.value ?? 0;

        if (minRecords <= maxCoordinates && maxRecords <= maxCoordinates)
            return this.simulationForm.setErrors(null);

        this.simulationForm.setErrors({
            registrosExcedenCoordenadas: true,
        });
    }

    /**
     * Calculates the total number of data points across all sections in the form.
     * @returns The sum of numSectionPoints from all sections.
     */
    private getTotalSectionPoints(): number {
        const sections = this.simulationForm.get('sections') as FormArray;

        return sections.controls.reduce((acc, control) => {
            const numPoints = control.get('numSectionPoints')?.value ?? 0;
            return acc + numPoints;
        }, 0);
    }
}
