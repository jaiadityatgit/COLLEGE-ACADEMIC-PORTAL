# Academic Portal — Page Specification & Layout Guide

**Version:** 2.0.0 (Pure Academic ERP / EE-VDT Department Operating System)  
**Status:** Institutional Specification  

---

## 1. Authentication (`/login`)

- **Layout**: Centered card overlay on subtle slate gradient background (`#f8fafc`).
- **Header**: Official EE-VDT Department Operating System brand badge, institutional title, and semester subtitle.
- **Form Controls**: Standardized inputs for Email Address (`login-email`) and Password (`login-password`) with clear label hierarchy and focus ring.
- **Submit Trigger**: Full-width primary button (`#4f46e5`) displaying a loading spinner during API verification.
- **Footer Notice**: Academic instruction directing users to contact the department office for credentials.

---

## 2. Student Dashboard (`/dashboard`)

- **Goal**: Answer *"What do I need to do today?"* in under 5 seconds.
- **Layout Hierarchy**:
  1. **Welcome Banner**: Personal greeting ("Good Morning, [Name] 👋"), active semester (Semester V - EE-VDT), overall attendance percentage badge (`88%`), and 4 quick action pills.
  2. **Top Priority Section (2-Column Grid)**:
     - **Left (2 Cols)**: Today's Class Schedule (time slots, room number, faculty name, course badge).
     - **Right (1 Col)**: Attendance Summary Ring (Overall % circular indicator + per-subject mini status bars).
  3. **Secondary Action Section (2-Column Grid)**:
     - **Left**: Upcoming Assignments (title, course, due date, countdown tag e.g. "Due in 2 days").
     - **Right**: Upcoming Exams (exam title, course, date, max marks).
  4. **Bottom Grid**:
     - Enrolled Subjects Card Grid (8 subject cards with course code, credit tag, faculty name, attendance %, pending task count).
     - Recent Department Announcements & System Notifications.

---

## 3. Student Subjects List (`/subjects`)

- **Layout**: Top header with search bar filter ("Search subjects..."), split into two distinct visual sections:
  1. **Theory Subjects Grid**: 3-column card grid (Indigo accent stripe).
  2. **Laboratory Subjects Grid**: 3-column card grid (Emerald accent stripe).
- **Card Contents**: Course Code badge, Credit tag, Subject Name, Assigned Faculty, Attendance %, Pending Assignments count, Upcoming Exam tag.
- **Legacy Cleanup**: Removal of legacy `AI 🤖` badge sit-in pills.

---

## 4. Student Subject Workspace (`/subjects/:subjectId/:tab`)

- **Central Academic Hub**:
  - **Header Banner**: Subject Name, Course Code, Credits, Course Type tag, Assigned Faculty names, and back navigation link.
  - **Tab Navigation Bar**:
    - `Overview` (Subject description, syllabus units, faculty contact, quick actions)
    - `Course Materials` (Lecture notes, PPTs, lab manuals, reference books, previous papers)
    - `Assignments` (Posted problem sets, submission file attachment uploader, submission status, gradebook score & faculty feedback)
    - `Attendance` (Class attendance history table & session stats)
    - `Announcements` (Course-specific notices)
- **Zero AI Features**: No AI chat, no flashcards card, no mind map, no audio overview, no studio.

---

## 5. Course Materials Repository

- **Layout**: Official Academic Repository Banner with category filter pills (`All`, `Lecture Notes`, `PPTs`, `Lab Manuals`, `Previous Papers`, `Reference Books`, `Other`).
- **Document Table**:
  - Columns: Document Title, Category badge, File Format (`PDF`, `PPTX`, `DOCX`) & Size, Upload Date, Ready Status tag, Actions (`Open / View`, `Download`).
- **File Visuals**: Color-coded file badges (Red for PDF, Amber for PPTX, Blue for DOCX).

---

## 6. Student Assignments (`/assignments` & Subject Tab)

- **Hierarchy**:
  - **Problem Set Card**: Title, description, instructions box, due date, maximum marks, attached problem-set files (`Open / View`, `Download`).
  - **Status Tag**: `Pending Submission` (Amber), `Submitted` (Indigo), `Graded` (Emerald), `Past Due` (Red).
  - **Submission Drawer/Modal**: Textarea for student notes/explanation, solution file uploader (`.pdf`, `.docx`, `.zip`), upload progress indicator, submission confirmation button.
  - **Graded Result Card**: Official grade score (e.g., `23 / 25 Marks`), gradebook sync tag, faculty feedback string.

---

## 7. Faculty Dashboard (`/faculty/dashboard`)

