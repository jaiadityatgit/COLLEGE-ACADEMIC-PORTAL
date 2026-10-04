# Production Infrastructure & Deployment Guide

This document is the authoritative deployment, operations, and infrastructure runbook for the **College Academic Portal — EE-VDT Department Operating System**.

---

## 1. System Architecture

```
                                  USERS
                                    │
                                    ▼
                         CLOUDFLARE DNS / CDN / SSL
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
          VERCEL FRONTEND                     RENDER / RAILWAY
        (React + Vite SPA)                    (Node.js + Express API)
                  │                                   │
                  │ (HTTPS API Calls)                 │
                  └───────────────────────────────────┼─────────────────┐
                                                      ▼                 ▼
                                               MONGODB ATLAS     CLOUDFLARE R2
                                            (Structured Data)    (Binary Files)
```

- **Frontend (Vercel)**: High-availability global CDN hosting optimized React 18 / TypeScript SPA.
- **Backend (Render / Railway / Container)**: Stateless Express.js TypeScript API server.
- **Database (MongoDB Atlas)**: Multi-tenant isolated database holding users, courses, grades, attendance, and metadata.
- **Object Storage (Cloudflare R2 / AWS S3)**: S3-compatible cloud object storage for lecture materials, assignments, and student submissions.

---

## 2. MongoDB Atlas Setup

### Status: `REQUIRES EXTERNAL CONFIGURATION`

1. **Network Access (IP Whitelist)**:
   - For Render / Railway dynamic outbound IPs, add `0.0.0.0/0` (Allow access from anywhere) in Atlas **Network Access** tab, secured with a strong database user password.
2. **Database User**:
   - Ensure the database user has `readWrite` access to the `academic_portal` database.
3. **Connection String Format**:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/academic_portal?retryWrites=true&w=majority
   ```
4. **Connection Pool**:
   - Mongoose default connection pool (`maxPoolSize: 100`) is configured.

---

## 3. Cloudflare R2 Cloud Object Storage Setup

### Status: `REQUIRES EXTERNAL CONFIGURATION`

1. **Create Bucket**:
   - In Cloudflare Dashboard -> **R2 Object Storage** -> Click **Create bucket** -> Name: `portal-academic-files`.
2. **Generate API Token**:
   - Navigate to **Manage R2 API Tokens** -> **Create API Token**.
   - Permissions: **Object Read & Write**.
   - Specify bucket `portal-academic-files`.
   - Copy `Access Key ID` and `Secret Access Key`.
3. **Account ID**:
   - Find your Account ID in the R2 Dashboard URL (`https://dash.cloudflare.com/<account-id>/r2`).
4. **Custom Domain (Optional)**:
   - Connect a custom domain (e.g., `files.yourcollege.edu`) or enable the `r2.dev` public development subdomain.

---

## 4. Backend Deployment (Render / Railway)

### Status: `ALREADY IMPLEMENTED IN CODE` / `REQUIRES EXTERNAL CONFIGURATION`

### Render Setup:
1. Create a new **Web Service** on Render connected to the repository.
2. **Root Directory**: `backend`
3. **Environment**: `Node`
4. **Build Command**: `npm ci && npm run build`
5. **Start Command**: `npm run start` (executes `node dist/server.js`)
6. **Health Check Path**: `/health`
7. **Environment Variables**: Add all variables from Section 6.

### Railway Setup:
1. Create a new project pointing to `/backend`.
2. Set **Root Directory** to `/backend`.
3. Custom start command: `npm run start`.
4. Configure variables in the Railway dashboard.

---

## 5. Frontend Deployment (Vercel)

### Status: `ALREADY IMPLEMENTED IN CODE` / `REQUIRES EXTERNAL CONFIGURATION`

1. Import repository in **Vercel**.
2. **Framework Preset**: `Vite`
3. **Root Directory**: `frontend`
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Install Command**: `npm install`
7. **Environment Variables**:
   - `VITE_API_URL`: `https://api.yourdomain.com/api/v1` (or your Render/Railway backend URL + `/api/v1`)
8. **SPA Routing**:
   - `frontend/vercel.json` rewrite rule automatically routes all client navigation to `/index.html`.

---

## 6. Environment Variables Reference

### Backend Production (`.env` in Render/Railway)

| Variable | Description | Example / Format |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment identifier | `production` |
| `PORT` | HTTP port | `5000` |
| `FRONTEND_URL` | Allowed origin(s) for CORS | `https://portal.yourdomain.com,https://your-frontend.vercel.app` |
| `MONGODB_URI` | MongoDB Atlas URI | `mongodb+srv://user:pass@cluster.mongodb.net/academic_portal` |
| `JWT_SECRET` | 32-byte secret for JWT access tokens | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET`| 32-byte secret for refresh tokens | `openssl rand -hex 32` |
| `STORAGE_PROVIDER` | Active storage provider | `r2` (or `s3` or `local`) |
| `R2_ACCOUNT_ID` | Cloudflare account identifier | `a1b2c3d4e5f6...` |
| `R2_ACCESS_KEY_ID` | R2 API Token Access Key | `abc...` |
| `R2_SECRET_ACCESS_KEY`| R2 API Token Secret | `xyz...` |
| `R2_BUCKET_NAME` | R2 bucket name | `portal-academic-files` |
| `R2_CUSTOM_DOMAIN` | Public/CDN domain for files | `https://files.yourdomain.com` |

### Frontend Production (`.env` in Vercel)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Full URL to backend API v1 | `https://academic-portal-backend.onrender.com/api/v1` |

---

## 7. CORS Configuration

### Status: `ALREADY IMPLEMENTED IN CODE`

