import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { BoardService, Board } from '../../core/services/board.service';

@Component({
  selector: 'app-post-form',
  templateUrl: './post-form.component.html'
})
export class PostFormComponent implements OnInit {
  loading = false;
  error?: string;
  id = this.route.snapshot.paramMap.get('id');
  boards: Board[] = [];
  form = this.fb.group({
    boardId: [null as number | null, [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(120)]],
    content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10000)]],
    tags: [''],
    publishStart: [''],
    publishEnd: ['']
  });

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private boardsService: BoardService,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  get f() {
    return this.form.controls;
  }

  async ngOnInit() {
    this.loading = true;
    try {
      this.boards = (await firstValueFrom(this.boardsService.getBoards())) || [];
    } catch (err: any) {
      this.error = err?.message || '게시판 목록을 불러올 수 없습니다.';
    } finally {
      this.loading = false;
    }
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = undefined;
    try {
      const payload = {
        ...this.form.value,
        boardId: this.form.value.boardId,
        tags: this.form.value.tags?.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5),
        publishStart: this.form.value.publishStart || null,
        publishEnd: this.form.value.publishEnd || null
      };
      if (this.id) {
        await firstValueFrom(this.api.updatePost(this.id, payload));
      } else {
        await firstValueFrom(this.api.createPost(payload));
      }
      await this.router.navigate(['/posts']);
    } catch (err: any) {
      this.error = err?.message || '저장 실패';
    } finally {
      this.loading = false;
    }
  }
}
