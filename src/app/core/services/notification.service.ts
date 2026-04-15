import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    message: string;
    type: NotificationType;
    duration?: number;
    action?: string;
}

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    private snackBar = inject(MatSnackBar);
    private destroy$ = new Subject<void>();

    private defaultConfig: MatSnackBarConfig = {
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'center',
        panelClass: ['notification-container'],
    };

    private typeConfigs: Record<NotificationType, MatSnackBarConfig> = {
        success: {
            panelClass: ['notification-success', 'notification-container'],
            duration: 3000,
        },
        error: {
            panelClass: ['notification-error', 'notification-container'],
            duration: 7000,
        },
        warning: {
            panelClass: ['notification-warning', 'notification-container'],
            duration: 5000,
        },
        info: {
            panelClass: ['notification-info', 'notification-container'],
            duration: 4000,
        },
    };

    success(message: string, duration?: number, action?: string): void {
        this.showNotification({
            message,
            type: 'success',
            duration,
            action,
        });
    }

    error(message: string, duration?: number, action?: string): void {
        this.showNotification({
            message,
            type: 'error',
            duration,
            action,
        });
    }

    warning(message: string, duration?: number, action?: string): void {
        this.showNotification({
            message,
            type: 'warning',
            duration,
            action,
        });
    }

    info(message: string, duration?: number, action?: string): void {
        this.showNotification({
            message,
            type: 'info',
            duration,
            action,
        });
    }

    showNotification(notification: Notification): void {
        const config = this.getConfig(notification);
        this.snackBar.open(
            notification.message,
            notification.action || 'Cerrar',
            config,
        );
    }

    /**
     * Obtiene la configuración para el tipo de notificación
     */
    private getConfig(notification: Notification): MatSnackBarConfig {
        const typeConfig = this.typeConfigs[notification.type] || {};

        return {
            ...this.defaultConfig,
            ...typeConfig,
            duration:
                notification.duration ||
                typeConfig.duration ||
                this.defaultConfig.duration,
            panelClass: [
                ...(typeConfig.panelClass || []),
                ...(this.defaultConfig.panelClass || []),
            ],
        };
    }

    /**
     * Limpia todas las notificaciones
     */
    dismissAll(): void {
        this.snackBar.dismiss();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
