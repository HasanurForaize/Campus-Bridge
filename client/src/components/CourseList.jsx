import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000';

function StarRating({ value }) {
  return (
    <span className="rating-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`rating-star${s <= Math.round(value) ? ' filled' : ''}`}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function CourseList() {
  const [courses, setCourses]   = useState([]);
  const [search,  setSearch]    = useState('');
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState('');
  const navigate                = useNavigate();

  useEffect(() => {
    fetch(`${API}/api/courses`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCourses(data);
        else setError('Failed to load courses.');
      })
      .catch(() => setError('Unable to reach the server.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.course_code.toLowerCase().includes(q) ||
      c.course_name.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="spinner">Loading courses…</div>;
  if (error)   return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Courses</h1>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code, name or department…"
          style={{
            padding: '0.5rem 0.9rem',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            fontSize: '0.9rem',
            width: 280,
            background: '#fff',
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No courses match your search.</div>
      ) : (
        <div className="course-grid">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="course-card"
              onClick={() => navigate(`/course/${course.id}`)}
            >
              <div className="course-code">{course.course_code}</div>
              <div className="course-name">{course.course_name}</div>
              <div className="course-dept">{course.department}</div>
              <div className="course-rating" style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {course.avg_rating ? (
                  <>
                    <StarRating value={parseFloat(course.avg_rating)} />
                    <span style={{ fontSize: '0.82rem', color: '#777' }}>
                      {parseFloat(course.avg_rating).toFixed(1)} ({course.review_count} review{course.review_count !== 1 ? 's' : ''})
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: '0.82rem', color: '#aaa' }}>No reviews yet</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
