import React, { useState } from 'react';

const API = 'http://localhost:5000';

export default function NoteUpload({ courseId, token, onRefresh }) {
  const [form,       setForm]       = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/notes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ course_id: courseId, ...form }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to post note.');
        return;
      }

      setSuccess('Note posted successfully!');
      setForm({ title: '', content: '' });
      if (onRefresh) onRefresh();
    } catch {
      setError('Unable to reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '1.5rem' }}>
      <h3 className="section-title" style={{ marginTop: 0 }}>Add a Note</h3>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="form-group">
        <label htmlFor="note-title">Title</label>
        <input
          id="note-title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Week 3 — Recursion"
        />
      </div>

      <div className="form-group">
        <label htmlFor="note-content">Content</label>
        <textarea
          id="note-content"
          name="content"
          rows={5}
          value={form.content}
          onChange={handleChange}
          placeholder="Paste or type your notes here…"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Posting…' : 'Post Note'}
      </button>
    </form>
  );
}
