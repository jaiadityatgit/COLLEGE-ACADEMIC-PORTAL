# Academic Portal — REST API Reference Manual

This document provides the authoritative specification of the REST API endpoints exposed by the Academic Portal Backend Server. All requests must be sent with `Content-Type: application/json` unless specified otherwise (e.g., multipart file uploads).

---

## 🔒 Authentication & Identity (`/api/v1/auth`)

### 1. User Registration
* **Endpoint**: `POST /api/v1/auth/register`
* **Description**: Register a new user with role-based parameters.

### 2. User Login
* **Endpoint**: `POST /api/v1/auth/login`
* **Description**: Authenticate using email and password. Generates an HTTP-only Refresh Token cookie and returns an Access Token.

### 3. Refresh Access Token
* **Endpoint**: `POST /api/v1/auth/refresh`
* **Description**: Request a new JWT Access Token utilizing the HTTP-only Refresh Cookie.

### 4. Logout User
* **Endpoint**: `POST /api/v1/auth/logout`
* **Description**: Clear the client's refresh token cookie.

---

## 📚 Courses & Academic Catalog (`/api/v1/courses`)

### 1. List Enrolled / Assigned Courses
* **Endpoint**: `GET /api/v1/courses`
* **Description**: Lists courses for the authenticated user based on role (student enrollment or faculty assignment).

### 2. Get Course Details
* **Endpoint**: `GET /api/v1/courses/:id`
* **Description**: Retrieves full course details, syllabus, and assigned faculty.

---

## 📥 Course Materials & Sources (`/api/v1/sources`)

### 1. Upload Course Material
* **Endpoint**: `POST /api/v1/sources/upload`
* **Headers**: `Content-Type: multipart/form-data`
* **Description**: Upload course materials (PDF, DOCX, PPT, PPTX). Stored via configured storage provider (Local, Cloudflare R2, or AWS S3).

### 2. List Course Materials
* **Endpoint**: `GET /api/v1/sources/course/:courseId`
* **Description**: Retrieves all uploaded materials for a given course.

### 3. Download Course Material
* **Endpoint**: `GET /api/v1/sources/:id/download`
* **Description**: Authenticated streaming download endpoint verifying tenant and course enrollment.

### 4. Delete Course Material
* **Endpoint**: `DELETE /api/v1/sources/:id`
* **Description**: Deletes a material record and removes the object from storage.

---

## 📝 Assignments & Submissions (`/api/v1/assignments`)

### 1. Create Assignment
* **Endpoint**: `POST /api/v1/assignments`
* **Roles**: Faculty, HOD, Admin

### 2. Upload Assignment Attachment
* **Endpoint**: `POST /api/v1/assignments/upload-attachment`
* **Headers**: `Content-Type: multipart/form-data`

### 3. Submit Assignment
* **Endpoint**: `POST /api/v1/assignments/:id/submit`
* **Roles**: Student

### 4. Upload Submission File
* **Endpoint**: `POST /api/v1/assignments/upload-submission-file`
* **Headers**: `Content-Type: multipart/form-data`

### 5. Grade Submission
* **Endpoint**: `PATCH /api/v1/assignments/submissions/:submissionId/grade`
* **Roles**: Faculty, HOD, Admin

### 6. Download Assignment Attachment / Submission File
* **Endpoint**: `GET /api/v1/assignments/attachments/download`
* **Endpoint**: `GET /api/v1/assignments/submission-files/download`
* **Description**: Authenticated and isolated download endpoints ensuring student submission privacy.

---

## 📊 Attendance Management (`/api/v1/attendance`)

### 1. Mark Attendance
* **Endpoint**: `POST /api/v1/attendance/mark`
* **Roles**: Faculty, HOD, Admin

### 2. Get Student Attendance Breakdown
* **Endpoint**: `GET /api/v1/attendance/student/:studentId`

### 3. Get Course Attendance Stats
* **Endpoint**: `GET /api/v1/attendance/course/:courseId`

---

## 🏆 Gradebook & Marks (`/api/v1/gradebook`)

### 1. Get Course Gradebook
* **Endpoint**: `GET /api/v1/gradebook/course/:courseId`

### 2. Record Assessment Score
* **Endpoint**: `POST /api/v1/gradebook/entry`

---

## 📅 Timetable & Schedule (`/api/v1/timetable`)

### 1. Get Department Timetable
* **Endpoint**: `GET /api/v1/timetable/department/:departmentId`

### 2. Get User Weekly Schedule
* **Endpoint**: `GET /api/v1/timetable/my-schedule`

---

## 📢 Announcements & Notifications (`/api/v1/announcements` & `/api/v1/notifications`)

### 1. List Announcements
* **Endpoint**: `GET /api/v1/announcements`

### 2. Create Announcement
* **Endpoint**: `POST /api/v1/announcements`
* **Roles**: Faculty, HOD, Admin

### 3. Get User Notifications
* **Endpoint**: `GET /api/v1/notifications`

---

## 🏛️ HOD Executive Analytics (`/api/v1/hod`)

### 1. Get Department Overview Analytics
* **Endpoint**: `GET /api/v1/hod/analytics`
* **Roles**: HOD, Admin

### 2. Get Faculty Workload & Course Performance
* **Endpoint**: `GET /api/v1/hod/faculty-performance`
