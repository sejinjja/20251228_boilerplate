import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
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

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = undefined;
    try {
      await this.auth.login(this.form.value.email!, this.form.value.password!);
      await this.router.navigate(['/posts']);
    } catch (err: any) {
      this.error = err?.message || '로그인 실패';
    } finally {
      this.loading = false;
    }
  }
}
