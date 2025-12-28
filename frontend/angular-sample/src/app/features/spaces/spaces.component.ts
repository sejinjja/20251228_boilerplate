import { Component, OnInit } from '@angular/core';
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
  error?: string;
  user$ = this.auth.user$;

  constructor(private spacesService: SpaceService, private auth: AuthService) {}

  ngOnInit(): void {
    this.load();
  }

  async load() {
    this.loading = true;
    this.error = undefined;
    try {
      this.spaces = await firstValueFrom(this.spacesService.getSpaces());
    } catch (err: any) {
      this.error = err?.message || '공간 목록을 불러오지 못했습니다.';
    } finally {
      this.loading = false;
    }
  }
}
