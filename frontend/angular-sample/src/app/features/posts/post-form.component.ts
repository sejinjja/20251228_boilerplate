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
  boards: Board[] = [];
  board?: Board;
  id?: string | null;
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
      this.id = this.route.snapshot.paramMap.get('id');
      const slugParam = this.route.snapshot.paramMap.get('slug');
      this.boards = (await firstValueFrom(this.boardsService.getBoards())) || [];
      this.board = this.boards.find(b => b.slug === slugParam) || this.boards.find(b => b.isDefault) || this.boards[0];
      if (!this.board) {
        await this.router.navigate(['/boards']);
        return;
      }
      this.form.patchValue({ boardId: this.board.id });

      if (this.id) {
        const post = await firstValueFrom(this.api.getPostByBoard(this.board.slug, this.id));
        this.form.patchValue({
          boardId: post.boardId ?? this.board.id,
          title: post.title ?? '',
          content: post.content ?? '',
          tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
          publishStart: post.publishStart ? String(post.publishStart).slice(0, 16) : '',
          publishEnd: post.publishEnd ? String(post.publishEnd).slice(0, 16) : ''
        });
      }
    } catch (err: any) {
      this.error = err?.message || 'Unable to load post form.';
    } finally {
      this.loading = false;
    }
  }

  async submit() {
    const targetSlug = this.board?.slug;
    if (this.form.invalid || !targetSlug) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = undefined;
    try {
      const payload = {
        ...this.form.value,
        tags: this.form.value.tags?.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5),
        publishStart: this.form.value.publishStart || null,
        publishEnd: this.form.value.publishEnd || null,
        boardSlug: targetSlug
      };
      if (this.id) {
        await firstValueFrom(this.api.updatePost(targetSlug, this.id, payload));
      } else {
        await firstValueFrom(this.api.createPost(payload));
      }
      await this.router.navigate(['/boards', targetSlug, 'posts']);
    } catch (err: any) {
      this.error = err?.message || '?€???¤íŒ¨';
    } finally {
      this.loading = false;
    }
  }
}
