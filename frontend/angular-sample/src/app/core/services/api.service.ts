import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getPosts(options: { page?: number; boardId?: number; boardSlug?: string } = {}): Observable<any> {
    let params = new HttpParams();
    if (options.page) params = params.set('page', options.page);
    if (options.boardId) params = params.set('boardId', options.boardId);
    if (options.boardSlug) params = params.set('boardSlug', options.boardSlug);
    return this.http.get(`${environment.apiBaseUrl}/api/boards/${options.boardSlug}/posts`, { params });
  }

  getPostByBoard(slug: string, id: string): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/api/boards/${slug}/posts/${id}`);
  }

  createPost(payload: any & { boardSlug: string }): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/api/boards/${payload.boardSlug}/posts`, payload);
  }

  updatePost(slug: string, id: string, payload: any): Observable<any> {
    return this.http.put(`${environment.apiBaseUrl}/api/boards/${slug}/posts/${id}`, payload);
  }
}
