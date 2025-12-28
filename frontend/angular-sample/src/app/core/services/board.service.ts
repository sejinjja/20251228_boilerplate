import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Board {
  id: number;
  name: string;
  slug: string;
  type: 'free' | 'notice' | 'trade';
  isDefault: number;
}

@Injectable({ providedIn: 'root' })
export class BoardService {
  constructor(private http: HttpClient) {}

  getBoards(): Observable<Board[]> {
    return this.http.get<Board[]>(`${environment.apiBaseUrl}/api/boards`);
  }

  createBoard(payload: { name: string; slug: string; type: Board['type']; isDefault?: boolean }): Observable<Board> {
    return this.http.post<Board>(`${environment.apiBaseUrl}/api/boards`, {
      ...payload,
      isDefault: payload.isDefault ? 1 : 0
    });
  }
}
