# 프런트엔드 (포트 3000) - 게시판 클라이언트

## 개요
- 게시판용 SPA로 백엔드(기본 8080) REST API와 통신합니다.
- 로그인/회원가입/로그아웃, JWT 인증 흐름, 게시판 단위 라우팅을 지원합니다.

## 실행/빌드
- 요구사항: Node.js 18+
- 설치: `npm install`
- 개발 서버: `npm run dev` (기본 3000, PORT로 변경 가능)
- 빌드: `npm run build`
- 미리보기: `npm run preview`
- 기본 백엔드: `http://localhost:8080`

## 환경 변수 예시 (.env.local)
PORT=3000
VITE_API_BASE_URL=http://localhost:8080
VITE_JWT_STORAGE_KEY=forum_access_token
VITE_REFRESH_ENDPOINT=/api/auth/refresh
VITE_PAGE_SIZE_DEFAULT=10

## 라우팅/화면
- `/boards`: 보드 목록, 관리자용 보드 생성 폼
- `/boards/:slug/posts`: 보드별 글 목록
- `/boards/:slug/posts/:id`: 상세 보기
- `/boards/:slug/posts/new`: 글 작성 (로그인 필요)
- `/boards/:slug/posts/:id/edit`: 글 수정 (작성자/관리자)
- `/login`, `/signup`, `/profile`

## 게시글/게시판 요구사항
- 게시글 작성/수정 시 보드 선택 필수(`boardId`), 게시 시작/종료 시간 지정 가능.
- 공지/중고거래 등 보드 종류는 보드 메타데이터에 따라 권한 처리(관리자만 공지 작성/수정/삭제).
- 목록은 항상 보드 컨텍스트에서 로드; 404/403 시 적절한 안내.
- 입력 검증: 제목 ≤120, 본문 10~10,000, 태그 ≤5개(각 20자), 게시기간 형식 검증.

## 품질 체크리스트
- API 모듈은 보드 slug 기반 경로 사용(`/api/boards/:slug/posts`).
- 보호 라우트: 작성/수정/프로필 등에 AuthGuard 적용.
- 폼: 클라이언트 검증 후 제출, 서버 검증 에러 메시지 표기.
- 테스트 권장: 인증(만료/리프레시), 보드별 라우팅, 게시글 CRUD(권한/기간 포함), 보드 생성(관리자), 폼 검증/에러 UX.
