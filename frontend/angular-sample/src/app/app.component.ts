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
  mySpaceUsername?: string | null;
  user$ = this.auth.user$;

  constructor(private auth: AuthService, private spaces: SpaceService) {}

  async ngOnInit(): Promise<void> {
    this.auth.user$.subscribe(async user => {
      this.mySpaceUsername = user?.space?.username || user?.username || null;
      if (user && !this.mySpaceUsername) {
        try {
          const space = await firstValueFrom(this.spaces.ensureMySpace());
          this.mySpaceUsername = space.username;
        } catch {
          // ignore
        }
      }
    });
  }

  get postsLink() {
    return this.mySpaceUsername ? ['/spaces', this.mySpaceUsername, 'posts'] : ['/spaces'];
  }

  get newPostLink() {
    return this.mySpaceUsername ? ['/spaces', this.mySpaceUsername, 'posts', 'new'] : ['/login'];
  }
}
