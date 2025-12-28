import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, of, tap, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken?: string;
  private refreshToken?: string;
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const storedAccess = localStorage.getItem(environment.jwtStorageKey);
    const storedRefresh = localStorage.getItem(`${environment.jwtStorageKey}_refresh`);
    const storedUser = localStorage.getItem(`${environment.jwtStorageKey}_user`);
    if (storedAccess) this.accessToken = storedAccess;
    if (storedRefresh) this.refreshToken = storedRefresh;
    if (storedUser) this.userSubject.next(JSON.parse(storedUser));
  }

  getAccessToken() {
    return this.accessToken;
  }

  getCurrentUser() {
    return this.userSubject.value;
  }

  async login(email: string, password: string) {
    const res: any = await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/api/auth/login`, { email, password }));
    this.setSession(res.accessToken, res.refreshToken, res.user);
  }

  async signup(email: string, password: string, username: string) {
    await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/api/auth/signup`, { email, password, username }));
  }

  logout() {
    this.accessToken = undefined;
    this.refreshToken = undefined;
    localStorage.removeItem(environment.jwtStorageKey);
    localStorage.removeItem(`${environment.jwtStorageKey}_refresh`);
    localStorage.removeItem(`${environment.jwtStorageKey}_user`);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  refresh(): Observable<string | null> {
    if (!this.refreshToken) return of(null);
    return this.http
      .post<any>(`${environment.apiBaseUrl}${environment.refreshEndpoint}`, { refreshToken: this.refreshToken })
      .pipe(
        tap(res => {
          if (res?.accessToken) this.setSession(res.accessToken, this.refreshToken, res.user ?? this.userSubject.value);
        }),
        map(res => res?.accessToken || null)
      );
  }

  private setSession(access: string, refresh?: string, user?: any) {
    this.accessToken = access;
    if (refresh) this.refreshToken = refresh;
    localStorage.setItem(environment.jwtStorageKey, access);
    if (refresh) localStorage.setItem(`${environment.jwtStorageKey}_refresh`, refresh);
    if (user) {
      this.userSubject.next(user);
      localStorage.setItem(`${environment.jwtStorageKey}_user`, JSON.stringify(user));
    }
  }
}
