import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { BoardService } from '../../core/services/board.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  loading = false;
  error?: string;
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private boards: BoardService, private router: Router) {}
  get f() {
    return this.form.controls;
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = undefined;
    try {
      await this.auth.login(this.form.value.email!, this.form.value.password!);
      const defaultSlug = await this.boards.getDefaultBoardSlug().catch(() => null);
      const target = defaultSlug ? ['/boards', defaultSlug, 'posts'] : ['/boards'];
      await this.router.navigate(target);
    } catch (err: any) {
      this.error = err?.message || '로그인 실패';
    } finally {
      this.loading = false;
    }
  }
}

