const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const { router: authRoutes } = require('./routes/auth');
const coursesRoutes     = require('./routes/courses');
const notesRoutes       = require('./routes/notes');
const reviewsRoutes     = require('./routes/reviews');
const studyGroupsRoutes = require('./routes/studyGroups');
const aiRoutes          = require('./routes/ai');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ──────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/courses',      coursesRoutes);
app.use('/api/notes',        notesRoutes);
app.use('/api/reviews',      reviewsRoutes);
app.use('/api/study-groups', studyGroupsRoutes);
app.use('/api/ai',           aiRoutes);

// ─── Health check ────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Global error handler ─────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Campus Bridge server running on port ${PORT}`);
});

module.exports = app;
