# Angular Sample (포트 3000)

게시판 클라이언트를 Angular로 구현할 때 참고할 최소 구성 예시입니다.

## 요구사항 요약
- 기본 포트: 3000 (`ng serve --port 3000`)
- 백엔드 기본: http://localhost:8080
- JWT 인증: 로그인 후 토큰 저장(메모리+localStorage), 인터셉터로 헤더 주입, 만료 시 리프레시
- 라우트 보호: 인증 가드로 보호 라우트 차단, 미인증 시 `/login`

## 프로젝트 생성
```bash
npm install -g @angular/cli
ng new angular-sample --routing --style=scss
cd angular-sample
npm install @auth0/angular-jwt
```

## 환경 설정 (`src/environments/environment.ts`)
```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',
  refreshEndpoint: '/api/auth/refresh',
  pageSizeDefault: 10,
  jwtStorageKey: 'forum_access_token'
};
```

## 추천 모듈/폴더 구조
```
src/app/
  core/
    interceptors/auth.interceptor.ts
    guards/auth.guard.ts
    services/auth.service.ts
    services/api.service.ts
  features/
    auth/ (login/signup pages)
    posts/ (list/detail/new/edit)
    profile/
  shared/
    components/ (layout, pagination, tag pills)
    validators/
```

## 인터셉터 예시 (`core/interceptors/auth.interceptor.ts`)
```ts
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getAccessToken();
    const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 || err.status === 419) {
          return this.auth.refresh().pipe(
            switchMap(newToken => {
              if (!newToken) return throwError(() => err);
              const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next.handle(retryReq);
            })
          );
        }
        return throwError(() => err);
      })
    );
  }
}
```

## 라우트 예시 (`app-routing.module.ts`)
```ts
const routes: Routes = [
  { path: 'login', loadChildren: () => import('./features/auth/login.module').then(m => m.LoginModule) },
  { path: 'signup', loadChildren: () => import('./features/auth/signup.module').then(m => m.SignupModule) },
  { path: 'posts', loadChildren: () => import('./features/posts/posts.module').then(m => m.PostsModule) },
  { path: 'posts/:id', loadChildren: () => import('./features/posts/detail.module').then(m => m.DetailModule) },
  { path: 'posts/:id/edit', canActivate: [AuthGuard], loadChildren: () => import('./features/posts/edit.module').then(m => m.EditModule) },
  { path: 'posts/new', canActivate: [AuthGuard], loadChildren: () => import('./features/posts/new.module').then(m => m.NewModule) },
  { path: 'profile', canActivate: [AuthGuard], loadChildren: () => import('./features/profile/profile.module').then(m => m.ProfileModule) },
  { path: '', pathMatch: 'full', redirectTo: 'posts' }
];
```

## 폼 검증 체크
- 제목 required, max 120
- 본문 required, min 10, max 10,000
- 태그 최대 5개, 각 20자, 중복 방지
- 서버 검증 에러는 필드별 메시지로 매핑

## UX 포인트
- 목록: 페이지네이션(기본 10, 최대 50), 검색/태그 필터, 최신순 기본, 인기순 옵션
- 상세: 좋아요/싫어요 상태 반영, 댓글 CRUD(작성자/관리자 권한)
- 에러/로딩: 전역 로딩 인디케이터, 토스트/스낵바로 안내, 401/권한 부족 시 리다이렉트 및 메시지

## 테스트 제안
- 인터셉터 토큰 주입/만료 후 리프레시
- AuthGuard 라우팅 차단/허용
- 게시글/댓글 CRUD 흐름, 검증 실패 케이스
- 페이지네이션/검색/정렬 쿼리 동작
