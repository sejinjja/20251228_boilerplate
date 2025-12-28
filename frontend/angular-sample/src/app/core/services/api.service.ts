import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getPosts(options: { page?: number; spaceSlug: string } = { spaceSlug: '' }): Observable<any> {
    let params = new HttpParams();
    if (options.page) params = params.set('page', options.page);
    return this.http.get(`${environment.apiBaseUrl}/api/spaces/${options.spaceSlug}/posts`, { params });
  }

  getPost(spaceSlug: string, id: string): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/api/spaces/${spaceSlug}/posts/${id}`);
  }

  createPost(spaceSlug: string, payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/api/spaces/${spaceSlug}/posts`, payload);
  }

  updatePost(spaceSlug: string, id: string, payload: any): Observable<any> {
    return this.http.put(`${environment.apiBaseUrl}/api/spaces/${spaceSlug}/posts/${id}`, payload);
  }
}
