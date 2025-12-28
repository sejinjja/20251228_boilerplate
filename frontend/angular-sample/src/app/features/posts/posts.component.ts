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
      const slugParam = this.route.snapshot.paramMap.get('slug');
      if (!slugParam) {
        await this.router.navigate(['/spaces']);
        return;
      }
      this.space = await firstValueFrom(this.spaces.getSpace(slugParam));
      const res: any = await firstValueFrom(this.api.getPosts({ page, spaceSlug: slugParam }));
      this.space = res?.space || this.space;
      this.posts = res?.data || res?.posts || [];
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      await this.router.navigate(['/spaces']);
    } finally {
      this.loading = false;
    }
  }
}
