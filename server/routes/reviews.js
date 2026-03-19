const express               = require('express');
const pool                  = require('../db');
const { authenticateToken } = require('./auth');

const router = express.Router();

// ─── GET /api/reviews/course/:courseId — all reviews for a course ─────────────
router.get('/course/:courseId', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name AS author_name
       FROM   reviews r
       JOIN   users u ON u.id = r.user_id
       WHERE  r.course_id = $1
       ORDER  BY r.created_at DESC`,
      [req.params.courseId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/reviews — create a review (auth required) ─────────────────────
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { course_id, rating, comment } = req.body;

    if (!course_id || rating === undefined) {
      return res.status(400).json({ error: 'course_id and rating are required.' });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (user_id, course_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, course_id, rating, comment || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You have already reviewed this course.' });
    }
    next(err);
  }
});

// ─── DELETE /api/reviews/:id — delete own review (auth required) ──────────────
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT user_id FROM reviews WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    if (result.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own reviews.' });
    }

    await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.json({ message: 'Review deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
