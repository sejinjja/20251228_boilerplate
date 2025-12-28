# Express Sample (포트 8080)

게시판 API 서버 예시입니다. SQLite를 사용하며 게시판(boards)과 게시글(posts)이 보드 슬러그/ID로 연결됩니다. JWT 인증과 관리자 역할을 지원합니다.

## 요구사항 요약
- 기본 포트: 8080 (`PORT` 환경변수로만 변경)
- 인증: JWT access/refresh, `Authorization: Bearer <token>`
- 게시판: slug 고유, type(free|notice|trade), 관리자만 보드 생성
- 게시글: 항상 특정 보드에 속함(boardId 필수), 공지 보드는 관리자만 작성/수정/삭제
- 게시기간: publishStart/publishEnd 범위 밖 글은 작성자/관리자만 조회 가능

## 빠른 시작
```bash
npm install
npm run dev   # nodemon
# 또는
npm run start
```

`.env` 예시:
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

## 주요 엔드포인트 (보드 중심)
- 보드
  - GET `/api/boards` (공개) 보드 목록
  - POST `/api/boards` (관리자) {name, slug, type=free|notice|trade, isDefault?}
- 게시글 (항상 보드 slug 포함)
  - GET `/api/boards/:slug/posts` 쿼리: page, pageSize
  - GET `/api/boards/:slug/posts/:id`
  - POST `/api/boards/:slug/posts` (로그인, 공지는 관리자만)
  - PUT `/api/boards/:slug/posts/:id` (작성자/관리자, 공지는 관리자만)
  - DELETE `/api/boards/:slug/posts/:id` (작성자/관리자, 공지는 관리자만, soft delete)
- 인증
  - POST `/api/auth/signup`
  - POST `/api/auth/login` -> accessToken, refreshToken
  - POST `/api/auth/refresh`
- 사용자
  - GET `/api/users/me`, PATCH `/api/users/me`
- 댓글/반응 (추후 보드 경로와 일관화 권장)
  - `/api/posts/:id/comments`, `/api/posts/:id/reactions`

## 디렉터리 구조
```
backend/express-sample/
  src/
    index.js
    routes/
      auth.js
      boards.js
      posts.js
      comments.js
      reactions.js
      users.js
    repositories/
      db.js
      boards.js
      posts.js
    middleware/
      auth.js
      error.js
    services/
      (비즈니스 로직 추가 시 분리)
```

## 인증/권한
- JWT 시크릿: `JWT_SECRET` (없으면 dev 기본값 사용). access 짧게, refresh 길게.
- 공지(notice) 보드는 관리자만 작성/수정/삭제.
- 게시기간 밖 글은 작성자/관리자만 조회 가능.
- 삭제는 soft delete(`deletedAt`).

## 입력 제약
- 제목 ≤120, 본문 10~10,000, 태그 ≤5개(각 20자), 게시기간 ISO datetime.
- 페이지네이션: pageSize 기본 10, 최대 50.

## 로컬 DB
- SQLite 파일: `./data/forum.sqlite` (ENV로 경로 변경 가능)
- 기본 보드 자동 생성: 자유(free), 공지(notice), 중고거래(trade).

## 품질 체크
- CORS origin 제한, rate limit 설정 확인.
- 에러 포맷: `{ "error": { "code": "...", "message": "..." } }` 사용.
- 테스트: 로그인/리프레시, 보드 생성(관리자), 보드별 게시글 CRUD, 게시기간/권한 경계, 401/403/404 응답 확인.
