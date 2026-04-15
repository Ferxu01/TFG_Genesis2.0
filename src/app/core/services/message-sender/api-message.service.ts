import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ConnectionEntity } from 'app/models/Connection.model';
import { catchError, map, Observable, of } from 'rxjs';
import { ConnectionStrategy } from './ConnectionStrategy';

@Injectable({
    providedIn: 'root',
})
export class ApiMessageService implements ConnectionStrategy {
    private _http = inject(HttpClient);

    sendMessage(
        message: any,
        connectionOptions: ConnectionEntity['options']
    ): Observable<boolean> {
        const { URL, header } = connectionOptions;
        // Configurar los headers con la autorización
        const headers = new HttpHeaders({
            Authorization: header,
            'Content-Type': 'application/json',
        });

        // Enviar el mensaje mediante POST
        return this._http.post(URL, message, { headers }).pipe(
            map((response) => {
                console.log('Mensaje enviado con éxito:', response);
                return true;
            }),
            catchError((err) => {
                console.error('Error al enviar el mensaje:', err);
                return of(false);
            })
        );
    }
}
