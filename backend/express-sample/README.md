# Express Sample (포트 8080)

게시판 API 서버를 Express로 구현할 때 참고할 최소 구성 예시입니다. JS 기준이며, 필요 시 TS로 전환 가능합니다.

## 요구사항 요약
- 기본 포트: 8080 (`PORT`로만 변경)
- JWT 인증: access(짧게) + refresh(길게) 발급, `Authorization: Bearer` 헤더 검증
- 로그인 필수: 글/댓글 작성·수정·삭제, 반응 추가/삭제
- 권한: 작성자 또는 관리자만 수정/삭제 가능, 소프트 삭제 지원
- 페이지네이션: 기본 10, 최대 50
- 입력 제약: 제목<=120, 본문<=10,000, 태그<=5(각 20자)

## 빠른 시작
```bash
npm init -y
npm install express cors helmet morgan dotenv jsonwebtoken bcrypt cookie-parser express-rate-limit
npm install -D nodemon
```

package.json 예시:
```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  }
}
```

.env 예시:
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

## 디렉터리 구조 예시
```
express-sample/
  src/
    index.js        # 앱 부트스트랩, 미들웨어 등록
    routes/
      auth.js
      posts.js
      comments.js
      reactions.js
      users.js
    middleware/
      auth.js       # JWT 검증, req.user 주입
      error.js      # 공통 에러 핸들링
    services/       # 비즈니스 로직
    repositories/   # DB 접근 (예: Prisma/Knex/ORM)
```

## 최소 부트스트랩 예시 (src/index.js)
```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const reactionRoutes = require('./routes/reactions');
const userRoutes = require('./routes/users');
const errorHandler = require('./middleware/error');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000, max: Number(process.env.RATE_LIMIT_MAX) || 100 }));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/posts/:id/comments', commentRoutes);
app.use('/api/posts/:id/reactions', reactionRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));
app.use(errorHandler);

app.listen(PORT, () => console.log(`API server running on ${PORT}`));
```

## 인증 미들웨어 예시 (src/middleware/auth.js)
```js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: { code: 'UNAUTHENTICATED' } });
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'TOKEN_INVALID_OR_EXPIRED' } });
  }
};
```

## 라우트 스케치
- `POST /api/auth/signup` 이메일+비밀번호 해시 저장, 중복 체크
- `POST /api/auth/login` bcrypt 비교 후 access/refresh 발급
- `POST /api/auth/refresh` refresh 검증 후 새 access 발급
- `GET /api/users/me` 인증 필요, 내 정보 반환
- `PATCH /api/users/me` 프로필/비밀번호 변경
- `GET /api/posts` 공개, 검색/정렬/페이지네이션 적용
- `POST /api/posts` 인증, 제목/본문/태그 검증 후 생성
- `PUT/DELETE /api/posts/:id` 작성자/관리자만, 소프트 삭제
- `GET/POST /api/posts/:id/comments` 댓글 목록/작성
- `PUT/DELETE /api/comments/:id` 작성자/관리자만
- `POST/DELETE /api/posts/:id/reactions` 좋아요/싫어요 중복 방지

## 테스트 추천 시나리오
- 로그인/토큰 만료/리프레시 흐름
- 권한 경계: 작성자 vs 타인 vs 관리자
- 검증 오류: 제목/본문/태그 제한
- 페이지네이션/정렬 응답 형식
- Rate limit 및 CORS 동작
