import { ClipboardModule } from '@angular/cdk/clipboard';
import { AsyncPipe, DatePipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    inject,
    OnDestroy,
    OnInit,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    AbstractControl,
    FormArray,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    ValidatorFn,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
import { SimulationEntity } from 'app/models/Simulation.model';
import { ActiveSimulationComponent } from 'app/pages/simulations/components/active-simulation/active-simulation.component';
import { PatternOfflineService } from 'app/services/offline/pattern-offline.service';
import { SensorOfflineService } from 'app/services/offline/sensor-offline.service';
import { SimulationOfflineService } from 'app/services/offline/simulation-offline.service';
import SIMULATION_PARAMETERS_PLACEHOLDER from 'assets/json/clipboard-simulation-parameters.json';
import { DateTime } from 'luxon';
import { filter, startWith, takeWhile, tap } from 'rxjs';
import { SimulationViewerComponent } from '../components/simulation-viewer/simulation-viewer.component';
import { SimulationControllerService } from '../simulation-state/controller/SimulationController.service';
import { SimulationStateStore } from '../simulation-state/store/SimulationStateStore.service';

@Component({
    selector: 'simulation-form',
    templateUrl: './simulation-form.component.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatExpansionModule,
        MatTooltipModule,
        MatMenuModule,
        MatCheckboxModule,
        MatDatepickerModule,
        ClipboardModule,
        AsyncPipe,
        DatePipe,
        JsonTextareaDirective,
        ActiveSimulationComponent,
        SimulationViewerComponent,
        ChartSectionListComponent,
        CreateSectionFormComponent,
        ImportDataButtonComponent,
        ExportDataButtonComponent,
    ],
})
export class SimulationFormComponent implements OnInit, OnDestroy {
    private readonly destroyRef = inject(DestroyRef);
    private readonly sanitizer = inject(DomSanitizer);

    private readonly simulationOfflineService = inject(
        SimulationOfflineService,
    );
    private readonly sensorOfflineService = inject(SensorOfflineService);
    private readonly patternsOfflineService = inject(PatternOfflineService);
    private readonly notificationService = inject(NotificationService);
    private readonly simulationController = inject(SimulationControllerService);
    private readonly simulationStateStore = inject(SimulationStateStore);

    protected readonly sensors = computed(() =>
        this.sensorOfflineService.getLoadedSensors(),
    );

    protected readonly creatingSection = signal(false);
    protected editingSectionIndex: number | null = null;

    protected readonly dataToExport = computed(() => {
        const simulationData = this.simulationData();
        if (!simulationData) return null;

        const { id, ...rest } = simulationData;
        return rest;
    });

    protected readonly isSimulationDataImported = computed(
        () => !!this.simulationOfflineService.getLoadedSimulation(),
    );
    protected readonly patterns = this.patternsOfflineService.patterns;

