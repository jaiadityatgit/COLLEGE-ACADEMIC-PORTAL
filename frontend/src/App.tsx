import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import AppShell from "./components/layout/AppShell";

import Login from "./pages/Login";

import StudentDashboard from "./pages/student/StudentDashboard";
import SubjectsPage from "./pages/student/SubjectsPage";
import SubjectPage from "./pages/student/SubjectPage";
import TimetablePage from "./pages/student/TimetablePage";
import AttendancePage from "./pages/student/AttendancePage";
import GradesPage from "./pages/student/GradesPage";
import ExamsPage from "./pages/student/ExamsPage";
import AnnouncementsPage from "./pages/student/AnnouncementsPage";
import CalendarPage from "./pages/student/CalendarPage";
import AssignmentsListPage from "./pages/student/AssignmentsListPage";

import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import FacultySubjectsPage from "./pages/faculty/FacultySubjectsPage";
import FacultySubjectPage from "./pages/faculty/FacultySubjectPage";
import FacultyStudentsPage from "./pages/faculty/FacultyStudentsPage";
import FacultyAttendancePage from "./pages/faculty/FacultyAttendancePage";

import HODDashboard from "./pages/hod/HODDashboard";
import HODFacultyPage from "./pages/hod/HODFacultyPage";
import HODStudentAnalyticsPage from "./pages/hod/HODStudentAnalyticsPage";
import HODCourseAnalyticsPage from "./pages/hod/HODCourseAnalyticsPage";
import HODLabsPage from "./pages/hod/HODLabsPage";
import HODApprovalsPage from "./pages/hod/HODApprovalsPage";
import HODReportsPage from "./pages/hod/HODReportsPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import SettingsPage from "./pages/home/SettingsPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RoleRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: string[];
}) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !roles.includes(user.role)) return <SmartRedirect />;
  return <>{children}</>;
}

function ShellRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

function StudentRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleRoute roles={["student", "college_admin", "super_admin"]}>
      <AppShell>{children}</AppShell>
    </RoleRoute>
  );
}

function FacultyRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleRoute roles={["faculty", "hod", "college_admin", "super_admin"]}>
      <AppShell>{children}</AppShell>
    </RoleRoute>
  );
}

function HODRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleRoute roles={["hod", "department_admin", "college_admin", "super_admin"]}>
      <AppShell>{children}</AppShell>
    </RoleRoute>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <RoleRoute roles={["college_admin", "super_admin"]}>
      <AppShell>{children}</AppShell>
    </RoleRoute>
  );
}

function SmartRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  switch (user?.role) {
    case "student":
      return <Navigate to="/dashboard" replace />;
    case "faculty":
      return <Navigate to="/faculty/dashboard" replace />;
    case "hod":
    case "department_admin":
      return <Navigate to="/hod/dashboard" replace />;
    case "college_admin":
    case "super_admin":
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<SmartRedirect />} />
        <Route path="/home" element={<SmartRedirect />} />

        {/* Student Routes */}
        <Route path="/dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
        <Route path="/subjects" element={<StudentRoute><SubjectsPage /></StudentRoute>} />
        <Route path="/subjects/:subjectId" element={<StudentRoute><SubjectPage /></StudentRoute>} />
        <Route path="/subjects/:subjectId/:tab" element={<StudentRoute><SubjectPage /></StudentRoute>} />
        <Route path="/timetable" element={<ShellRoute><TimetablePage /></ShellRoute>} />
        <Route path="/attendance" element={<StudentRoute><AttendancePage /></StudentRoute>} />
        <Route path="/assignments" element={<StudentRoute><AssignmentsListPage /></StudentRoute>} />
        <Route path="/grades" element={<StudentRoute><GradesPage /></StudentRoute>} />
        <Route path="/exams" element={<StudentRoute><ExamsPage /></StudentRoute>} />
        <Route path="/announcements" element={<ShellRoute><AnnouncementsPage /></ShellRoute>} />
        <Route path="/calendar" element={<StudentRoute><CalendarPage /></StudentRoute>} />

        {/* Faculty Routes */}
        <Route path="/faculty/dashboard" element={<FacultyRoute><FacultyDashboard /></FacultyRoute>} />
        <Route path="/faculty/subjects" element={<FacultyRoute><FacultySubjectsPage /></FacultyRoute>} />
        <Route path="/faculty/subjects/:subjectId" element={<FacultyRoute><FacultySubjectPage /></FacultyRoute>} />
        <Route path="/faculty/subjects/:subjectId/:tab" element={<FacultyRoute><FacultySubjectPage /></FacultyRoute>} />
        <Route path="/faculty/students" element={<FacultyRoute><FacultyStudentsPage /></FacultyRoute>} />
        <Route path="/faculty/students/:studentId" element={<FacultyRoute><FacultyStudentsPage /></FacultyRoute>} />
        <Route path="/faculty/attendance" element={<FacultyRoute><FacultyAttendancePage /></FacultyRoute>} />
        <Route path="/faculty/marks" element={<Navigate to="/faculty/subjects" replace />} />
        <Route path="/faculty/assignments" element={<Navigate to="/faculty/subjects" replace />} />
        <Route path="/faculty/analytics" element={<Navigate to="/faculty/dashboard" replace />} />

        {/* HOD Routes */}
        <Route path="/hod/dashboard" element={<HODRoute><HODDashboard /></HODRoute>} />
        <Route path="/hod/faculty" element={<HODRoute><HODFacultyPage /></HODRoute>} />
        <Route path="/hod/students" element={<HODRoute><HODStudentAnalyticsPage /></HODRoute>} />
        <Route path="/hod/courses" element={<HODRoute><HODCourseAnalyticsPage /></HODRoute>} />
        <Route path="/hod/labs" element={<HODRoute><HODLabsPage /></HODRoute>} />
        <Route path="/hod/approvals" element={<HODRoute><HODApprovalsPage /></HODRoute>} />
        <Route path="/hod/reports" element={<HODRoute><HODReportsPage /></HODRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/departments" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/:tab" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        {/* Shared settings & redirect */}
        <Route path="/settings" element={<ShellRoute><SettingsPage /></ShellRoute>} />
        <Route path="/register" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<SmartRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
