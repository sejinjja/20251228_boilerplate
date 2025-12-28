import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html'
})
export class PostDetailComponent implements OnInit {
  post: any;
  loading = false;

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load() {
    this.loading = true;
    const id = this.route.snapshot.paramMap.get('id');
    const username = this.route.snapshot.paramMap.get('username');
    if (!id || !username) {
      this.router.navigate(['/spaces']);
      return;
    }
    try {
      const res: any = await firstValueFrom(this.api.getPost(username, id));
      this.post = res?.post || res;
    } finally {
      this.loading = false;
    }
  }
}
