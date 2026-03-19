# Campus Bridge — Complete Build Guide

## What You're Building

**Campus Bridge** is a web app for Dalhousie University students to:
- Share and download course notes
- Write and read course reviews
- Arrange group study sessions

**Tech Stack:** React (frontend) + Node.js/Express (backend) + PostgreSQL (database) + Claude API (AI features)

---

## Project Structure

```
campus-bridge/
├── client/                  # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── CourseList.jsx
│   │   │   ├── CourseDetail.jsx
│   │   │   ├── NoteUpload.jsx
│   │   │   ├── ReviewForm.jsx
│   │   │   ├── StudyGroupForm.jsx
│   │   │   ├── AISummary.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
├── server/                  # Node.js backend
│   ├── routes/
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── notes.js
│   │   ├── reviews.js
│   │   ├── studyGroups.js
│   │   └── ai.js
│   ├── db.js
│   ├── server.js
│   └── package.json
├── schema.sql               # Database schema
├── .env                     # Environment variables (DO NOT commit)
└── README.md
```

---

## Step-by-Step Prompts

Use these prompts one at a time in Claude. After each step, save the generated code into the correct file in your project.

---

### PROMPT 1 — Database Schema

```
Create a PostgreSQL schema for a university student platform called "Campus Bridge" with these tables:

1. users — id (serial primary key), name, email (unique), password_hash, created_at
2. courses — id (serial primary key), course_code (e.g., "CSCI 2110"), course_name, department, created_at
3. notes — id (serial primary key), user_id (FK to users), course_id (FK to courses), title, content (text), file_url (nullable), created_at
4. reviews — id (serial primary key), user_id (FK to users), course_id (FK to courses), rating (1-5 integer), comment (text), created_at
5. study_groups — id (serial primary key), user_id (FK to users who created it), course_id (FK to courses), title, description, meeting_date (timestamp), location, max_members (integer), created_at
6. study_group_members — id (serial primary key), study_group_id (FK), user_id (FK), joined_at

Add unique constraints so a user can only review a course once. Add CHECK constraint on rating between 1 and 5. Include some INSERT statements to seed 8-10 Dalhousie courses (use real course codes like CSCI 2110, INFO 6620, MGMT 4620, COMM 2303, etc.).

Output only the SQL file.
```

Save the output as `schema.sql`.

---

### PROMPT 2 — Backend Setup (server.js + db.js)

```
Create a Node.js + Express backend for "Campus Bridge". I need two files:

FILE 1: server/db.js
- Use the "pg" package to create a PostgreSQL connection pool
- Read connection settings from environment variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
- Export the pool

FILE 2: server/server.js
- Express app on port 5000
- Use cors, express.json middleware
- Import and use these route files (I'll create them next):
  - /api/auth → ./routes/auth
  - /api/courses → ./routes/courses
  - /api/notes → ./routes/notes
  - /api/reviews → ./routes/reviews
  - /api/study-groups → ./routes/studyGroups
  - /api/ai → ./routes/ai

Also create server/package.json with dependencies: express, cors, pg, dotenv, bcryptjs, jsonwebtoken, @anthropic-ai/sdk, multer
```

Save the outputs into `server/db.js`, `server/server.js`, and `server/package.json`.

---

### PROMPT 3 — Auth Routes

```
Create server/routes/auth.js for Campus Bridge.

Use Express Router, bcryptjs for hashing, and jsonwebtoken for tokens.

Endpoints:
1. POST /register — accepts { name, email, password }, hashes password with bcryptjs, inserts into users table, returns JWT token
2. POST /login — accepts { email, password }, verifies credentials, returns JWT token

Also create a middleware function "authenticateToken" that:
- Reads the Authorization header (Bearer <token>)
- Verifies the JWT
- Attaches user info to req.user
- Export both the router and the middleware

Use process.env.JWT_SECRET for the secret key.
```

Save as `server/routes/auth.js`.

---

### PROMPT 4 — Course, Notes, Reviews, and Study Group Routes

