const express           = require('express');
const pool              = require('../db');
const { authenticateToken } = require('./auth');

const router = express.Router();

// ─── GET /api/notes/course/:courseId — all notes for a course ────────────────
router.get('/course/:courseId', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT n.*, u.name AS author_name
       FROM   notes n
       JOIN   users u ON u.id = n.user_id
       WHERE  n.course_id = $1
       ORDER  BY n.created_at DESC`,
      [req.params.courseId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/notes — create a note (auth required) ─────────────────────────
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { course_id, title, content, file_url } = req.body;

    if (!course_id || !title || !content) {
      return res.status(400).json({ error: 'course_id, title, and content are required.' });
    }

    const result = await pool.query(
      `INSERT INTO notes (user_id, course_id, title, content, file_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, course_id, title, content, file_url || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/notes/:id — delete own note (auth required) ─────────────────
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT user_id FROM notes WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    if (result.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own notes.' });
    }

    await pool.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Note deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
