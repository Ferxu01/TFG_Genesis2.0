import { inject, Injectable } from '@angular/core';
import { SimulationEntity } from 'app/models/Simulation.model';
import { Subject } from 'rxjs';
import { SimulationGeneratorService } from '../generator/SimulationGenerator.service';
import { SimulationStateStore } from '../store/SimulationStateStore.service';
import { SimulationTimerService } from '../timer/SimulationTimer.service';

/**
 * Service responsible for orchestrating simulation lifecycles.
 * It manages the execution state, timing, and data generation processes.
 */
@Injectable({ providedIn: 'root' })
export class SimulationControllerService {
    private readonly storeService = inject(SimulationStateStore);
    private readonly timerService = inject(SimulationTimerService);
    private readonly generatorService = inject(SimulationGeneratorService);

    private readonly simulationCancellationSignals$ = new Map<
        number,
        Subject<void>
    >();

    /**
     * Initializes and starts a simulation process.
     * @param simulation The simulation entity to start.
     */
    start(simulation: SimulationEntity): void {
        const cancellationSubject = new Subject<void>();
        this.simulationCancellationSignals$.set(
            simulation.id,
            cancellationSubject,
        );

        this.storeService.setInitialState(simulation, true);
        this.timerService.startTimer(simulation.id);
    }

    /**
     * Halts an active simulation and cleans up its resources.
     * @param simulationId The unique identifier of the simulation to stop.
     */
    stop(simId: SimulationEntity['id']): void {
        if (!this.storeService.getStateValue(simId)) return;

        this.timerService.stopTimer(simId);

        const cancellationSubject =
            this.simulationCancellationSignals$.get(simId);
        if (cancellationSubject) {
            cancellationSubject.next();
            cancellationSubject.complete();
            this.simulationCancellationSignals$.delete(simId);
        }

        this.storeService.updateState(simId, {
            isRunning: false,
            isPaused: false,
            isFinished: false,
        });
    }

    /**
     * Marks a simulation as finished in the state store.
     * @param simulationId The unique identifier of the simulation to close.
     */
    close(simId: SimulationEntity['id']): void {
        if (!this.storeService.getStateValue(simId)) return;

        this.storeService.updateState(simId, { isFinished: true });
    }

    // runPeriodic(simulation: SimulationEntity): void {
    //     this.start(simulation);

    //     const cancel$ =
    //         this.simulationCancellationSignals$.get(simulation.id) ?? new Subject<void>();
    //     this.simulationCancellationSignals$.set(simulation.id, cancel$);

    //     // const blocks$ = this.generator.generate(sim, cancel$);

    //     this.generator
    //         .generate(simulation, cancel$)
    //         .pipe(
    //             tap((records) => this.store.addRecords(simulation.id, records)),
    //             // Comentado temporalmente para pruebas sin envío
    //             // concatMap((records) =>
    //             //     this.sendGeneratedData(records, sim.connectionId).pipe(
    //             //         tap(() =>
    //             //             console.log(`📡 Bloque enviado (${records.length})`)
    //             //         )
    //             //     )
    //             // ),
    //             finalize(() => {
    //                 console.log(`✅ Simulación ${simulation.id} finalizada`);
    //                 this.stop(simulation.id);
    //             }),
    //         )
    //         .subscribe({
    //             error: (err) =>
    //                 console.error(`❌ Error en sim ${simulation.id}`, err),
    //         });
    // }

    runInstant(simulation: SimulationEntity): void {
        this.start(simulation);

        const generatedRecords =
            this.generatorService.generateInstant(simulation);

        this.storeService.addRecords(simulation.id, generatedRecords);

        this.stop(simulation.id);
    }

    togglePause(simId: SimulationEntity['id']): void {
        const state = this.storeService.getStateValue(simId);
        if (!state) return;
        state.isPaused ? this.resume(simId) : this.pause(simId);
    }

    private pause(simId: SimulationEntity['id']): void {
        this.storeService.updateState(simId, { isPaused: true });
        this.timerService.stopTimer(simId);
    }

    private resume(simId: SimulationEntity['id']): void {
        this.storeService.updateState(simId, { isPaused: false });
        this.timerService.startTimer(simId);
    }
}