```
Create four Express route files for Campus Bridge. Each should import the db pool from "../db" and the authenticateToken middleware from "./auth".

FILE 1: server/routes/courses.js
- GET / — list all courses (public, no auth needed)
- GET /:id — get a single course with its average rating

FILE 2: server/routes/notes.js
- GET /course/:courseId — get all notes for a course
- POST / — create a note (requires auth). Accepts { course_id, title, content }
- DELETE /:id — delete a note (only the author, requires auth)

FILE 3: server/routes/reviews.js
- GET /course/:courseId — get all reviews for a course with user names
- POST / — create a review (requires auth). Accepts { course_id, rating, comment }
- DELETE /:id — delete a review (only the author, requires auth)

FILE 4: server/routes/studyGroups.js
- GET /course/:courseId — get all study groups for a course with member count
- GET /:id — get a study group with its members list
- POST / — create a study group (requires auth). Accepts { course_id, title, description, meeting_date, location, max_members }
- POST /:id/join — join a study group (requires auth, check max_members not exceeded)
- DELETE /:id/leave — leave a study group (requires auth)

Return appropriate error messages and status codes.
```

Save each file into the `server/routes/` folder.

---

### PROMPT 5 — Claude AI Route

```
Create server/routes/ai.js for Campus Bridge.

This route uses the Anthropic SDK (@anthropic-ai/sdk) to provide AI-powered features.

Setup:
- Import Anthropic from "@anthropic-ai/sdk"
- Create client with api key from process.env.ANTHROPIC_API_KEY
- Use model "claude-sonnet-4-20250514"

Endpoints:

1. POST /summarize-notes — requires auth
   - Accepts { notes } which is an array of note content strings
   - Sends them to Claude with a prompt like: "You are a helpful study assistant. Summarize the following course notes into clear, concise key points that would help a student study for an exam: [notes]"
   - Returns the AI summary

2. POST /study-tips — requires auth
   - Accepts { courseName, reviewComments } (array of review comment strings)
   - Sends to Claude with prompt: "Based on these student reviews for the course [courseName], provide helpful study tips and advice for a new student taking this course: [reviews]"
   - Returns the tips

Add error handling for API failures. Use max_tokens of 1024.
```

Save as `server/routes/ai.js`.

---

### PROMPT 6 — React Frontend Setup

```
I'm building the React frontend for Campus Bridge using Create React App. 

Create these files:

FILE 1: client/src/App.jsx
- Use React Router with these routes:
  / → CourseList
  /course/:id → CourseDetail
  /login → Login
  /register → Register
- Include a Navbar component at the top
- Store auth token in React state (with context or prop drilling is fine)
- Style the app with a clean, modern look using a Dalhousie-inspired color scheme (gold #FFD100 and black #000000 as accents)

FILE 2: client/src/components/Navbar.jsx
- Shows "Campus Bridge" branding
- Navigation links: Home (course list)
- If logged in: show user name and Logout button
- If not logged in: show Login and Register links

FILE 3: client/src/components/Login.jsx and Register.jsx
- Simple forms that POST to /api/auth/login and /api/auth/register
- On success, store the JWT token and redirect to home
- Show error messages on failure

Use fetch() for API calls to http://localhost:5000. Use inline CSS or a single CSS file for styling. Keep it clean and simple.
```

---

### PROMPT 7 — Course List and Course Detail Pages

```
Create React components for Campus Bridge:

FILE 1: client/src/components/CourseList.jsx
- Fetches all courses from GET /api/courses on mount
- Displays courses in a card grid layout
- Each card shows: course_code, course_name, department, average rating (stars)
- Clicking a card navigates to /course/:id
- Include a search bar to filter courses by code or name

FILE 2: client/src/components/CourseDetail.jsx
- Takes course ID from URL params
- Fetches course info, notes, reviews, and study groups for this course
- Displays in tabbed sections: Notes | Reviews | Study Groups
- Notes tab: list of notes with title and content, plus a NoteUpload form if logged in
- Reviews tab: list of reviews with rating stars and comments, plus ReviewForm if logged in
- Study Groups tab: list of study groups with join button, plus StudyGroupForm if logged in
- Include an "AI Summary" button in the Notes tab that sends all notes to POST /api/ai/summarize-notes and displays the result
- Include an "AI Study Tips" button in the Reviews tab that sends reviews to POST /api/ai/study-tips

API base URL: http://localhost:5000
Pass the auth token in Authorization header for protected routes.
Use the Dalhousie color scheme (gold #FFD100, black, white).
```

---

### PROMPT 8 — Sub-components (Forms)

