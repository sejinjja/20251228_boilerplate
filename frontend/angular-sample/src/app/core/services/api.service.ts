import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getPosts(options: { page?: number; spaceUsername: string } = { spaceUsername: '' }): Observable<any> {
    let params = new HttpParams();
    if (options.page) params = params.set('page', options.page);
    return this.http.get(`${environment.apiBaseUrl}/api/spaces/${options.spaceUsername}/posts`, { params });
  }

  getAllPosts(options: { page?: number } = {}): Observable<any> {
    let params = new HttpParams();
    if (options.page) params = params.set('page', options.page);
    return this.http.get(`${environment.apiBaseUrl}/api/posts`, { params });
  }

  getPost(spaceUsername: string, id: string): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/api/spaces/${spaceUsername}/posts/${id}`);
  }

  createPost(spaceUsername: string, payload: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/api/spaces/${spaceUsername}/posts`, payload);
  }

  updatePost(spaceUsername: string, id: string, payload: any): Observable<any> {
    return this.http.put(`${environment.apiBaseUrl}/api/spaces/${spaceUsername}/posts/${id}`, payload);
  }
}
