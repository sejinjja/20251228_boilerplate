# Angular Sample (포트 3000)

Velog 스타일 공간 기반 블로그의 Angular 프론트입니다. 각 사용자가 가진 `username`으로 공간이 생성되고, 그 공간에 게시글을 작성합니다.

## 요약
- 기본 포트: 3000 (`ng serve --port 3000`)
- 백엔드 기본: http://localhost:8080
- JWT 인증: 로그인 시 access/refresh 토큰을 localStorage에 저장, 인터셉터가 자동 헤더/리프레시 처리
- 보호 라우트: 토큰 없으면 `/login`으로 이동

## 라우팅 구조
```
/spaces                  # 공간 목록 + 내 공간 만들기
/spaces/:slug/posts      # 해당 공간 게시글 목록
/spaces/:slug/posts/:id  # 게시글 상세
/spaces/:slug/posts/new  # 작성 (소유자/관리자)
/spaces/:slug/posts/:id/edit # 수정
/login, /signup, /profile
```

## 주요 폴더
```
src/app/
  core/
    interceptors/auth.interceptor.ts
    guards/auth.guard.ts
    services/auth.service.ts
    services/api.service.ts
    services/space.service.ts
  features/
    spaces/
    auth/
    posts/
    profile/
```

## 입력/검증
- 회원가입: email, username(고유), displayName, password(6자 이상)
- 글: 제목 ≤120자, 본문 10~10,000자, 태그 최대 5개, 발행/비발행 + 발행시각

## 환경설정 (`src/environments/environment.ts`)
```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',
  refreshEndpoint: '/api/auth/refresh',
  pageSizeDefault: 10,
  jwtStorageKey: 'forum_access_token'
};
```

## 인터셉터
`core/interceptors/auth.interceptor.ts` 에서 Authorization 헤더 추가 및 401/419 시 자동 refresh 후 재시도.

## 빌드/실행
```bash
npm install
npm run start   # ng serve --port 3000
npm run build
```
