const express = require('express');
const pool    = require('../db');

const router = express.Router();

// ─── GET /api/courses — list all courses ─────────────────────────────────────
router.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
              ROUND(AVG(r.rating), 2) AS avg_rating,
              COUNT(r.id)::int        AS review_count
       FROM   courses c
       LEFT JOIN reviews r ON r.course_id = c.id
       GROUP  BY c.id
       ORDER  BY c.course_code`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/courses/:id — single course with avg rating ────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
              ROUND(AVG(r.rating), 2) AS avg_rating,
              COUNT(r.id)::int        AS review_count
       FROM   courses c
       LEFT JOIN reviews r ON r.course_id = c.id
       WHERE  c.id = $1
       GROUP  BY c.id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