    protected readonly simulationForm = new FormGroup<SimulationFormModel>(
        {
            name: new FormControl('', {
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
            sections: new FormArray<FormGroup<SectionFormModel>>([], {
                validators: [Validators.required, Validators.minLength(1)],
            }),
            parameters: new FormControl('', {
                validators: [
                    Validators.required,
                    this.validateJsonParameters(),
                ],
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
            date: new FormControl(
                DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
                {
                    validators: [Validators.required],
                },
            ),
        },
        { validators: this.sensorCoordinatesBoundValidator() },
    );

    protected readonly simulationId = computed(
        () => this.simulationData()?.id ?? null,
    );
    protected readonly simulationData = computed(() =>
        this.simulationOfflineService.getLoadedSimulation(),
    );

    protected readonly showTooltip = signal(false);

    protected readonly activeSimulations$ =
        this.simulationStateStore.getActiveSimulations();

    protected readonly generatedSimulation = signal<any[]>([]);

    private readonly jsonData = SIMULATION_PARAMETERS_PLACEHOLDER;
    protected readonly rawFormatJson = JSON.stringify(this.jsonData, null, 2);

    constructor() {
        effect(() => {
            // Re-validate when loaded sensor changes
            this.sensors();
            this.simulationForm.updateValueAndValidity();
        });

        effect(() => {
            const simulationData = this.simulationData();
            if (!simulationData) return;

            this.populateFormFromImport();
        });

        effect(() => {
            const patterns = this.patterns();
            if (!patterns.length) return;

            const currentSections = this.getCurrentSections();
            currentSections.controls.forEach((sectionControl) => {
                const patternId = sectionControl.get('pattern.id')?.value;
                const updatedPattern = patterns.find((p) => p.id === patternId);

                if (updatedPattern) {
                    // PatchValue to update data if original pattern changed
                    sectionControl
                        .get('pattern')
                        ?.patchValue(updatedPattern, { emitEvent: false });

                    // Recalculate points if duration changed on source truth
                    const timeStep =
                        this.simulationForm.get('timeStep')?.value ?? 1;
                    sectionControl
                        .get('numSectionPoints')
                        ?.setValue(
                            Math.floor(updatedPattern.duration / timeStep),
                            { emitEvent: false },
                        );
                }
            });
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
     * Updates the form's timestamp based on string input from the UI.
     * @param controlName Control name to update ('timestampIni' or 'timestampEnd').
     * @param value Date string in 'dd/MM/yyyy HH:mm:ss' format.
     */
    protected updateTimestamp(
        controlName: 'timestampIni' | 'timestampEnd',
        value: string,
    ): void {
        const datetime = DateTime.fromFormat(value, 'dd/MM/yyyy HH:mm:ss');
        if (!datetime.isValid) return;
        this.simulationForm.get(controlName)?.setValue(datetime.toMillis());
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

    protected initInstantSimulation(): void {
        // Save current form data to offline storage if not saved previously by ngOnDestroy or if changes were made after last save
        this.updateSimulationOffline();

        const simulationData = this.buildSimulationEntityFromForm();

        this.simulationController.runInstant(simulationData);

        this.simulationStateStore
            .getSimulationState(simulationData.id)
            .pipe(
                tap((state) => this.generatedSimulation.set(state.records)),
                takeWhile((state) => state.isRunning, true),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe();
    }

    protected setPlaceholderDateToNow(): void {
        const datetime = DateTime.now().toFormat('dd/MM/yyyy HH:mm:ss');
        this.updateTimestamp('timestampIni', datetime);
    }

    protected setPlaceholderDateToThreeDaysLater(): void {
        const datetime = DateTime.now()
            .plus({ days: 3 })
            .toFormat('dd/MM/yyyy HH:mm:ss');
        this.updateTimestamp('timestampEnd', datetime);
    }

    protected toggleTooltip(): void {
        this.showTooltip.set(!this.showTooltip());
    }

    protected onDataImported(data: unknown): void {
        if (!this.isValidSimulationData(data)) {
            return this.notificationService.error(
                'Formato no válido. Asegúrese de que la configuración de la simulación tenga el formato correcto.',
            );
        }

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
            this.updateTimestamp(
                'timestampIni',
                DateTime.fromMillis(simulation.timestampIni).toFormat(
                    'dd/MM/yyyy HH:mm:ss',
                ),
            );
        }

        if (simulation.timestampEnd) {
            this.updateTimestamp(
                'timestampEnd',
                DateTime.fromMillis(simulation.timestampEnd).toFormat(
                    'dd/MM/yyyy HH:mm:ss',
                ),
            );
        }

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
    }

    /**
     * Validates if the parameters string is a valid JSON. Returns a ValidatorFn for use in Angular forms.
     */
    private validateJsonParameters(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) return null;
            try {
                JSON.parse(control.value);
                return null;
            } catch (e) {
                return { invalidJsonParameters: true };
            }
        };
    }

    /**
     * Validates if 'records per instant' settings exceed the available sensor coordinates when 'noRepeat' is enabled.
     */
    private sensorCoordinatesBoundValidator(): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            const sensors = this.sensors();
            if (!sensors?.length) return null;

            const noRepeat = !!group.get('noRepeat')?.value;
            if (!noRepeat) return null;

            const maxCoordinates = sensors.length;
            const minRecords = group.get('minRecordsPerInstant')?.value ?? 0;
            const maxRecords = group.get('maxRecordsPerInstant')?.value ?? 0;

            if (minRecords > maxCoordinates || maxRecords > maxCoordinates)
                return { registrosExcedenCoordenadas: true };

            return null;
        };
    }

    /**
     * Validate that sections FormArray contains at least one element.
     */
    private atLeastOneSectionValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const formArray = control as FormArray;
            const hasSections = formArray && formArray.length > 0;

            return hasSections ? null : { noSectionsAdded: true };
        };
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

    /**
     * Validate that the imported data has a valid structure to be imported on system.
     */
    private isValidSimulationData(data: any): boolean {
        if (!data || typeof data !== 'object') return false;

        // Validar campos de primer nivel
        const hasBaseFields =
            typeof data.name === 'string' &&
            typeof data.timestampIni === 'number' &&
            typeof data.timestampEnd === 'number' &&
            typeof data.timeStep === 'number' &&
            typeof data.parameters === 'string' &&
            typeof data.minRecordsPerInstant === 'number' &&
            typeof data.maxRecordsPerInstant === 'number' &&
            Array.isArray(data.sections);

        if (!hasBaseFields) return false;

        // Validar sub-estructura de secciones y patrones
        const validFunctionTypes = ['linear', 'curve', 'parabolic'];

        return data.sections.every((section: any) => {
            const p = section.pattern;
            return (
                section &&
                typeof section.numSectionPoints === 'number' &&
                p &&
                typeof p.name === 'string' &&
                validFunctionTypes.includes(p.fType) &&
                typeof p.duration === 'number' &&
                typeof p.initValue === 'number' &&
                typeof p.endValue === 'number'
            );
        });
    }

    ngOnDestroy(): void {
        // Avoid unnecessary writes to offline storage if no changes were made
        if (this.simulationForm.dirty) {
            this.updateSimulationOffline();
        }
    }
}
