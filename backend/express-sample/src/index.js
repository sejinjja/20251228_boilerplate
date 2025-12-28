require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const spaceRoutes = require('./routes/spaces');
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
app.use('/api/spaces', spaceRoutes);
app.use('/api', postRoutes); // posts routes are nested under /spaces/:slug
app.use('/api/posts/:id/comments', commentRoutes);
app.use('/api/posts/:id/reactions', reactionRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));
app.use(errorHandler);

app.listen(PORT, () => console.log(`API server running on ${PORT}`));
