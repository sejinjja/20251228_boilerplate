import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SpaceService } from '../../core/services/space.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  postsLink: string | any[] = '/spaces';

  constructor(private auth: AuthService, private spaces: SpaceService) {}

  async ngOnInit(): Promise<void> {
    this.auth.user$.subscribe(async user => {
      if (user?.spaceSlug) {
        this.postsLink = ['/spaces', user.spaceSlug, 'posts'];
      } else if (user) {
        try {
          const space = await firstValueFrom(this.spaces.ensureMySpace());
          this.postsLink = ['/spaces', space.slug, 'posts'];
        } catch {
          this.postsLink = '/spaces';
        }
      } else {
        this.postsLink = '/spaces';
      }
    });
  }
}