- **Goal**: Support daily teaching workflow and course administration.
- **Layout Hierarchy**:
  1. **Header Banner**: Faculty greeting, designation, primary actions (`+ Post Announcement`, `+ Add Timetable Slot`, `📊 Department Reports`).
  2. **KPI Stats Bar**: Assigned Subjects, Enrolled Students, Active Assignments, Today's Classes.
  3. **Main Workspace (2-Column Grid)**:
     - **Left (2 Cols)**: Today's Teaching Schedule with `Mark Attendance` direct trigger button and slot management. Assigned Subjects grid with shortcut to subject workspaces.
     - **Right (1 Col)**: Active Assignments list with `Grade Submissions` shortcut. Department announcements feed.

---

## 8. Faculty Subject Workspace (`/faculty/subjects/:subjectId`)

- **Faculty Controls**:
  - **Course Materials Tab**: Category selector, drag-and-drop uploader (`.pdf`, `.pptx`, `.docx`), material list with delete/download controls.
  - **Assignments Tab**: Create Assignment form (title, instructions, due date, total marks, problem set file attachment), submission roster with grading modal (marks input, feedback text, `Grade Submission` button).
  - **Attendance Tab**: Session date picker, session type selector (`lecture` / `lab`), student roster attendance checklist with bulk `Mark All Present` toggle and save trigger.

---

## 9. HOD Dashboard (`/hod/dashboard`)

- **Executive Department Portal**:
  1. **Header**: Department Name (EE-VDT), active semester, academic year, department code badge.
  2. **KPI Metrics Grid**: 7 key metrics (Students, Faculty, Courses, Labs, Department Attendance %, Pass Rate %, Announcements).
  3. **7-Day Attendance Trend Chart**: Restrained clean bar visualization showing daily department attendance percentages.
  4. **Quick Navigation Grid**: Shortcuts to Faculty Directory, Student Analytics, Course Analytics, Lab Management, Approval Center, Report Center.
  5. **Active Courses & Announcements**: Overview tables of active department courses and pending approval announcements.

---

## 10. HOD Analytics & Reports (`/hod/*`)

- **Faculty Directory (`/hod/faculty`)**: Faculty profiles, designation, teaching hours, assigned courses, attendance sessions marked, pending grading tasks.
- **Student Analytics (`/hod/students`)**: Student roster, attendance distribution buckets (`>=90%`, `75-89%`, `60-74%`, `<60%`), at-risk student alert list (<75% attendance), top academic performers, weak subjects list.
- **Course Analytics (`/hod/courses`)**: Course enrollment, average attendance %, assignment completion rate %, grade distribution (A/B/C/D/F).
- **Report Center (`/hod/reports`)**: Structured tabbed report generator for Attendance Reports, Exam Results, Faculty Workload, Student Performance, and Assignment Statistics.

---

## 11. Admin Console (`/admin/*`)

- **Structured Console Navigation**: Clean top sub-nav switching between:
  1. **Users Management**: User search, role filter, user list table, `+ Add User` modal.
  2. **Departments**: Department list, course assignment, department creation modal.
  3. **Courses & Enrollment**: Course roster, student enrollment selector, faculty assignment selector.
  4. **Assignments**: System-wide assignment overview table.
  5. **Announcements**: College-wide announcement management.
  6. **Attendance**: College attendance summary table.
  7. **Schedules & Exams**: Master timetable overview and exam schedules.
  8. **Calendar**: College academic calendar event manager.

---

## 12. Component Reuse & Refactoring Matrix

### Reusable UI Primitives (To be created in `src/components/ui/`):
- `Button.tsx`: Replaces all ad-hoc button elements with standardized variants (`primary`, `secondary`, `ghost`, `danger`).
- `Card.tsx`: Replaces custom card divs with uniform border, shadow, and padding tokens.
- `Badge.tsx`: Replaces inline badge spans with standardized status styles.
- `DataTable.tsx`: Replaces raw `<table>` elements with clean hover states and mobile responsive view.
- `EmptyState.tsx`: Replaces raw text empty state strings with iconography and action buttons.
- `LoadingSpinner.tsx`: Replaces ad-hoc inline spinner spans.

### Files Targeted for UI Specification Alignment in Subsequent Phases:
- `frontend/src/index.css` & `frontend/tailwind.config.js` (Phase 1)
- `frontend/src/components/layout/AppShell.tsx` (Phase 1)
- `frontend/src/pages/Login.tsx` (Phase 1)
- `frontend/src/pages/student/*` (Phase 2)
- `frontend/src/pages/faculty/*` (Phase 3)
- `frontend/src/pages/hod/*` (Phase 4)
- `frontend/src/pages/admin/*` (Phase 5)
