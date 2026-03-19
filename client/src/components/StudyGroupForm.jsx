import React, { useState } from 'react';

const API = 'http://localhost:5000';

const INITIAL = {
  title:        '',
  description:  '',
  meeting_date: '',
  location:     '',
  max_members:  10,
};

export default function StudyGroupForm({ courseId, token, onRefresh, onCancel }) {
  const [form,       setForm]       = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim()) {
      setError('Group title is required.');
      return;
    }

    const maxNum = Number(form.max_members);
    if (!maxNum || maxNum < 2) {
      setError('Max members must be at least 2.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/study-groups`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          course_id:    courseId,
          title:        form.title,
          description:  form.description  || null,
          meeting_date: form.meeting_date || null,
          location:     form.location     || null,
          max_members:  maxNum,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create study group.');
        return;
      }

      setSuccess('Study group created!');
      setForm(INITIAL);
      if (onRefresh) onRefresh();
      if (onCancel) setTimeout(onCancel, 1200);
    } catch {
      setError('Unable to reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '1.5rem' }}>
      <h3 className="section-title" style={{ marginTop: 0 }}>Create a Study Group</h3>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="form-group">
        <label htmlFor="sg-title">Title</label>
        <input
          id="sg-title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Midterm Prep — Arrays & Trees"
        />
      </div>

      <div className="form-group">
        <label htmlFor="sg-desc">
          Description <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span>
        </label>
        <textarea
          id="sg-desc"
          name="description"
          rows={3}
          value={form.description}
          onChange={handleChange}
          placeholder="What topics will you cover? Any prerequisites?"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label htmlFor="sg-date">Meeting Date & Time</label>
          <input
            id="sg-date"
            name="meeting_date"
            type="datetime-local"
            value={form.meeting_date}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="sg-max">Max Members</label>
          <input
            id="sg-max"
            name="max_members"
            type="number"
            min={2}
            max={50}
            value={form.max_members}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="sg-location">
          Location <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          id="sg-location"
          name="location"
          type="text"
          value={form.location}
          onChange={handleChange}
          placeholder="e.g. Killam Library, Room 201 or Zoom link"
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Group'}
        </button>
        {onCancel && (
          <button type="button" className="btn" style={{ background: '#eee', color: '#333' }} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
