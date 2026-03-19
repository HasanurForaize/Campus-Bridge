const express               = require('express');
const pool                  = require('../db');
const { authenticateToken } = require('./auth');

const router = express.Router();

// ─── GET /api/study-groups/course/:courseId — groups for a course ─────────────
router.get('/course/:courseId', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT sg.*,
              u.name                  AS creator_name,
              COUNT(sgm.id)::int      AS member_count
       FROM   study_groups sg
       JOIN   users u   ON u.id  = sg.user_id
       LEFT JOIN study_group_members sgm ON sgm.study_group_id = sg.id
       WHERE  sg.course_id = $1
       GROUP  BY sg.id, u.name
       ORDER  BY sg.meeting_date ASC`,
      [req.params.courseId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/study-groups/:id — single group with members list ───────────────
router.get('/:id', async (req, res, next) => {
  try {
    const groupResult = await pool.query(
      `SELECT sg.*, u.name AS creator_name
       FROM   study_groups sg
       JOIN   users u ON u.id = sg.user_id
       WHERE  sg.id = $1`,
      [req.params.id]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Study group not found.' });
    }

    const membersResult = await pool.query(
      `SELECT u.id, u.name, u.email, sgm.joined_at
       FROM   study_group_members sgm
       JOIN   users u ON u.id = sgm.user_id
       WHERE  sgm.study_group_id = $1
       ORDER  BY sgm.joined_at ASC`,
      [req.params.id]
    );

    res.json({ ...groupResult.rows[0], members: membersResult.rows });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/study-groups — create a group (auth required) ─────────────────
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { course_id, title, description, meeting_date, location, max_members } = req.body;

    if (!course_id || !title) {
      return res.status(400).json({ error: 'course_id and title are required.' });
    }

    const result = await pool.query(
      `INSERT INTO study_groups (user_id, course_id, title, description, meeting_date, location, max_members)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        course_id,
        title,
        description   || null,
        meeting_date  || null,
        location      || null,
        max_members   || 10,
      ]
    );

    const group = result.rows[0];

    // Creator automatically joins the group
    await pool.query(
      'INSERT INTO study_group_members (study_group_id, user_id) VALUES ($1, $2)',
      [group.id, req.user.id]
    );

    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/study-groups/:id/join — join a group (auth required) ──────────
router.post('/:id/join', authenticateToken, async (req, res, next) => {
  try {
    const groupId = req.params.id;

    const groupResult = await pool.query(
      'SELECT max_members FROM study_groups WHERE id = $1',
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Study group not found.' });
    }

    const { max_members } = groupResult.rows[0];

    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS count FROM study_group_members WHERE study_group_id = $1',
      [groupId]
    );

    if (countResult.rows[0].count >= max_members) {
      return res.status(409).json({ error: 'This study group is already full.' });
    }

    await pool.query(
      'INSERT INTO study_group_members (study_group_id, user_id) VALUES ($1, $2)',
      [groupId, req.user.id]
    );

    res.status(201).json({ message: 'Successfully joined the study group.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You are already a member of this study group.' });
    }
    next(err);
  }
});

// ─── DELETE /api/study-groups/:id/leave — leave a group (auth required) ──────
router.delete('/:id/leave', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM study_group_members WHERE study_group_id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'You are not a member of this study group.' });
    }

    res.json({ message: 'Successfully left the study group.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
