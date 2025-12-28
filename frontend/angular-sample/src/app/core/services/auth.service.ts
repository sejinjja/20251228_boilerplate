import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken?: string;
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem(environment.jwtStorageKey);
    if (stored) this.accessToken = stored;
  }

  getAccessToken() {
    return this.accessToken;
  }

  async login(email: string, password: string) {
    const res: any = await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/api/auth/login`, { email, password }));
    this.setSession(res.accessToken, res.user);
  }

  async signup(email: string, password: string, displayName: string) {
    await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/api/auth/signup`, { email, password, displayName }));
  }

  logout() {
    this.accessToken = undefined;
    localStorage.removeItem(environment.jwtStorageKey);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  refresh(): Observable<string | null> {
    if (!this.accessToken) return of(null);
    return this.http.post<any>(`${environment.apiBaseUrl}${environment.refreshEndpoint}`, { refreshToken: this.accessToken }).pipe(
      tap(res => {
        if (res?.accessToken) this.setSession(res.accessToken, res.user);
      }),
      tap(res => res?.accessToken || null)
    );
  }

  private setSession(token: string, user: any) {
    this.accessToken = token;
    localStorage.setItem(environment.jwtStorageKey, token);
    this.userSubject.next(user);
  }
}

