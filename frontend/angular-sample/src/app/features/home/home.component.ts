import { Component, OnInit } from '@angular/core';
import { BoardService } from '../../core/services/board.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  postsLink: string | any[] = '/boards';

  constructor(private boards: BoardService) {}

  async ngOnInit(): Promise<void> {
    const slug = await this.boards.getDefaultBoardSlug().catch(() => null);
    this.postsLink = slug ? ['/boards', slug, 'posts'] : '/boards';
  }
}

