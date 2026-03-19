-- Campus Bridge PostgreSQL Schema
-- University student platform for notes, reviews, and study groups

-- Drop tables if they exist (in dependency order)
DROP TABLE IF EXISTS study_group_members;
DROP TABLE IF EXISTS study_groups;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100)        NOT NULL,
    email         VARCHAR(255)        NOT NULL UNIQUE,
    password_hash TEXT                NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- COURSES
-- ─────────────────────────────────────────────
CREATE TABLE courses (
    id          SERIAL PRIMARY KEY,
    course_code VARCHAR(20)  NOT NULL UNIQUE,
    course_name VARCHAR(255) NOT NULL,
    department  VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- NOTES
-- ─────────────────────────────────────────────
CREATE TABLE notes (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER      NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    course_id  INTEGER      NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title      VARCHAR(255) NOT NULL,
    content    TEXT         NOT NULL,
    file_url   TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────────
CREATE TABLE reviews (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    rating     SMALLINT NOT NULL,
    comment    TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT reviews_rating_range   CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT reviews_one_per_user   UNIQUE (user_id, course_id)
);

-- ─────────────────────────────────────────────
-- STUDY GROUPS
-- ─────────────────────────────────────────────
CREATE TABLE study_groups (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER      NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    course_id    INTEGER      NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    meeting_date TIMESTAMP WITH TIME ZONE,
    location     VARCHAR(255),
    max_members  INTEGER      NOT NULL DEFAULT 10,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT study_groups_max_members_positive CHECK (max_members > 0)
);

-- ─────────────────────────────────────────────
-- STUDY GROUP MEMBERS
-- ─────────────────────────────────────────────
CREATE TABLE study_group_members (
    id              SERIAL PRIMARY KEY,
    study_group_id  INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
    joined_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT study_group_members_unique UNIQUE (study_group_id, user_id)
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_notes_user_id       ON notes(user_id);
CREATE INDEX idx_notes_course_id     ON notes(course_id);
CREATE INDEX idx_reviews_course_id   ON reviews(course_id);
CREATE INDEX idx_study_groups_course ON study_groups(course_id);

-- ─────────────────────────────────────────────
-- SEED DATA — Dalhousie University Courses
-- ─────────────────────────────────────────────
INSERT INTO courses (course_code, course_name, department) VALUES
    ('CSCI 2110', 'Data Structures and Algorithms',             'Computer Science'),
    ('CSCI 3171', 'Network Computing',                          'Computer Science'),
    ('CSCI 4177', 'Advanced Topics in Web Development',         'Computer Science'),
    ('INFO 6620', 'Business Intelligence and Analytics',        'Information Management'),
    ('INFO 6850', 'Human-Computer Interaction',                 'Information Management'),
    ('MGMT 4620', 'Strategic Management',                       'Management'),
    ('MGMT 3305', 'Organizational Behaviour',                   'Management'),
    ('COMM 2303', 'Introduction to Public Relations',           'Communication Studies'),
    ('STAT 2060', 'Introduction to Statistics for Scientists',  'Statistics'),
    ('MATH 2135', 'Linear Algebra',                             'Mathematics');
