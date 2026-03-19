const express               = require('express');
const Anthropic             = require('@anthropic-ai/sdk');
const { authenticateToken } = require('./auth');

const router = express.Router();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL  = 'claude-sonnet-4-20250514';

// ─── POST /api/ai/summarize-notes ────────────────────────────────────────────
router.post('/summarize-notes', authenticateToken, async (req, res, next) => {
  try {
    const { notes } = req.body;

    if (!Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ error: 'notes must be a non-empty array of strings.' });
    }

    const notesText = notes
      .map((n, i) => `Note ${i + 1}:\n${n}`)
      .join('\n\n');

    const message = await client.messages.create({
      model:      MODEL,
      max_tokens: 1024,
      messages: [
        {
          role:    'user',
          content: `You are a helpful study assistant. Summarize the following course notes into clear, concise key points that would help a student study for an exam:\n\n${notesText}`,
        },
      ],
    });

    const summary = message.content[0].text;
    res.json({ summary });
  } catch (err) {
    if (err.status) {
      return res.status(502).json({ error: `AI service error: ${err.message}` });
    }
    next(err);
  }
});

// ─── POST /api/ai/study-tips ──────────────────────────────────────────────────
router.post('/study-tips', authenticateToken, async (req, res, next) => {
  try {
    const { courseName, reviewComments } = req.body;

    if (!courseName) {
      return res.status(400).json({ error: 'courseName is required.' });
    }

    if (!Array.isArray(reviewComments) || reviewComments.length === 0) {
      return res.status(400).json({ error: 'reviewComments must be a non-empty array of strings.' });
    }

    const reviewsText = reviewComments
      .map((c, i) => `Review ${i + 1}: "${c}"`)
      .join('\n');

    const message = await client.messages.create({
      model:      MODEL,
      max_tokens: 1024,
      messages: [
        {
          role:    'user',
          content: `Based on these student reviews for the course ${courseName}, provide helpful study tips and advice for a new student taking this course:\n\n${reviewsText}`,
        },
      ],
    });

    const tips = message.content[0].text;
    res.json({ tips });
  } catch (err) {
    if (err.status) {
      return res.status(502).json({ error: `AI service error: ${err.message}` });
    }
    next(err);
  }
});

module.exports = router;
