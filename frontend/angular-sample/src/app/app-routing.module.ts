import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/login.component';
import { SignupComponent } from './features/auth/signup.component';
import { PostsComponent } from './features/posts/posts.component';
import { PostDetailComponent } from './features/posts/post-detail.component';
import { PostFormComponent } from './features/posts/post-form.component';
import { ProfileComponent } from './features/profile/profile.component';
import { SpacesComponent } from './features/spaces/spaces.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'spaces', component: SpacesComponent },
  { path: 'spaces/:slug/posts', component: PostsComponent },
  { path: 'spaces/:slug/posts/new', canActivate: [AuthGuard], component: PostFormComponent },
  { path: 'spaces/:slug/posts/:id', component: PostDetailComponent },
  { path: 'spaces/:slug/posts/:id/edit', canActivate: [AuthGuard], component: PostFormComponent },
  { path: 'profile', canActivate: [AuthGuard], component: ProfileComponent },
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
