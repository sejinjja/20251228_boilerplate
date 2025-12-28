import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Space {
  id: number;
  ownerUsername: string;
  slug: string;
  title?: string;
  bio?: string;
}

@Injectable({ providedIn: 'root' })
export class SpaceService {
  constructor(private http: HttpClient) {}

  getSpaces(): Observable<Space[]> {
    return this.http.get<Space[]>(`${environment.apiBaseUrl}/api/spaces`);
  }

  getSpace(slug: string): Observable<Space> {
    return this.http.get<Space>(`${environment.apiBaseUrl}/api/spaces/${slug}`);
  }

  ensureMySpace(payload: { slug?: string; title?: string; bio?: string } = {}): Observable<Space> {
    return this.http.post<Space>(`${environment.apiBaseUrl}/api/spaces`, payload);
  }

  updateSpace(slug: string, payload: { title?: string; bio?: string }): Observable<Space> {
    return this.http.patch<Space>(`${environment.apiBaseUrl}/api/spaces/${slug}`, payload);
  }
}
