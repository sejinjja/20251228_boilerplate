import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { SpaceService } from './core/services/space.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'User Spaces';
  mySpaceSlug?: string | null;
  user$ = this.auth.user$;

  constructor(private auth: AuthService, private spaces: SpaceService) {}

  async ngOnInit(): Promise<void> {
    this.auth.user$.subscribe(async user => {
      this.mySpaceSlug = user?.spaceSlug || null;
      if (user && !user.spaceSlug) {
        try {
          const space = await firstValueFrom(this.spaces.ensureMySpace());
          this.mySpaceSlug = space.slug;
        } catch {
          // ignore
        }
      }
    });
  }

  get postsLink() {
    return this.mySpaceSlug ? ['/spaces', this.mySpaceSlug, 'posts'] : ['/spaces'];
  }

  get newPostLink() {
    return this.mySpaceSlug ? ['/spaces', this.mySpaceSlug, 'posts', 'new'] : ['/login'];
  }
}
