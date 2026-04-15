import { ConnectionEntity } from 'app/models/Connection.model';
import { Observable } from 'rxjs';

export interface ConnectionStrategy {
    sendMessage(
        message: any,
        connectionOptions: ConnectionEntity['options']
    ): Observable<boolean>;
}