- Configured via Express `cors` middleware with `credentials: true`.
- Dynamic origin verification checks `FRONTEND_URL` (supports comma-separated multiple domains).
- Local origins (`http://localhost:3000`, `http://localhost:5173`) allowed in non-production mode.
- Wildcards (`*`) are strictly avoided when `credentials: true` is active to maintain browser cookie security.

---

## 8. Domain & DNS Configuration (Cloudflare)

### Status: `REQUIRES EXTERNAL CONFIGURATION`

Configure DNS records in Cloudflare:
- `portal.yourdomain.com` -> `CNAME` -> `cname.vercel-dns.com` (Frontend)
- `api.yourdomain.com` -> `CNAME` -> `<your-service>.onrender.com` (Backend)
- `files.yourdomain.com` -> `CNAME` -> `<bucket>.<account-id>.r2.cloudflarestorage.com` (R2 Bucket)

Enable Cloudflare **SSL/TLS Mode: Full (Strict)**.

---

## 9. File Storage Behavior

### Status: `ALREADY IMPLEMENTED IN CODE`

1. **Development Mode (`STORAGE_PROVIDER=local`)**:
   - Files are stored on disk in `./uploads`.
   - Useful for offline development and local automated tests.
2. **Production Mode (`STORAGE_PROVIDER=r2` or `s3`)**:
   - Files are streamed directly to Cloudflare R2 / AWS S3 via `@aws-sdk/client-s3`.
   - Object keys are sanitized and prefixed (`materials/...`, `assignments/...`, `submissions/...`).
   - Ephemeral container disk is cleaned immediately after upload.
   - Authorized downloads are streamed via `/api/v1/sources/:id/download` and `/api/v1/assignments/submission-files/download` with strict role and enrollment checks.

---

## 10. Health Checks & Observability

### Status: `ALREADY IMPLEMENTED IN CODE`

The `/health` endpoint provides observability for container health probes and load balancers:

- **Endpoint**: `GET /health`
- **Response Format**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-08-21T11:20:00.000Z",
    "uptime": 1420.5,
    "services": {
      "process": "running",
      "database": "connected",
      "storageProvider": "r2"
    }
  }
  ```
- **HTTP Codes**: `200 OK` when healthy; `503 Service Unavailable` if MongoDB is disconnected.
- Zero credentials or connection strings are exposed in health responses.

---

## 11. Backup Strategy

### Status: `REQUIRES EXTERNAL CONFIGURATION`

1. **MongoDB Atlas Continuous Backups**:
   - Enable Atlas **Continuous Cloud Backups** (Point-in-time recovery for 7 to 35 days).
2. **Cloudflare R2 Versioning**:
   - Enable Object Versioning on the `portal-academic-files` bucket in Cloudflare R2 to protect against accidental file deletions.
3. **Audit Backups**:
   - Schedule weekly `mongodump` exports to secure cold storage for compliance.

---

## 12. Rollback Strategy

1. **Frontend**:
   - Vercel provides instant 1-click rollback to any previous deployment hash.
2. **Backend**:
   - Render / Railway support rolling back to any previous commit hash.
3. **Database Migration Safety**:
   - All Mongoose schema additions maintain backward compatibility with default and optional fields. No breaking column alterations are required.

---

## 13. Scaling Strategy

```
STAGE 1 (0 – 500 Active Users)
├─ Frontend: Vercel Free / Pro
├─ Backend: 1x Render / Railway Web Service (0.5 CPU, 1 GB RAM)
├─ Database: MongoDB Atlas M0 / M10 Dedicated
└─ Storage: Cloudflare R2 (Pay per storage, $0 egress)

STAGE 2 (500 – 5,000 Active Users)
├─ Frontend: Vercel Pro + Cloudflare CDN Caching for static assets
├─ Backend: 2–3x Stateless Backend Instances (Autoscaling)
├─ Database: MongoDB Atlas M20 / M30 with optimized compound indexes
└─ Storage: Cloudflare R2 with Custom Domain CDN

STAGE 3 (5,000 – 20,000+ Active Users) [FUTURE SCALE]
├─ Multi-region backend containers behind Cloudflare Load Balancer
├─ Redis caching for session tokens and high-frequency read endpoints
├─ MongoDB Atlas Read Replicas (Secondary read preferences for reports/analytics)
└─ Dedicated background worker for report generation
```

---

## 14. Production Security Checklist

- [x] **No Plaintext Passwords**: Password hashing via `bcryptjs` (salt rounds: 10).
- [x] **Strict RBAC**: Role guards enforce `student`, `faculty`, `hod`, and `admin` permissions on all routes.
- [x] **Student-to-Student Isolation**: Submissions can only be viewed by the submitting student or assigned faculty.
- [x] **Tenant / College Isolation**: All queries filter by `collegeId`.
- [x] **Filename Sanitization**: Uploaded filenames stripped of path traversal characters and special symbols.
- [x] **Stateless Sessions**: Authentication via JWT tokens with HTTPOnly refresh cookies.
- [x] **Helmet Security Headers**: Configured in Express middleware.
- [x] **Rate Limiting**: Configured on `/api` routes via `express-rate-limit`.

---

## 15. Critical Invariants: What NOT to Do with MongoDB Atlas

> [!CAUTION]
> **Strict Operational Prohibitions:**
> 1. **DO NOT run `npm run seed` or auto-seed scripts against the Atlas database.** Seed scripts are for empty development instances only.
> 2. **DO NOT execute `dropDatabase()`, `collection.drop()`, or bulk deletes.**
> 3. **DO NOT run destructive migration scripts.**
> 4. **DO NOT commit `.env` files with Atlas passwords or Cloudflare keys to GitHub.**
