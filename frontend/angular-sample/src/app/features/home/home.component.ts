import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  posts: any[] = [];
  loading = false;
  error?: string;

  constructor(private api: ApiService) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    try {
      const res: any = await firstValueFrom(this.api.getAllPosts());
      this.posts = (res?.data || res?.posts || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        tags: p.tags,
        author: p.author || { id: p.authorId, username: p.authorUsername },
        space: p.space || { id: p.spaceId, username: p.spaceUsername },
        isPublished: p.isPublished,
        publishedAt: p.publishedAt,
        createdAt: p.createdAt
      }));
    } catch (err: any) {
      this.error = err?.message || '피드를 불러오지 못했습니다.';
    } finally {
      this.loading = false;
    }
  }
}

