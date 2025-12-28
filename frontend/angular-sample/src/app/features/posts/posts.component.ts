import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-posts',
  templateUrl: './posts.component.html'
})
export class PostsComponent implements OnInit {
  posts: any[] = [];
  loading = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  async load(page = 1) {
    this.loading = true;
    try {
      const res = await firstValueFrom(this.api.getPosts({ page }));
      this.posts = res?.data || [];
    } finally {
      this.loading = false;
    }
  }
}

