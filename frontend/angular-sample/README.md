# Angular Sample (포트 3000)

게시판 클라이언트를 Angular로 구현할 때 참고할 최소 구성 예시입니다. 현재 보드(slug) 기반 라우팅을 사용합니다.

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

## 라우팅/화면 구조
```
/boards                  # 보드 목록 + 관리자 보드 생성
/boards/:slug/posts      # 보드별 글 목록
/boards/:slug/posts/:id  # 상세
/boards/:slug/posts/new  # 작성 (로그인)
/boards/:slug/posts/:id/edit # 수정 (작성자/관리자)
/login, /signup, /profile
```

## 추천 모듈/폴더 구조
```
src/app/
  core/
    interceptors/auth.interceptor.ts
    guards/auth.guard.ts
    services/auth.service.ts
    services/api.service.ts
    services/board.service.ts
  features/
    boards/
    auth/
    posts/
    profile/
  shared/
    components/
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
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'boards', component: BoardsComponent },
  { path: 'boards/:slug/posts', component: PostsComponent },
  { path: 'boards/:slug/posts/new', canActivate: [AuthGuard], component: PostFormComponent },
  { path: 'boards/:slug/posts/:id', component: PostDetailComponent },
  { path: 'boards/:slug/posts/:id/edit', canActivate: [AuthGuard], component: PostFormComponent },
  { path: 'profile', canActivate: [AuthGuard], component: ProfileComponent },
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: '**', redirectTo: '' }
];
```

## 입력 검증 체크
- 제목 required, max 120
- 본문 required, min 10, max 10,000
- 태그 최대 5개, 각 20자, 중복 방지
- 게시판(boardId) 선택 필수, 게시기간 형식 검증

## UX 포인트
- 보드 선택/슬러그 기반 라우팅으로 항상 게시판 컨텍스트 유지
- 목록: 페이지네이션, 검색/필터 확장 여지
- 상세: 게시판 정보 표시, 댓글/반응(추가 시) UI 연동
- 에러/로딩: 전역 로딩, 권한/기간 제한 시 안내 (401/403/404)

## 테스트 제안
- 인터셉터 토큰 주입/만료 후 리프레시
- AuthGuard 라우팅 차단/허용
- 보드별 게시글 CRUD(권한/기간 포함), 검증 실패 케이스
- 게시판 생성(관리자), 보드 slug 잘못된 경우 404
