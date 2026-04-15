import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly _currentUser$ = new BehaviorSubject<{
        id: number;
        email: string;
        isActive: boolean;
    }>({
        id: 99999,
        email: 'Invitado',
        isActive: true,
    });
    readonly currentUser$ = this._currentUser$.asObservable();

    getCurrentUser() {
        return this.currentUser$;
    }
}
