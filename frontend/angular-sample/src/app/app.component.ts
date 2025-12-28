import { Component, OnInit } from '@angular/core';
import { BoardService } from './core/services/board.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Forum';
  defaultBoardSlug?: string | null;

  constructor(private boards: BoardService) {}

  async ngOnInit(): Promise<void> {
    this.defaultBoardSlug = await this.boards.getDefaultBoardSlug().catch(() => null);
  }

  get postsLink() {
    return this.defaultBoardSlug ? ['/boards', this.defaultBoardSlug, 'posts'] : ['/boards'];
  }

  get newPostLink() {
    return this.defaultBoardSlug ? ['/boards', this.defaultBoardSlug, 'posts', 'new'] : ['/boards'];
  }
}
