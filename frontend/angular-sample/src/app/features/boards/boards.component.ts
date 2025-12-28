import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BoardService, Board } from '../../core/services/board.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-boards',
  templateUrl: './boards.component.html'
})
export class BoardsComponent implements OnInit {
  boards: Board[] = [];
  loading = false;
  creating = false;
  error?: string;
  user$ = this.auth.user$;
  form = this.fb.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    type: ['free', Validators.required],
    isDefault: [false]
  });

  constructor(private boardsService: BoardService, private fb: FormBuilder, private auth: AuthService) {}

  ngOnInit(): void {
    this.load();
  }

  async load() {
    this.loading = true;
    this.error = undefined;
    try {
      this.boards = await firstValueFrom(this.boardsService.getBoards());
    } catch (err: any) {
      this.error = err?.message || '게시판 목록을 불러오지 못했습니다.';
    } finally {
      this.loading = false;
    }
  }

  async create() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.creating = true;
    this.error = undefined;
    try {
      await firstValueFrom(this.boardsService.createBoard(this.form.value as any));
      this.form.reset({ type: 'free', isDefault: false });
      await this.load();
    } catch (err: any) {
      this.error = err?.message || '게시판 생성에 실패했습니다.';
    } finally {
      this.creating = false;
    }
  }
}
