# College Academic Portal

A full-stack institutional Academic Management Portal and Department Operating System designed for higher education departments. It provides role-based access control (RBAC), multi-tenant college and department isolation, course management, attendance tracking, assignments with grading, continuous assessment marks, schedules, and administrative operations.

---

## Architecture Overview

```
                        ┌───────────────────────────────┐
                        │      Client Web Browser       │
                        │   (React + Vite + Tailwind)   │
                        └───────────────┬───────────────┘
                                        │ HTTPS / REST API
                                        ▼
                        ┌───────────────────────────────┐
                        │     Express API Server        │
                        │    (Node.js + TypeScript)     │
                        └───────┬───────────────┬───────┘
                                │               │
                                ▼               ▼
                    ┌──────────────────┐ ┌──────────────┐
                    │  MongoDB Atlas   │ │ S3 / R2 /    │
                    │  (Database)      │ │ Local Uploads│
                    └──────────────────┘ └──────────────┘
```

---

## User Roles & Capabilities

The portal enforces role-based access controls across four primary institutional roles:

### 1. Student
- **Dashboard**: Academic overview, today's schedule, recent announcements, pending tasks.
- **Enrolled Courses**: Syllabus, instructors, and access to course materials (lecture notes, PPTs, lab manuals, reference books).
- **Assignments**: View assignment briefs, submit coursework online, and review grades and instructor feedback.
- **Attendance**: View course-by-course attendance percentage and detailed session history.
- **Marks & Results**: View continuous internal assessment (CIA) marks and term grade breakdowns.
- **Timetable & Calendar**: Weekly lecture schedule and department events.

### 2. Faculty
- **Course Management**: Access assigned courses and upload categorized course materials.
- **Attendance Tracking**: Mark and update attendance per lecture or lab session with reason tracking for corrections.
- **Assignment Operations**: Create and publish assignments with attachments, due dates, and rubrics; grade submissions with feedback.
- **Marks Entry**: Record assessment and examination scores with instant gradebook synchronization.
- **Announcements**: Post targeted announcements to enrolled course students.
- **Student Roster**: Inspect individual student attendance and performance records for assigned courses.

### 3. Head of Department (HOD)
- **Department Overview**: Department-wide analytics on student performance, attendance metrics, and faculty workload.
- **Faculty Directory**: Faculty profiles, workload, course allotments, and contact information.
- **Student Analytics**: Filter students by semester, section, or attendance risk criteria.
- **Course Monitoring**: Progress and engagement metrics across all department offerings.
- **Lab Management**: Lab facilities, equipment allocations, and assigned in-charges.
- **Academic Reports**: Export attendance, exam results, faculty workload, and student performance summaries.

### 4. Administrator
- **Account Provisioning**: Single-user creation and bulk CSV import for students and faculty.
- **Institutional Structure**: Manage departments, batches, sections, semesters, and academic years.
- **Course & Teaching Assignments**: Allot courses and practicals to faculty members.
- **Audit Logs**: Review system-wide administrative actions and security events.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, Framer Motion, Zustand, React Router DOM v6, Lucide Icons |
| **Backend** | Node.js (v20+), Express.js, TypeScript, Mongoose (MongoDB ODM), JWT authentication, Helmet, CORS |
| **Database** | MongoDB Atlas (Multi-tenant schema design with indexed queries) |
| **File Storage** | Pluggable storage service supporting local disk, AWS S3, or Cloudflare R2 |
| **Testing** | Jest with `ts-jest` and `supertest` for backend unit and API integration tests |

---

## Project Structure

```
COLLEGE-ACADEMIC-PORTAL/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection and environment configuration
│   │   ├── controllers/     # API route handlers (auth, attendance, marks, courses, etc.)
│   │   ├── middleware/      # JWT auth, role validation, rate limiting, error handlers
│   │   ├── models/          # Mongoose data models
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic, audit logging, notifications, storage
│   │   ├── tests/           # Jest unit and integration test suites
│   │   ├── server.ts        # Server bootstrap and lifecycle
│   │   └── seed.ts          # Department demo data seeder (optional)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components, layout shells, command palette
│   │   ├── pages/           # Portals for Student, Faculty, HOD, and Admin
│   │   ├── services/        # Axios API clients
│   │   ├── store/           # Zustand state stores (auth, settings)
│   │   ├── App.tsx          # Application routing and role guards
│   │   └── main.tsx         # Client bootstrap
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── deployment/              # Docker Compose and Nginx reverse proxy configurations
└── docs/                    # Production deployment and API reference documentation
```

---

## Local Setup

### Prerequisites
- **Node.js** >= 20.x
- **npm** >= 10.x
- **MongoDB** running locally or a MongoDB Atlas connection string

### 1. Backend Setup
Navigate to the `backend/` directory:
```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (refer to `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/academic_portal
JWT_SECRET=your_development_jwt_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=your_development_jwt_refresh_secret_key_minimum_32
FRONTEND_URL=http://localhost:5173
STORAGE_PROVIDER=local
UPLOAD_DIR=./uploads
```

Build and run the backend in development mode:
```bash
npm run build
npm run dev
```

Run backend tests:
```bash
npm test
```

### 2. Frontend Setup
Navigate to the `frontend/` directory in a new terminal:
```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` (refer to `.env.example`):
```env
VITE_API_URL=http://localhost:5000/api/v1
```

Start the Vite development server:
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `PORT` | Yes | HTTP server listen port | `5000` |
| `NODE_ENV` | Yes | Runtime environment | `development` or `production` |
| `MONGODB_URI` | Yes | MongoDB Atlas or local connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Yes | Secret key used to sign access tokens | 32+ character random string |
| `JWT_REFRESH_SECRET` | Yes | Secret key used to sign refresh tokens | 32+ character random string |
| `FRONTEND_URL` | Yes | Allowed origin for CORS (comma-separated for multiple) | `http://localhost:5173` |
| `STORAGE_PROVIDER` | No | Storage backend: `local`, `s3`, or `r2` | `local` |
| `UPLOAD_DIR` | No | Local filesystem path for file uploads | `./uploads` |
| `S3_BUCKET` | Cond. | Bucket name if using S3/R2 storage | `portal-materials` |
| `AWS_ACCESS_KEY_ID` | Cond. | Access key for S3/R2 | `...` |
| `AWS_SECRET_ACCESS_KEY` | Cond. | Secret key for S3/R2 | `...` |

### Frontend (`frontend/.env`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_API_URL` | Yes | Base URL for backend API v1 endpoints | `http://localhost:5000/api/v1` |

---

## Deployment Basics

### Backend (e.g. Render / Node Server)
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start` (or `node dist/server.js`)
- **Health Check Endpoint**: `/health` (returns `200 OK` with database status)
- **Environment Variables**: Configure `PORT`, `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`.
- **Network Access**: Add your deployment platform's outbound IP ranges to MongoDB Atlas Network Access.

### Frontend (e.g. Vercel)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Single Page App Routing**: Handled via `frontend/vercel.json` rewrites.
- **Environment Variables**: Set `VITE_API_URL` pointing to your deployed backend URL.

---

## Security & Data Safety

- All passwords are encrypted with `bcrypt` (10 rounds).
- All protected API routes validate JWT bearer tokens and enforce role-based access.
- Sensitive environment files (`.env`) and credentials are strictly ignored in `.gitignore`.
- Production database operations require explicitly authenticated and scoped tenant identifiers (`collegeId`, `departmentId`).
