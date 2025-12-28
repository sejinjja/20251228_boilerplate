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
      const slug = this.route.snapshot.paramMap.get('slug');
      if (!slug) {
        this.router.navigate(['/boards']);
        return;
      }
      const boardList = await firstValueFrom(this.boards.getBoards());
      this.board = boardList.find(b => b.slug === slug) || boardList[0];
      if (!this.board) throw new Error('게시판을 찾을 수 없습니다.');
      const res: any = await firstValueFrom(this.api.getPosts({ page, boardSlug: slug }));
      this.posts = res?.data || res?.posts || res?.data || [];
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}
