import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Space {
  id: number;
  ownerId: number;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class SpaceService {
  constructor(private http: HttpClient) {}

  getSpaces(): Observable<Space[]> {
    return this.http.get<Space[]>(`${environment.apiBaseUrl}/api/spaces`);
  }

  getSpace(username: string): Observable<Space> {
    return this.http.get<Space>(`${environment.apiBaseUrl}/api/spaces/${username}`);
  }

  ensureMySpace(): Observable<Space> {
    return this.http.post<Space>(`${environment.apiBaseUrl}/api/spaces`, {});
  }
}
