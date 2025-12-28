import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-post-form',
  templateUrl: './post-form.component.html'
})
export class PostFormComponent implements OnInit {
  loading = false;
  error?: string;
  spaceSlug?: string | null;
  id?: string | null;
  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10000)]],
    tags: [''],
    isPublished: [true],
    publishedAt: ['']
  });

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router, private route: ActivatedRoute) {}
  get f() {
    return this.form.controls;
  }

  async ngOnInit() {
    this.loading = true;
    try {
      this.id = this.route.snapshot.paramMap.get('id');
      this.spaceSlug = this.route.snapshot.paramMap.get('slug');
      if (!this.spaceSlug) {
        await this.router.navigate(['/spaces']);
        return;
      }

      if (this.id) {
        const post = await firstValueFrom(this.api.getPost(this.spaceSlug, this.id));
        this.form.patchValue({
          title: post.title ?? '',
          content: post.content ?? '',
          tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
          isPublished: post.isPublished ?? true,
          publishedAt: post.publishedAt ? String(post.publishedAt).slice(0, 16) : ''
        });
      }
    } catch (err: any) {
      this.error = err?.message || 'Unable to load post form.';
    } finally {
      this.loading = false;
    }
  }

  async submit() {
    if (this.form.invalid || !this.spaceSlug) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = undefined;
    try {
      const payload = {
        title: this.form.value.title,
        content: this.form.value.content,
        tags: this.form.value.tags?.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5),
        isPublished: !!this.form.value.isPublished,
        publishedAt: this.form.value.publishedAt || null
      };
      if (this.id) {
        await firstValueFrom(this.api.updatePost(this.spaceSlug, this.id, payload));
      } else {
        await firstValueFrom(this.api.createPost(this.spaceSlug, payload));
      }
      await this.router.navigate(['/spaces', this.spaceSlug, 'posts']);
    } catch (err: any) {
      this.error = err?.message || '작성에 실패했습니다.';
    } finally {
      this.loading = false;
    }
  }
}
