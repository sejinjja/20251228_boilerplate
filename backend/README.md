# 백엔드 (포트 8080) - 게시판 API 서버

## 개요
- RESTful API 서버로 게시글/댓글/사용자 관리를 제공합니다.
- 기본 포트는 8080이며, `PORT` 환경 변수로만 변경합니다.
- JWT 기반 인증/인가와 역할(일반 사용자, 관리자)을 지원합니다.

## 빠른 시작
1) 환경 변수 준비 (.env)
```
PORT=8080
DATABASE_URL=postgres://user:pass@localhost:5432/forum
JWT_SECRET=change-me
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CORS_ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```
2) 의존성 설치 및 실행 (예: Node/Express 기준)
- `npm install`
- 개발: `npm run dev`
- 프로덕션: `npm run build && npm run start`

## 주요 엔드포인트(예시)
- 인증
  - POST `/api/auth/signup` {email, password, displayName}
  - POST `/api/auth/login` {email, password} -> accessToken, refreshToken
  - POST `/api/auth/refresh` {refreshToken} -> 새 accessToken
  - POST `/api/auth/logout` (선택) refresh 토큰 블랙리스트/폐기
- 사용자
  - GET `/api/users/me` (인증) 내 정보
  - PATCH `/api/users/me` (인증) 프로필/비밀번호 변경
- 게시글
  - GET `/api/posts` (공개) 쿼리: page, pageSize(기본 10, 최대 50), search, tag, author, sort(latest|popular)
  - GET `/api/posts/:id` (공개)
  - POST `/api/posts` (인증) {title, content, tags[], attachments?}
  - PUT `/api/posts/:id` (작성자/관리자) 수정
  - DELETE `/api/posts/:id` (작성자/관리자) 소프트 삭제
- 댓글
  - GET `/api/posts/:id/comments` (공개)
  - POST `/api/posts/:id/comments` (인증)
  - PUT `/api/comments/:id` (작성자/관리자)
  - DELETE `/api/comments/:id` (작성자/관리자)
- 반응
  - POST `/api/posts/:id/reactions` (인증) {type: "like"|"dislike"}
  - DELETE `/api/posts/:id/reactions` (인증) 기존 반응 제거

## 인증/인가 정책
- 모든 비밀번호는 해시(bcrypt 등)로 저장합니다.
- Access 토큰은 짧은 만료(예: 30m), Refresh 토큰은 길게(예: 7d) 발급합니다.
- 미들웨어로 `Authorization: Bearer <token>` 검증 후 `req.user`에 주입합니다.
- 권한 규칙: 글/댓글 작성·수정·삭제는 로그인 필요, 수정/삭제는 작성자 또는 관리자만 허용.
- 관리자 전용: 사용자 정지, 게시글/댓글 강제 삭제 등(필요 시).

## 게시판 비즈니스 제약
- 제목 최대 120자, 본문 최대 10,000자, 태그 최대 5개(각 20자).
- 소프트 삭제: 삭제 시 `deletedAt` 기록, 조회 시 기본적으로 제외(관리자만 포함 조회 가능).
- 조회수/좋아요 중복 방지: 사용자별 또는 IP+UserAgent 기준으로 1회만 카운트.
- 페이지네이션 기본 pageSize=10, 상한 50; 정렬 기본 최신순.
- 첨부 파일은 화이트리스트된 MIME/크기만 허용하고, 서명된 URL 등 안전한 접근 방법 사용.

## 에러/응답 규격
- 공통 에러 포맷 예시: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {...} } }`
- HTTP 상태코드 사용: 400(검증), 401(미인증), 403(권한 부족), 404(없음), 409(중복), 429(과도한 요청), 500(서버).

## 보안/운영 체크리스트
- 입력 검증: 스키마 기반(예: zod/joi/class-validator)으로 모든 요청 본문/쿼리 검증.
- CORS: 허용 origin을 프런트엔드(기본 http://localhost:3000)로 제한.
- 속도 제한: 로그인/회원가입 및 쓰기 요청에 rate limit 적용.
- 로깅/추적: 요청 ID, 응답 시간, 에러 스택 기록. 민감 정보는 로그 금지.
- 헬스체크: `/health`에서 DB 연결 및 필수 종속성 상태 반환.
- 마이그레이션/시드: DB 마이그레이션 스크립트와 기본 관리자 계정 시드 제공.
- 테스트: 인증 흐름(로그인/만료/리프레시), 권한 경계, 게시글/댓글 CRUD, 입력 검증, 속도 제한 케이스 포함.

## 개발 메모
- 모듈화: 라우트, 서비스, 저장소, 미들웨어를 계층화해 테스트 용이성 확보.
- 트랜잭션: 게시글 작성 시 태그/첨부/메타데이터 저장을 하나의 트랜잭션으로 처리.
- 배포 시 HTTPS 전제, 시계 동기화(NTP)로 JWT 만료 문제 방지.

## 게시판 운영 정책 (공지/자유, 게시기간, 권한)
- 게시판 구분: `boardType` 필수(`notice`, `free`). 공지는 관리자만 작성/수정, 자유게시판은 로그인 사용자 작성 가능.
- 게시기간: `publishStart`, `publishEnd`로 게시 노출 기간 지정. 기간 밖 게시글은 관리자/작성자만 열람·수정 가능, 일반 사용자는 조회 불가.
- 권한 매트릭스:
  - 공지: 작성/수정/삭제 관리자만, 열람은 전체(게시기간 내), 기간 외는 관리자/작성자(없으면 관리자).
  - 자유게시판: 작성 로그인 사용자, 수정/삭제 작성자 또는 관리자.
  - 댓글/반응: 로그인 필요, 수정/삭제는 작성자 또는 관리자.
- 조회 정책: 삭제(`deletedAt`)되거나 게시기간이 아닌 글은 기본 조회/목록에서 제외, 관리자/작성자는 예외적으로 접근 가능.
