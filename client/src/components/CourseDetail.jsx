import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const API = 'http://localhost:5000';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function StarRating({ value }) {
  return (
    <span className="rating-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`rating-star${s <= Math.round(value) ? ' filled' : ''}`}>★</span>
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="rating-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`rating-star${s <= (hover || value) ? ' filled' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
        >★</span>
      ))}
    </span>
  );
}

function fmt(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ─── Notes tab ────────────────────────────────────────────────────────────────

function NotesTab({ courseId, courseName, token }) {
  const [notes,     setNotes]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [form,      setForm]      = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [aiResult,  setAiResult]  = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState('');

  const loadNotes = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/notes/course/${courseId}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setNotes(d))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setFormError('Title and content are required.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/notes`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ course_id: courseId, ...form }),
      });
      if (res.ok) {
        setForm({ title: '', content: '' });
        loadNotes();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Failed to post note.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    await fetch(`${API}/api/notes/${id}`, { method: 'DELETE', headers: authHeaders(token) });
    loadNotes();
  };

  const summarize = async () => {
    if (notes.length === 0) return;
    setAiLoading(true);
    setAiResult('');
    setAiError('');
    try {
      const res = await fetch(`${API}/api/ai/summarize-notes`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ notes: notes.map((n) => `${n.title}\n${n.content}`) }),
      });
      const d = await res.json();
      if (res.ok) setAiResult(d.summary);
      else setAiError(d.error || 'AI request failed.');
    } catch {
      setAiError('Unable to reach the AI service.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      {/* AI Summary */}
      {token && notes.length > 0 && (
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-dark" onClick={summarize} disabled={aiLoading}>
            {aiLoading ? '✦ Summarising…' : '✦ AI Summary'}
          </button>
          {aiResult && (
            <button className="btn btn-sm" style={{ background: '#eee' }} onClick={() => setAiResult('')}>
              Clear
            </button>
          )}
        </div>
      )}

      {aiError  && <div className="alert alert-error">{aiError}</div>}
      {aiResult && (
        <div className="ai-panel" style={{ marginBottom: '1.25rem' }}>
          <h4>✦ AI Study Summary</h4>
          <p className="ai-result">{aiResult}</p>
        </div>
      )}

      {/* Upload form */}
      {token && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="section-title" style={{ marginTop: 0 }}>Add a Note</h3>
          {formError && <div className="alert alert-error">{formError}</div>}
          <div className="form-group">
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Week 3 — Recursion"
            />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              rows={4}
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              placeholder="Paste your notes here…"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Posting…' : 'Post Note'}
          </button>
        </form>
      )}

      {/* Notes list */}
      {loading ? (
        <div className="spinner">Loading notes…</div>
      ) : notes.length === 0 ? (
        <div className="empty-state">No notes yet. Be the first to share!</div>
      ) : (
        <div className="item-list">
          {notes.map((note) => (
            <div key={note.id} className="item-card">
              <div className="item-meta">{note.author_name} · {fmt(note.created_at)}</div>
              <div className="item-title">{note.title}</div>
              <div className="item-content">{note.content}</div>
              {token && (
                <div className="item-actions">
                  <button className="btn btn-danger btn-sm" onClick={() => deleteNote(note.id)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reviews tab ──────────────────────────────────────────────────────────────

function ReviewsTab({ courseId, courseName, token }) {
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [rating,     setRating]     = useState(0);
  const [comment,    setComment]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState('');
  const [aiResult,   setAiResult]   = useState('');
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiError,    setAiError]    = useState('');

  const loadReviews = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/reviews/course/${courseId}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setReviews(d))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setFormError('Please select a rating.'); return; }
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/reviews`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ course_id: courseId, rating, comment }),
      });
      if (res.ok) {
        setRating(0);
        setComment('');
        loadReviews();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Failed to submit review.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    await fetch(`${API}/api/reviews/${id}`, { method: 'DELETE', headers: authHeaders(token) });
    loadReviews();
  };

  const getStudyTips = async () => {
    const comments = reviews.filter((r) => r.comment).map((r) => r.comment);
    if (comments.length === 0) return;
    setAiLoading(true);
    setAiResult('');
    setAiError('');
    try {
      const res = await fetch(`${API}/api/ai/study-tips`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ courseName, reviewComments: comments }),
      });
      const d = await res.json();
      if (res.ok) setAiResult(d.tips);
      else setAiError(d.error || 'AI request failed.');
    } catch {
      setAiError('Unable to reach the AI service.');
    } finally {
      setAiLoading(false);
    }
  };

  const commented = reviews.filter((r) => r.comment).length;

  return (
    <div>
      {/* AI Tips */}
      {token && commented > 0 && (
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-dark" onClick={getStudyTips} disabled={aiLoading}>
            {aiLoading ? '✦ Generating…' : '✦ AI Study Tips'}
          </button>
          {aiResult && (
            <button className="btn btn-sm" style={{ background: '#eee' }} onClick={() => setAiResult('')}>
              Clear
            </button>
          )}
        </div>
      )}

      {aiError  && <div className="alert alert-error">{aiError}</div>}
      {aiResult && (
        <div className="ai-panel" style={{ marginBottom: '1.25rem' }}>
          <h4>✦ AI Study Tips for {courseName}</h4>
          <p className="ai-result">{aiResult}</p>
        </div>
      )}

      {/* Review form */}
      {token && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="section-title" style={{ marginTop: 0 }}>Write a Review</h3>
          {formError && <div className="alert alert-error">{formError}</div>}
          <div className="form-group">
            <label>Rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div className="form-group">
            <label>Comment <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this course…"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="spinner">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="empty-state">No reviews yet. Share your experience!</div>
      ) : (
        <div className="item-list">
          {reviews.map((r) => (
            <div key={r.id} className="item-card">
              <div className="item-meta">{r.author_name} · {fmt(r.created_at)}</div>
              <StarRating value={r.rating} />
              {r.comment && <div className="item-content" style={{ marginTop: '0.4rem' }}>{r.comment}</div>}
              {token && (
                <div className="item-actions">
                  <button className="btn btn-danger btn-sm" onClick={() => deleteReview(r.id)}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Study Groups tab ─────────────────────────────────────────────────────────

function StudyGroupsTab({ courseId, token, user }) {
  const [groups,     setGroups]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState('');
  const [form,       setForm]       = useState({
    title: '', description: '', meeting_date: '', location: '', max_members: 10,
  });

  const loadGroups = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/study-groups/course/${courseId}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setGroups(d))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Title is required.'); return; }
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/study-groups`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ course_id: courseId, ...form, max_members: Number(form.max_members) }),
      });
      if (res.ok) {
        setForm({ title: '', description: '', meeting_date: '', location: '', max_members: 10 });
        setShowForm(false);
        loadGroups();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Failed to create group.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const join = async (id) => {
    const res = await fetch(`${API}/api/study-groups/${id}/join`, {
      method: 'POST', headers: authHeaders(token),
    });
    const d = await res.json();
    if (!res.ok) alert(d.error || 'Could not join group.');
    else loadGroups();
  };

  const leave = async (id) => {
    if (!window.confirm('Leave this study group?')) return;
    await fetch(`${API}/api/study-groups/${id}/leave`, {
      method: 'DELETE', headers: authHeaders(token),
    });
    loadGroups();
  };

  return (
    <div>
      {token && (
        <div style={{ marginBottom: '1rem' }}>
          <button className="btn btn-primary" onClick={() => setShowForm((p) => !p)}>
            {showForm ? 'Cancel' : '+ Create Study Group'}
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="section-title" style={{ marginTop: 0 }}>New Study Group</h3>
          {formError && <div className="alert alert-error">{formError}</div>}
          <div className="form-group">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Midterm Prep Group" />
          </div>
          <div className="form-group">
            <label>Description <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="What will this group focus on?" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label>Meeting Date & Time</label>
              <input type="datetime-local" value={form.meeting_date} onChange={(e) => setForm((p) => ({ ...p, meeting_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Max Members</label>
              <input type="number" min={2} max={50} value={form.max_members} onChange={(e) => setForm((p) => ({ ...p, max_members: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Location <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
            <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="e.g. Killam Library, Room 201" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Group'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="spinner">Loading study groups…</div>
      ) : groups.length === 0 ? (
        <div className="empty-state">No study groups yet. Create one!</div>
      ) : (
        <div className="item-list">
          {groups.map((g) => {
            const full = g.member_count >= g.max_members;
            return (
              <div key={g.id} className="item-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div className="item-title">{g.title}</div>
                    <div className="item-meta">
                      Created by {g.creator_name}
                      {g.meeting_date && ` · ${fmt(g.meeting_date)}`}
                      {g.location && ` · ${g.location}`}
                    </div>
                    {g.description && (
                      <div className="item-content" style={{ marginTop: '0.3rem' }}>{g.description}</div>
                    )}
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="badge">{g.member_count}/{g.max_members} members</span>
                      {full && <span style={{ fontSize: '0.8rem', color: '#dc3545' }}>Full</span>}
                    </div>
                  </div>
                  {token && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      {g.user_id === user?.id ? (
                        <span style={{ fontSize: '0.8rem', color: '#777', alignSelf: 'center' }}>Owner</span>
                      ) : (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => join(g.id)}
                            disabled={full}
                          >
                            Join
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => leave(g.id)}>
                            Leave
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CourseDetail (main) ──────────────────────────────────────────────────────

export default function CourseDetail() {
  const { id }            = useParams();
  const navigate          = useNavigate();
  const { token, user }   = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [activeTab, setActiveTab] = useState('notes');

  useEffect(() => {
    fetch(`${API}/api/courses/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.id) setCourse(d);
        else setError('Course not found.');
      })
      .catch(() => setError('Unable to reach the server.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner">Loading course…</div>;
  if (error)   return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      {/* Back */}
      <div className="back-link" onClick={() => navigate('/')}>← Back to Courses</div>

      {/* Course header */}
      <div className="card" style={{ marginBottom: '1.75rem', borderTop: '5px solid #FFD100' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span className="course-code">{course.course_code}</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>{course.course_name}</h1>
            <span className="course-dept">{course.department}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            {course.avg_rating ? (
              <>
                <StarRating value={parseFloat(course.avg_rating)} />
                <div style={{ fontSize: '0.85rem', color: '#777', marginTop: '0.2rem' }}>
                  {parseFloat(course.avg_rating).toFixed(1)} / 5 ({course.review_count} review{course.review_count !== 1 ? 's' : ''})
                </div>
              </>
            ) : (
              <span style={{ fontSize: '0.85rem', color: '#aaa' }}>No ratings yet</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['notes', 'reviews', 'study-groups'].map((tab) => (
          <button
            key={tab}
            className={`tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'notes' ? 'Notes' : tab === 'reviews' ? 'Reviews' : 'Study Groups'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'notes'        && <NotesTab       courseId={id} courseName={course.course_name} token={token} />}
      {activeTab === 'reviews'      && <ReviewsTab     courseId={id} courseName={course.course_name} token={token} />}
      {activeTab === 'study-groups' && <StudyGroupsTab courseId={id} token={token} user={user} />}
    </div>
  );
}
