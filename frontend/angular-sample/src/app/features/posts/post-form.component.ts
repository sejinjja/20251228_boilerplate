import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-post-form',
  templateUrl: './post-form.component.html'
})
export class PostFormComponent {
  loading = false;
  error?: string;
  id = this.route.snapshot.paramMap.get('id');
  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10000)]],
    tags: ['']
  });

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router, private route: ActivatedRoute) {}

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = undefined;
    try {
      const payload = { ...this.form.value, tags: this.form.value.tags?.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5) };
      if (this.id) {
        await this.api.updatePost(this.id, payload).toPromise();
      } else {
        await this.api.createPost(payload).toPromise();
      }
      await this.router.navigate(['/posts']);
    } catch (err: any) {
      this.error = err?.message || '저장 실패';
    } finally {
      this.loading = false;
    }
  }
}
