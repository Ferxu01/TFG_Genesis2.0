import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import {
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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NotificationService } from 'app/core/services/notification.service';
import { Nullable } from 'app/models/Nullable.model';
import { Pattern } from 'app/models/Pattern.model';
import { PatternFormModel } from 'app/models/forms.model';
import { PatternOfflineService } from 'app/services/offline/pattern-offline.service';

/**
 * Component responsible for creating and editing Pattern records.
 * It manages the reactive form state, validates user input, and
 * synchronizes changes with the PatternOfflineService.
 */
@Component({
    selector: 'pattern-form',
    templateUrl: './pattern-form.component.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        NgClass,
        RouterModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatSelectModule,
        MatButtonToggleModule,
    ],
})
export class PatternFormComponent implements OnInit {
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly patternOfflineService = inject(PatternOfflineService);
    private readonly notificationService = inject(NotificationService);

    private readonly patternId = signal<Nullable<Pattern['id']>>(null);

    protected readonly isEditMode = computed(() => !!this.patternId());
    protected readonly isLoading = signal(false);
    protected readonly isSubmitting = signal(false);

    protected readonly patternForm = new FormGroup<PatternFormModel>({
        name: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
        fType: new FormControl('linear', {
            nonNullable: true,
            validators: [Validators.required],
        }),
        duration: new FormControl(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(1)],
        }),
        initValue: new FormControl(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(1)],
        }),
        endValue: new FormControl(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(1)],
        }),
        minTolerance: new FormControl(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)],
        }),
        maxTolerance: new FormControl(0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)],
        }),
    });

    ngOnInit(): void {
        this.loadInitialData();
    }

    private loadInitialData(): void {
        const id = this.activatedRoute.snapshot.paramMap.get('id');
        if (!id) return;

        this.patternId.set(id);
        this.isLoading.set(true);

        const pattern = this.patternOfflineService.getPatternById(id);
        if (pattern) this.patternForm.patchValue(pattern);

        this.isLoading.set(false);
    }

    /**
     * Validates and processes the form submission.
     * Triggers either creation or update based on the current mode.
     */
    protected handleFormSubmit(): void {
        if (this.patternForm.invalid || this.isSubmitting())
            return this.validateAllFormFields(this.patternForm);

        this.isSubmitting.set(true);
        this.patternForm.disable();

        const formValue = this.patternForm.getRawValue();
        this.savePattern(formValue);
    }

    protected navigateToPatternsList(): void {
        this.router.navigate(['/patterns']);
    }

    /**
     * Persists pattern data and provides user feedback.
     * @param id Unique identifier if updating, null if creating.
     * @param data The pattern data from the form.
     */
    private savePattern(data: any): void {
        const patternId = this.patternId();

        if (patternId) {
            this.patternOfflineService.editPattern(patternId, data);
            this.notificationService.success(
                'Patrón actualizado correctamente',
            );
        } else {
            this.patternOfflineService.createPattern(data);
            this.notificationService.success('Patrón creado correctamente');
        }

        this.isSubmitting.set(false);
        this.patternForm.enable();
        this.navigateToPatternsList();
    }

    /**
     * Recursively marks all form controls as touched to trigger validation messages.
     * @param formGroup The target form group to validate.
     */
    private validateAllFormFields(formGroup: FormGroup): void {
        Object.values(formGroup.controls).forEach((control) => {
            if (control instanceof FormGroup)
                this.validateAllFormFields(control);
            else control.markAsTouched();
        });
    }
}
