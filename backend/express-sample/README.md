# Express Sample (API 8080)

Velog 스타일 “공간(space)” 블로그 API 예제입니다. 각 사용자는 고유한 `username`(닉네임)을 갖고, 그 username으로 공간을 생성해 게시글을 발행합니다. SQLite + JWT 인증을 사용합니다.

## 개요
- 포트: 8080 (`PORT`로 변경 가능)
- 인증: JWT access/refresh (`Authorization: Bearer <token>`)
- 사용자: `email`(로그인 ID) + 고유 `username` + `displayName`
- 공간: `slug` 고유, 1:1 소유자(username), 제목/소개
- 게시글: 공간 slug 기준, authorUsername 기반 권한, 발행/비발행 지원

## 실행
```bash
npm install
npm run dev   # nodemon
# 또는
npm run start
```

`.env` 예시
```
PORT=8080
DATABASE_FILE=./data/spaces_v3.sqlite
JWT_SECRET=change-me
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CORS_ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

## 주요 엔드포인트
- 공간
  - GET `/api/spaces` (공개) 공간 목록
  - GET `/api/spaces/:slug` (공개) 단건 조회
  - POST `/api/spaces` (인증) 내 공간 생성/확보 { slug?, title?, bio? } — username 기반 중복 검사/자동 생성
  - PATCH `/api/spaces/:slug` (소유자/관리자) 제목·소개 수정
- 게시글 (공간 slug 기준)
  - GET `/api/spaces/:slug/posts` 쿼리: page, pageSize (소유자/관리자는 비발행 포함)
  - GET `/api/spaces/:slug/posts/:id`
  - POST `/api/spaces/:slug/posts` (소유자/관리자) { title, content, tags?, isPublished?, publishedAt? }
  - PUT `/api/spaces/:slug/posts/:id` (작성자 또는 공간 소유자/관리자)
  - DELETE `/api/spaces/:slug/posts/:id` (작성자 또는 공간 소유자/관리자, soft delete)
- 인증
  - POST `/api/auth/signup` { email, username, displayName, password }
  - POST `/api/auth/login` -> { accessToken, refreshToken, user:{ email, username, displayName, role, spaceSlug } }
  - POST `/api/auth/refresh`
- 사용자
  - GET `/api/users/me`
  - PATCH `/api/users/me` (placeholder)
- 코멘트/리액션 (샘플, 메모리 저장)
  - `/api/posts/:id/comments`
  - `/api/posts/:id/reactions`

## 구조
```
backend/express-sample/
  src/
    index.js
    routes/ (auth, spaces, posts, comments, reactions, users)
    repositories/ (db, spaces, posts, users)
    middleware/ (auth, error)
```

## 설계/제약
- JWT 페이로드: { sub: email, username, role, displayName }
- 권한: 공간 소유자(username) 또는 관리자만 공간/게시글 생성·수정·삭제 가능. 게시글 수정/삭제는 작성자(username)도 허용.
- 게시글 발행 상태: `isPublished`, `publishedAt`; 비발행 게시글은 소유자/관리자만 조회.
- Soft delete: 게시글 `deletedAt`.

## 필드/검증
- 제목 ≤120자, 본문 10~10,000자, 태그 최대 5개.
- username/space slug 고유; slug는 기본적으로 username 기반으로 중복 시 숫자 suffix.
- 페이지네이션: 기본 pageSize 10, 최대 50.

## 로컬 DB
- SQLite: `./data/spaces_v3.sqlite` (환경변수로 교체 가능).

## 보안 체크
- CORS 허용 도메인, rate limit 적용.
- 오류 포맷: `{ "error": { "code": "...", "message": "..." } }`.
- 코멘트/리액션은 데모용 메모리 저장(실서비스 시 DB 전환 필요).
