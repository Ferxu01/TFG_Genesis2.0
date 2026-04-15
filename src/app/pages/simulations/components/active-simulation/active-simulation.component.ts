import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    inject,
    Input,
    Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SimulationState } from 'app/models/Simulation-state.model';
import {
    ExportDialogResult,
    ExportFormatDialogComponent,
} from 'app/pages/simulations/components/export-format-dialog/export-format-dialog.component';
import {
    DataExportService,
    ExportFormat,
} from 'app/services/data-export.service';
import { convertSecondsToMilliseconds } from 'app/utils/Date.utils';
import { flattenObject } from 'app/utils/Object.utils';
import { take } from 'rxjs';

/**
 * Component that visualizes the progress and controls of an ongoing simulation.
 * It provides real-time percentage updates and allows the user to pause, stop, or export results.
 */
@Component({
    selector: 'active-simulation',
    templateUrl: './active-simulation.component.html',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatProgressBarModule],
})
export class ActiveSimulationComponent {
    private readonly dialog = inject(MatDialog);
    private readonly dataExportService = inject(DataExportService);

    @Input({ required: true }) activeSimulations: SimulationState[] = [];

    @Output() pauseSimulation = new EventEmitter<SimulationState>();
    @Output() stopSimulation = new EventEmitter<SimulationState>();
    @Output() closedSimulation = new EventEmitter<SimulationState>();

    /**
     * Emits the close event to remove the simulation view.
     */
    protected handleCloseSimulation(simulationState: SimulationState): void {
        this.closedSimulation.emit(simulationState);
    }

    /**
     * Emits the pause event for a specific simulation.
     */
    protected handleTogglePause(simulationState: SimulationState): void {
        this.pauseSimulation.emit(simulationState);
    }

    /**
     * Emits the stop event for a specific simulation.
     */
    protected handleToggleStop(simulationState: SimulationState): void {
        this.stopSimulation.emit(simulationState);
    }

    protected getCurrentGenerated(simulationState: SimulationState): number {
        return simulationState.currentGenerated ?? 0;
    }

    protected getPercentage(state: SimulationState): number {
        const { timestampIni, timestampEnd, timeStep } = state.simulation;
        const timeStepMillis = convertSecondsToMilliseconds(timeStep);

        const elementsToSimulate = Math.floor(
            (timestampEnd - timestampIni) / timeStepMillis,
        );
        if (elementsToSimulate <= 0) return 0;

        const currentGenerated = this.getCurrentGenerated(state);
        const percentage = (currentGenerated / elementsToSimulate) * 100;

        return Math.min(percentage, 100);
    }

    protected isPaused(state: SimulationState): boolean {
        return state.isPaused;
    }

    protected openExportDialog(state: SimulationState): void {
        const dialogRef = this.dialog.open(ExportFormatDialogComponent, {
            width: '400px',
            data: {
                title: 'Exportar simulación',
                message: '¿En qué formato quieres exportar los datos?',
                defaultFormat: 'csv',
            },
        });

        dialogRef
            .afterClosed()
            .pipe(take(1))
            .subscribe((result: ExportDialogResult) => {
                if (!result?.confirmed) return;

                this.dataExportService.download<unknown>(
                    state.records,
                    result.format === 'csv'
                        ? ExportFormat.CSV
                        : ExportFormat.JSON,
                    {
                        fileName: 'section-points',
                        mapper: (item, index) => ({
                            index,
                            ...flattenObject(item),
                        }),
                    },
                );
            });
    }
}
