import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { SpaceService, Space } from '../../core/services/space.service';

@Component({
  selector: 'app-posts',
  templateUrl: './posts.component.html'
})
export class PostsComponent implements OnInit {
  posts: any[] = [];
  loading = false;
  space?: Space;

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router, private spaces: SpaceService) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(page = 1) {
    this.loading = true;
    try {
      const usernameParam = this.route.snapshot.paramMap.get('username');
      if (!usernameParam) {
        await this.router.navigate(['/spaces']);
        return;
      }
      this.space = await firstValueFrom(this.spaces.getSpace(usernameParam));
      const res: any = await firstValueFrom(this.api.getPosts({ page, spaceUsername: usernameParam }));
      this.space = res?.space || this.space;
      this.posts = (res?.data || res?.posts || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        tags: p.tags,
        author: p.author || { id: p.authorId, username: p.authorUsername },
        space: p.space || { id: p.spaceId, username: this.space?.username || usernameParam },
        isPublished: p.isPublished,
        publishedAt: p.publishedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      await this.router.navigate(['/spaces']);
    } finally {
      this.loading = false;
    }
  }
}
