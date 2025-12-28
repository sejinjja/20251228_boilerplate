import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { BoardService, Board } from '../../core/services/board.service';

@Component({
  selector: 'app-posts',
  templateUrl: './posts.component.html'
})
export class PostsComponent implements OnInit {
  posts: any[] = [];
  loading = false;
  board?: Board;

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router, private boards: BoardService) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(page = 1) {
    this.loading = true;
    try {
      const boardList = await firstValueFrom(this.boards.getBoards());
      const slugParam = this.route.snapshot.paramMap.get('slug');
      this.board = boardList.find(b => b.slug === slugParam) || boardList.find(b => b.isDefault) || boardList[0];
      if (!this.board) {
        await this.router.navigate(['/boards']);
        return;
      }
      if (!slugParam || slugParam !== this.board.slug) {
        this.router.navigate(['/boards', this.board.slug, 'posts']);
      }
      const res: any = await firstValueFrom(this.api.getPosts({ page, boardSlug: this.board.slug }));
      this.posts = res?.data || res?.posts || [];
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}
