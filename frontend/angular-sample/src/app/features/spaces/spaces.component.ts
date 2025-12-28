import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SpaceService, Space } from '../../core/services/space.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-spaces',
  templateUrl: './spaces.component.html'
})
export class SpacesComponent implements OnInit {
  spaces: Space[] = [];
  loading = false;
  saving = false;
  error?: string;
  user$ = this.auth.user$;
  currentUsername?: string | null;
  form = this.fb.group({
    slug: ['', Validators.required],
    title: ['', Validators.required],
    bio: ['']
  });

  constructor(private spacesService: SpaceService, private fb: FormBuilder, private auth: AuthService) {}

  ngOnInit(): void {
    this.load();
  }

  async load() {
    this.loading = true;
    this.error = undefined;
    try {
      this.spaces = await firstValueFrom(this.spacesService.getSpaces());
      const me = this.auth.getCurrentUser();
      this.currentUsername = me?.username;
      if (me) {
        const mine = this.spaces.find(s => s.ownerUsername === me.username);
        if (mine) {
          this.form.patchValue({ slug: mine.slug, title: mine.title || mine.slug, bio: mine.bio || '' });
        }
      }
    } catch (err: any) {
      this.error = err?.message || '공간 목록을 불러오지 못했습니다.';
    } finally {
      this.loading = false;
    }
  }

  async createOrClaim() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.error = undefined;
    try {
      await firstValueFrom(this.spacesService.ensureMySpace(this.form.value as any));
      this.form.reset({ slug: '', title: '', bio: '' });
      await this.load();
    } catch (err: any) {
      this.error = err?.message || '공간을 생성하거나 업데이트하는 중 오류가 발생했습니다.';
    } finally {
      this.saving = false;
    }
  }
}
