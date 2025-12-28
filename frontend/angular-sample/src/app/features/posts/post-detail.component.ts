import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html'
})
export class PostDetailComponent implements OnInit {
  post: any;
  loading = false;

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  async load() {
    this.loading = true;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    try {
      this.post = await this.api.getPost(id).toPromise();
    } finally {
      this.loading = false;
    }
  }
}
