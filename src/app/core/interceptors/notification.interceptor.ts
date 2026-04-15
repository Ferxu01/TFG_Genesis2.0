import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpResponse,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class NotificationInterceptor implements HttpInterceptor {
    private notificationService = inject(NotificationService);

    intercept(
        request: HttpRequest<unknown>,
        next: HttpHandler
    ): Observable<HttpEvent<unknown>> {
        return next.handle(request).pipe(
            tap({
                next: (event) => {
                    if (event instanceof HttpResponse) {
                        this.handleSuccessResponse(request, event);
                    }
                },
                error: (error) => {
                    this.handleErrorResponse(request, error);
                },
            })
        );
    }

    private handleSuccessResponse(
        request: HttpRequest<any>,
        response: HttpResponse<any>
    ): void {
        // Solo mostrar notificaciones para métodos que modifican datos
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
            return;
        }

        const message = this.getSuccessMessage(request.method, response);
        if (message) {
            this.notificationService.success(message);
        }
    }

    private handleErrorResponse(
        request: HttpRequest<any>,
        error: HttpErrorResponse
    ): void {
        let message = 'Error en la operación';

        if (error.error?.message) {
            message = error.error.message;
        } else if (error.status === 0) {
            message = 'Error de conexión. Verifique su conexión a internet.';
        } else if (error.status >= 500) {
            message = 'Error del servidor. Intente nuevamente más tarde.';
        }

        this.notificationService.error(message);
    }

    private getSuccessMessage(
        method: string,
        response: HttpResponse<any>
    ): string | null {
        const messages: Record<string, string> = {
            POST: response.body?.message || 'Registro creado exitosamente',
            PUT: response.body?.message || 'Registro actualizado exitosamente',
            PATCH:
                response.body?.message || 'Registro actualizado exitosamente',
            DELETE: response.body?.message || 'Registro eliminado exitosamente',
        };

        return messages[method] || null;
    }
}
