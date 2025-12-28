import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html'
})
export class SignupComponent {
  loading = false;
  error?: string;
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    displayName: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = undefined;
    try {
      await this.auth.signup(this.form.value.email!, this.form.value.password!, this.form.value.displayName!);
      await this.router.navigate(['/login']);
    } catch (err: any) {
      this.error = err?.message || '회원가입 실패';
    } finally {
      this.loading = false;
    }
  }
}

