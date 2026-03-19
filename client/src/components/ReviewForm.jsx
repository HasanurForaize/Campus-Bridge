import React, { useState } from 'react';

const API = 'http://localhost:5000';

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          style={{
            fontSize:   '1.6rem',
            cursor:     'pointer',
            color:      s <= (hover || value) ? '#FFD100' : '#ccc',
            transition: 'color 0.15s',
            userSelect: 'none',
          }}
        >
          ★
        </span>
      ))}
      {value > 0 && (
        <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: '#555', marginLeft: 6 }}>
          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value]}
        </span>
      )}
    </div>
  );
}

export default function ReviewForm({ courseId, token, onRefresh }) {
  const [rating,     setRating]     = useState(0);
  const [comment,    setComment]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/reviews`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ course_id: courseId, rating, comment }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit review.');
        return;
      }

      setSuccess('Review submitted!');
      setRating(0);
      setComment('');
      if (onRefresh) onRefresh();
    } catch {
      setError('Unable to reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '1.5rem' }}>
      <h3 className="section-title" style={{ marginTop: 0 }}>Write a Review</h3>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="form-group">
        <label>Rating</label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div className="form-group">
        <label htmlFor="review-comment">
          Comment <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span>
        </label>
        <textarea
          id="review-comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this course…"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}