```
Create these small React form components for Campus Bridge:

FILE 1: client/src/components/NoteUpload.jsx
- Form with fields: title (text input), content (textarea)
- POSTs to /api/notes with course_id, title, content
- On success, call a refresh callback prop to reload the notes list
- Include auth token in headers

FILE 2: client/src/components/ReviewForm.jsx
- Form with fields: rating (1-5 star selector), comment (textarea)
- POSTs to /api/reviews with course_id, rating, comment
- Star selector: clickable stars that highlight on selection
- On success, call a refresh callback prop

FILE 3: client/src/components/StudyGroupForm.jsx
- Form with fields: title, description, meeting_date (datetime-local input), location, max_members (number)
- POSTs to /api/study-groups
- On success, call a refresh callback prop

FILE 4: client/src/components/AISummary.jsx
- Receives a loading state and summary text as props
- Displays a loading spinner while waiting
- Renders the AI summary in a nicely formatted card

All forms should show success/error messages. Keep styling consistent with Dalhousie theme.
```

---

## How to Set Up and Run Locally

### Prerequisites
- Node.js (v18+) — download from https://nodejs.org
- PostgreSQL — download from https://www.postgresql.org/download/
- An Anthropic API key — get one from https://console.anthropic.com

### Step 1: Clone or create your project folder

```bash
mkdir campus-bridge
cd campus-bridge
mkdir -p client/src/components server/routes
```

### Step 2: Set up the database

```bash
# Open PostgreSQL terminal
psql -U postgres

# Create the database
CREATE DATABASE campusbridge;

# Connect to it
\c campusbridge

# Run your schema file
\i schema.sql

# Exit
\q
```

### Step 3: Configure environment variables

Create a file called `.env` in the `server/` folder:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=campusbridge
JWT_SECRET=your_secret_key_here_make_it_long
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
PORT=5000
```

### Step 4: Install backend dependencies

```bash
cd server
npm install
```

### Step 5: Start the backend

```bash
node server.js
```

You should see: "Server running on port 5000"

### Step 6: Set up the React frontend

Open a NEW terminal window:

```bash
cd campus-bridge/client
npx create-react-app .
npm install react-router-dom
```

Now replace the files in `src/` with the ones you generated from the prompts above.

### Step 7: Start the frontend

```bash
npm start
```

This opens http://localhost:3000 in your browser.

---

## How to Deploy on Azure

### Option A: Azure App Service

1. Go to https://portal.azure.com
2. Create a new **App Service** (Node.js runtime, Linux)
3. Create an **Azure Database for PostgreSQL**
4. In the App Service settings, add your environment variables (DB_HOST, DB_PASSWORD, etc.) under **Configuration > Application settings**
5. Build your React app: `cd client && npm run build`
6. Move the `build/` folder into your `server/` directory
7. Add this to `server.js` to serve the React build:
   ```javascript
   const path = require('path');
   app.use(express.static(path.join(__dirname, 'build')));
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, 'build', 'index.html'));
   });
   ```
8. Deploy using VS Code Azure extension or Azure CLI:
   ```bash
   az webapp up --name campus-bridge --resource-group your-resource-group
   ```

### Option B: GitHub (if out of Azure credits)

1. Create a GitHub repository
2. Push your code (make sure `.env` is in `.gitignore`!)
3. Include a clear README.md explaining how to run the app

---

## Anthropic API Key Setup

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Go to **API Keys** in the dashboard
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-...`)
6. Paste it into your `.env` file as `ANTHROPIC_API_KEY`

Note: The API has usage-based pricing. For this assignment, your usage will likely be very minimal (a few cents at most). You can set a spending limit in the console.

---

## Quick Checklist for Submission

- [ ] Working web application with UI, backend logic, database, and API integration
- [ ] Code is clean, well-commented, and readable
- [ ] README document (up to 1000 words) describing:
  - The problem you're solving
  - Your solution (Campus Bridge)
  - How the web application works
- [ ] Application hosted on Azure OR code on GitHub
- [ ] All files submitted to Brightspace as a folder with PDF + code

---

## Order to Build

1. Database first (Prompt 1) — run the SQL
2. Backend server setup (Prompt 2) — get Express running
3. Auth routes (Prompt 3) — test registration/login with Postman or curl
4. CRUD routes (Prompt 4) — test each endpoint
5. AI route (Prompt 5) — test with sample data
6. React frontend (Prompts 6-8) — build the UI
7. Connect everything and test end-to-end
8. Deploy to Azure or push to GitHub
9. Write your README
