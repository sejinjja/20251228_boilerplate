# 백엔드 (포트 8080) - 게시판 API 서버

## 개요
- RESTful API로 게시판/게시글/댓글/사용자 관리를 제공합니다.
- 기본 포트 8080 (`PORT` 환경변수로만 변경).
- JWT 기반 인증/인가, 역할(일반/관리자), 게시판 단위 권한을 지원합니다.

## 빠른 시작
1) 환경 변수 (.env)
```
PORT=8080
DATABASE_FILE=./data/forum.sqlite
JWT_SECRET=change-me
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CORS_ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```
2) 의존성 설치 및 실행 (예: Node/Express)
- `npm install`
- 개발: `npm run dev`
- 프로덕션: `npm run build && npm run start`

## 모델
- boards: id, name, slug(고유), type(free|notice|trade), isDefault
- users: email(PK), displayName, password(hash), role(user|admin)
- posts: id, title, content, tags(JSON), author(email), boardId(FK), publishStart, publishEnd, deletedAt(soft delete)

## 주요 엔드포인트 (보드 중심)
- 보드
  - GET `/api/boards` (공개) 보드 목록
  - POST `/api/boards` (관리자) {name, slug, type, isDefault?}
- 게시글 (모든 요청은 보드 slug를 포함)
  - GET `/api/boards/:slug/posts` 쿼리: page, pageSize
  - GET `/api/boards/:slug/posts/:id`
  - POST `/api/boards/:slug/posts` (로그인, 공지는 관리자만) {title, content, tags?, publishStart?, publishEnd?}
  - PUT `/api/boards/:slug/posts/:id` (작성자/관리자, 공지는 관리자만)
  - DELETE `/api/boards/:slug/posts/:id` (작성자/관리자, 공지는 관리자만) soft delete
- 댓글/반응: 기존 `/api/posts/:id/comments`, `/api/posts/:id/reactions` (추후 보드 경로와 일관화 가능)
- 인증
  - POST `/api/auth/signup` {email, password, displayName}
  - POST `/api/auth/login` -> accessToken, refreshToken
  - POST `/api/auth/refresh` {refreshToken}

## 권한/게시 정책
- 보드 type별: notice는 관리자만 작성/수정/삭제, free/trade는 로그인 작성자 + 관리자.
- 게시기간: publishStart/publishEnd 범위 밖 게시글은 관리자/작성자만 조회 가능, 일반 사용자는 목록/상세에서 404.
- 삭제: soft delete(`deletedAt`).

## 입력 제약
- 제목 ≤120, 본문 ≤10,000, 태그 ≤5개(각 20자). 게시기간은 ISO datetime.
- 페이지네이션: pageSize 기본 10, 최대 50.

## 에러 포맷
- `{ "error": { "code": "...", "message": "..." } }`, HTTP 400/401/403/404/409/429/500 사용.

## 보안/운영 체크리스트
- JWT 시크릿/만료 설정, bcrypt 라운드 설정.
- 스키마 검증(zod/joi 등) 적용 권장.
- CORS origin 제한(`http://localhost:3000` 기본).
- rate limit 로그인/쓰기 요청에 적용.
- 로깅 시 민감정보 제외, 요청 ID/응답시간 기록.
- 헬스체크 `/health`, DB 마이그레이션/시드 스크립트 제공.
