import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { courseService } from "../../services/course";
import { departmentService } from "../../services/department";
import { assignmentService } from "../../services/assignment";
import { announcementService } from "../../services/announcement";
import { attendanceService } from "../../services/attendance";
import { getTimetable } from "../../services/timetable";
import { getExams } from "../../services/exam";
import { getCalendarEvents, createCalendarEvent } from "../../services/calendar";
import { AcademicStructureTab } from "../../components/admin/AcademicStructureTab";
import { StudentOnboardingTab } from "../../components/admin/StudentOnboardingTab";
import { FacultyManagementTab } from "../../components/admin/FacultyManagementTab";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { SectionCard } from "../../components/ui/SectionCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Modal } from "../../components/ui/Modal";

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<string>("structure");

  useEffect(() => {
    const validTabs = [
      "structure",
      "students",
      "faculty",
      "users",
      "courses",
      "departments",
      "assignments",
      "announcements",
      "attendance",
      "schedules",
      "calendar",
    ];
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    } else if (location.pathname.includes("/admin/structure")) {
      setActiveTab("structure");
    } else if (location.pathname.includes("/admin/students")) {
      setActiveTab("students");
    } else if (location.pathname.includes("/admin/faculty")) {
      setActiveTab("faculty");
    } else if (location.pathname.includes("/admin/users")) {
      setActiveTab("users");
    } else if (location.pathname.includes("/admin/departments")) {
      setActiveTab("departments");
    } else if (location.pathname.includes("/admin/courses")) {
      setActiveTab("courses");
    } else if (location.pathname.includes("/admin/assignments")) {
      setActiveTab("assignments");
    } else if (location.pathname.includes("/admin/announcements")) {
      setActiveTab("announcements");
    } else if (location.pathname.includes("/admin/attendance")) {
      setActiveTab("attendance");
    } else if (location.pathname.includes("/admin/schedules")) {
      setActiveTab("schedules");
    } else if (location.pathname.includes("/admin/calendar")) {
      setActiveTab("calendar");
    } else {
      setActiveTab("structure");
    }
  }, [location.pathname, tab]);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("student");

  // Courses State
  const [courses, setCourses] = useState<any[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [courseFaculty, setCourseFaculty] = useState<any[]>([]);
  const [enrollStudentId, setEnrollStudentId] = useState("");
  const [assignFacultyId, setAssignFacultyId] = useState("");

  // Departments State
  const [departments, setDepartments] = useState<any[]>([]);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true);
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);
  const [newDepCode, setNewDepCode] = useState("");
  const [newDepName, setNewDepName] = useState("");
  const [newDepDesc, setNewDepDesc] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [departmentCourses, setDepartmentCourses] = useState<any[]>([]);
  const [assignCourseId, setAssignCourseId] = useState("");

  // Assignments State
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(true);

  // Announcements State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(true);
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState<{
    title: string;
    body: string;
    audience: "college" | "department" | "batch" | "section" | "course";
    category: "holiday" | "exam" | "deadline" | "schedule" | "instruction" | "general";
    priority: "low" | "normal" | "urgent";
    departmentId?: string;
    batchId?: string;
    section?: string;
    courseId?: string;
  }>({
    title: "",
    body: "",
    audience: "college",
    category: "general",
    priority: "normal",
    departmentId: "",
    batchId: "",
    section: "",
    courseId: "",
  });

  // Attendance State
  const [attendanceSummary, setAttendanceSummary] = useState<any[]>([]);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(true);

  // Schedules State (Timetable & Exams)
  const [timetable, setTimetable] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [isSchedulesLoading, setIsSchedulesLoading] = useState(true);

  // Calendar State
  const [events, setEvents] = useState<any[]>([]);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", description: "", date: "", type: "academic" });

  useEffect(() => {
    fetchUsers();
    fetchCourses();
    fetchDepartments();
    fetchAssignments();
    fetchAnnouncements();
    fetchAttendanceSummary();
    fetchSchedules();
    fetchEvents();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data.data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await courseService.getCourses();
      setCourses(res.data.data);
    } catch (err) {
      console.error("Failed to load courses", err);
    } finally {
      setIsCoursesLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentService.getDepartments();
      setDepartments(res.data.data);
    } catch (err) {
      console.error("Failed to load departments", err);
    } finally {
      setIsDepartmentsLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await assignmentService.getAssignments();
      setAssignments(res.data.data);
    } catch (err) {
      console.error("Failed to load assignments", err);
    } finally {
      setIsAssignmentsLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await announcementService.getAnnouncements();
      setAnnouncements(res.data.data);
    } catch (err) {
      console.error("Failed to load announcements", err);
    } finally {
      setIsAnnouncementsLoading(false);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const res = await attendanceService.getAttendanceSummary();
      setAttendanceSummary(res.data.data);
    } catch (err) {
      console.error("Failed to load attendance", err);
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const [timeRes, examRes] = await Promise.all([getTimetable(), getExams()]);
      setTimetable(timeRes.data || []);
      setExams(examRes.data || []);
    } catch (err) {
      console.error("Failed to load schedules", err);
    } finally {
      setIsSchedulesLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await getCalendarEvents();
      setEvents(res.data || []);
    } catch (err) {
      console.error("Failed to load events", err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;
    try {
      await createCalendarEvent(newEvent);
      setIsCreatingEvent(false);
      setNewEvent({ title: "", description: "", date: "", type: "academic" });
      fetchEvents();
    } catch (err) {
      alert("Failed to create event");
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.body.trim()) return;
    try {
      await announcementService.createAnnouncement({
        title: newAnnouncement.title.trim(),
        body: newAnnouncement.body.trim(),
        audience: newAnnouncement.audience,
        category: newAnnouncement.category,
        priority: newAnnouncement.priority,
        departmentId: newAnnouncement.departmentId || undefined,
        batchId: newAnnouncement.batchId || undefined,
        section: newAnnouncement.section?.trim() || undefined,
        courseId: newAnnouncement.courseId || undefined,
        type: "general",
      });
      setIsCreatingAnnouncement(false);
      setNewAnnouncement({
        title: "",
        body: "",
        audience: "college",
        category: "general",
        priority: "normal",
        departmentId: "",
        batchId: "",
        section: "",
        courseId: "",
      });
      fetchAnnouncements();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to create announcement");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;

    try {
      const res = await api.post("/users", {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setUsers([res.data.data, ...users]);
      setIsCreatingUser(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("student");
    } catch (err: any) {
      console.error("Failed to create user", err);
      alert(err.response?.data?.error || "Failed to create user");
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepCode.trim() || !newDepName.trim()) return;

    try {
      const res = await departmentService.createDepartment({
        departmentCode: newDepCode,
        departmentName: newDepName,
        description: newDepDesc,
      });
      setDepartments([...departments, res.data.data]);
      setIsCreatingDepartment(false);
      setNewDepCode("");
      setNewDepName("");
      setNewDepDesc("");
    } catch (err: any) {
      console.error("Failed to create department", err);
      alert(err.response?.data?.error || "Failed to create department");
    }
  };

  const loadCourseDetails = async (course: any) => {
    setSelectedCourse(course);
    try {
      const [sRes, fRes] = await Promise.all([
        courseService.getCourseStudents(course._id),
        courseService.getCourseFaculty(course._id),
      ]);
      setCourseStudents(sRes.data.data);
      setCourseFaculty(fRes.data.data);
    } catch (err) {
      console.error("Failed to load course details", err);
    }
  };

  const loadDepartmentDetails = async (department: any) => {
    setSelectedDepartment(department);
    try {
      const res = await departmentService.getDepartmentCourses(department._id);
      setDepartmentCourses(res.data.data);
    } catch (err) {
      console.error("Failed to load department courses", err);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollStudentId || !selectedCourse) return;
    try {
      await courseService.enrollStudent(selectedCourse._id, enrollStudentId);
      setEnrollStudentId("");
      loadCourseDetails(selectedCourse);
      fetchCourses();
    } catch (err) {
      console.error("Failed to enroll", err);
      alert("Failed to enroll student.");
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedCourse) return;
    try {
      await courseService.removeStudent(selectedCourse._id, studentId);
      loadCourseDetails(selectedCourse);
      fetchCourses();
    } catch (err) {
      console.error("Failed to remove student", err);
      alert("Failed to remove student.");
    }
  };

  const handleAssignFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignFacultyId || !selectedCourse) return;
    try {
      const newFacultyList = [...courseFaculty.map((f) => f._id), assignFacultyId];
      await courseService.assignFaculty(selectedCourse._id, newFacultyList);
      setAssignFacultyId("");
      loadCourseDetails(selectedCourse);
      fetchCourses();
    } catch (err) {
      console.error("Failed to assign faculty", err);
      alert("Failed to assign faculty.");
    }
  };

  const handleRemoveFaculty = async (facultyId: string) => {
    if (!selectedCourse) return;
    try {
      const newFacultyList = courseFaculty.map((f) => f._id).filter((id) => id !== facultyId);
      await courseService.assignFaculty(selectedCourse._id, newFacultyList);
      loadCourseDetails(selectedCourse);
      fetchCourses();
    } catch (err) {
      console.error("Failed to remove faculty", err);
      alert("Failed to remove faculty.");
    }
  };

  const handleAssignCourseToDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignCourseId || !selectedDepartment) return;
    try {
      await departmentService.assignCourseToDepartment(selectedDepartment._id, assignCourseId);
      setAssignCourseId("");
      loadDepartmentDetails(selectedDepartment);
      fetchDepartments();
      fetchCourses();
    } catch (err) {
      console.error("Failed to assign course", err);
      alert("Failed to assign course.");
    }
  };

  const handleArchiveDepartment = async (departmentId: string) => {
    try {
      await departmentService.archiveDepartment(departmentId);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (err) {
      console.error("Failed to archive department", err);
      alert("Failed to archive department.");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const adminTabs: { key: string; label: string; count?: number }[] = [
    { key: "structure", label: "Academic Structure" },
    { key: "students", label: "Students & Onboarding" },
    { key: "faculty", label: "Faculty & Teaching" },
    { key: "announcements", label: "Announcements", count: announcements.length },
    { key: "departments", label: "Departments", count: departments.length },
    { key: "courses", label: "Course Enrollment", count: courses.length },
    { key: "users", label: "All Users", count: users.length },
    { key: "assignments", label: "Assignments", count: assignments.length },
    { key: "attendance", label: "Attendance" },
    { key: "schedules", label: "Schedules & Exams", count: timetable.length + exams.length },
    { key: "calendar", label: "Calendar", count: events.length },
  ];

  return (
    <div className="h-full overflow-auto bg-slate-50/60 dark:bg-[#0b0f19]">
      <div className="max-w-[1360px] mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8 animate-fade-in">
        {/* Page Header */}
        <PageHeader
          title="Institutional Governance Console"
          subtitle="Department of Electronics and Communication Engineering · Central Institutional Administration"
          breadcrumbs={[
            { label: "Administration", href: "/admin" },
            { label: "Central Console" },
          ]}
          badges={[
            { label: "AY 2026–2027", variant: "neutral" },
            { label: "Super Admin", variant: "info" },
            { label: "Strict RBAC Enforced", variant: "success" },
          ]}
          actions={
            <div className="flex items-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCreatingAnnouncement(true)}
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                }
              >
                Publish Notice
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreatingUser(true)}
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                }
              >
                Add User
              </Button>
            </div>
          }
        />

        {/* 5-Card High-Density Institutional Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Users"
            value={users.length}
            subtitle="Students, faculty & staff"
            badge={{ label: "System", variant: "neutral" }}
            onClick={() => {
              setActiveTab("users");
              navigate("/admin/users");
            }}
            icon={
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />

          <StatCard
            label="Departments"
            value={departments.length}
            subtitle="Academic branches"
            badge={{ label: "Programmes", variant: "info" }}
            onClick={() => {
              setActiveTab("departments");
              navigate("/admin/departments");
            }}
            icon={
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          <StatCard
            label="Active Courses"
            value={courses.length}
            subtitle="Curriculum subjects"
            badge={{ label: "Approved", variant: "success" }}
            onClick={() => {
              setActiveTab("courses");
              navigate("/admin/courses");
            }}
            icon={
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />

          <StatCard
            label="Timetable Slots"
            value={timetable.length}
            subtitle="Instructional periods"
            badge={{ label: "Active", variant: "neutral" }}
            onClick={() => {
              setActiveTab("schedules");
              navigate("/admin/schedules");
            }}
            icon={
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />

          <StatCard
            label="Circulars"
            value={announcements.length}
            subtitle="Official notices"
            badge={{ label: "Published", variant: "info" }}
            onClick={() => {
              setActiveTab("announcements");
              navigate("/admin/announcements");
            }}
            icon={
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
          />
        </div>

        {/* Modern SaaS Segmented Navigation Track */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-white/[0.06] shadow-xs overflow-x-auto scrollbar-hide">
          {adminTabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setActiveTab(t.key);
                  setSelectedCourse(null);
                  setSelectedDepartment(null);
                  navigate(`/admin/${t.key}`);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.04]"
                }`}
              >
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-3xs font-bold ${
                      isActive
                        ? "bg-white/20 text-white dark:bg-black/20 dark:text-slate-900"
                        : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Contents View */}
        <div className="w-full pb-12">
          {activeTab === "structure" && (
            <div className="w-full">
              <AcademicStructureTab />
            </div>
          )}

          {activeTab === "students" && (
            <div className="w-full">
              <StudentOnboardingTab />
            </div>
          )}

          {activeTab === "faculty" && (
            <div className="w-full">
              <FacultyManagementTab />
            </div>
          )}

          {activeTab === "users" && (
            <SectionCard
              title="Institution User Directory"
              subtitle="All registered academic accounts with respective RBAC permissions"
              action={
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-64 px-3.5 py-1.5 text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setIsCreatingUser(true)}>
                    + Add User
                  </Button>
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-white/[0.02] text-slate-400 font-semibold uppercase tracking-wider text-2xs border-b border-slate-100 dark:border-white/[0.04]">
                    <tr>
                      <th className="px-5 py-3.5">Name</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">System Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-2xs">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.name}</span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 font-mono text-2xs">{user.email}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge
                            status={
                              user.role === "college_admin"
                                ? "urgent"
                                : user.role === "hod"
                                ? "active"
                                : user.role === "faculty"
                                ? "info"
                                : "neutral"
                            }
                            label={user.role.replace("_", " ").toUpperCase()}
                          />
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-5 py-10 text-center text-slate-400">
                          No users matched your query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {activeTab === "departments" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Departments List */}
              <div className="rounded-2xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-white/[0.06] shadow-xs overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Academic Departments
                    </h3>
                    <p className="text-3xs text-slate-400">Registered programmes</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setIsCreatingDepartment(true)}>
                    + Add
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[550px] divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {departments.map((dep) => (
                    <button
                      key={dep._id}
                      onClick={() => loadDepartmentDetails(dep)}
                      className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer ${
                        selectedDepartment?._id === dep._id
                          ? "bg-slate-50 dark:bg-white/[0.04] border-l-4 border-l-slate-900 dark:border-l-white"
                          : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{dep.departmentName}</h4>
                      <p className="text-2xs text-slate-400 font-mono mt-0.5">
                        {dep.departmentCode} · {dep.courseCount || 0} Courses
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Department Details */}
              <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-white/[0.06] shadow-xs overflow-hidden flex flex-col min-h-[480px]">
                {selectedDepartment ? (
                  <div className="flex flex-col h-full">
                    <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-2xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200">
                            {selectedDepartment.departmentCode}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {selectedDepartment.departmentName}
                          </h3>
                        </div>
                        {selectedDepartment.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {selectedDepartment.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleArchiveDepartment(selectedDepartment._id)}
                        className="px-2.5 py-1 text-2xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Archive
                      </button>
                    </div>

                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                          Assign Course to Department
                        </h4>
                        <form onSubmit={handleAssignCourseToDepartment} className="flex gap-2">
                          <select
                            value={assignCourseId}
                            onChange={(e) => setAssignCourseId(e.target.value)}
                            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                          >
                            <option value="">Select a course to assign...</option>
                            {courses
                              .filter((c) => c.departmentId !== selectedDepartment._id)
                              .map((c) => (
                                <option key={c._id} value={c._id}>
                                  {c.courseCode || c.code} — {c.name || c.courseName}
                                </option>
                              ))}
                          </select>
                          <Button variant="primary" size="sm" type="submit" disabled={!assignCourseId}>
                            Assign
                          </Button>
                        </form>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                          Department Courses ({departmentCourses.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {departmentCourses.map((c) => (
                            <div
                              key={c._id}
                              className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] flex items-center justify-between"
                            >
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {c.name || c.courseName}
                              </span>
                              <span className="text-2xs font-mono text-slate-400">{c.courseCode || c.code}</span>
                            </div>
                          ))}
                          {departmentCourses.length === 0 && (
                            <p className="text-xs text-slate-400 py-4 col-span-2 text-center">
                              No courses assigned to this department yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-medium p-8">
                    Select a department on the left to inspect or assign courses.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "courses" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Courses List */}
              <div className="rounded-2xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-white/[0.06] shadow-xs overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Courses Catalog
                  </h3>
                  <p className="text-3xs text-slate-400">Select course to manage rosters</p>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[550px] divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {courses.map((course) => (
                    <button
                      key={course._id}
                      onClick={() => loadCourseDetails(course)}
                      className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer ${
                        selectedCourse?._id === course._id
                          ? "bg-slate-50 dark:bg-white/[0.04] border-l-4 border-l-slate-900 dark:border-l-white"
                          : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {course.name || course.courseName}
                      </h4>
                      <p className="text-2xs text-slate-400 font-mono mt-0.5">
                        {course.courseCode} · {course.studentCount || 0} Students · {course.facultyCount || 0} Faculty
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Course Enrollment & Faculty Assignment */}
              <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-white/[0.06] shadow-xs overflow-hidden flex flex-col min-h-[480px]">
                {selectedCourse ? (
                  <div className="flex flex-col h-full">
                    <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-2xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200">
                            {selectedCourse.courseCode}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {selectedCourse.name || selectedCourse.courseName}
                          </h3>
                        </div>
                        <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {selectedCourse.credits} Credits · {selectedCourse.semester || "Odd"} Semester
                        </p>
                      </div>
                    </div>

                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                      {/* Faculty Assignment */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                          Assigned Faculty
                        </h4>
                        <form onSubmit={handleAssignFaculty} className="flex gap-2 mb-3">
                          <select
                            value={assignFacultyId}
                            onChange={(e) => setAssignFacultyId(e.target.value)}
                            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                          >
                            <option value="">Select a faculty member to assign...</option>
                            {users
                              .filter((u) => u.role === "faculty" && !courseFaculty.some((f) => f._id === u._id))
                              .map((u) => (
                                <option key={u._id} value={u._id}>
                                  {u.name} ({u.email})
                                </option>
                              ))}
                          </select>
                          <Button variant="primary" size="sm" type="submit" disabled={!assignFacultyId}>
                            Assign
                          </Button>
                        </form>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {courseFaculty.map((f) => (
                            <div
                              key={f._id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]"
                            >
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{f.name}</span>
                              <button
                                onClick={() => handleRemoveFaculty(f._id)}
                                className="text-3xs text-rose-600 font-bold hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Student Enrollment */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                          Enrolled Students ({courseStudents.length})
                        </h4>
                        <form onSubmit={handleEnrollStudent} className="flex gap-2 mb-3">
                          <select
                            value={enrollStudentId}
                            onChange={(e) => setEnrollStudentId(e.target.value)}
                            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                          >
                            <option value="">Select a student to enroll...</option>
                            {users
                              .filter((u) => u.role === "student" && !courseStudents.some((s) => s._id === u._id))
                              .map((u) => (
                                <option key={u._id} value={u._id}>
                                  {u.name} ({u.email})
                                </option>
                              ))}
                          </select>
                          <Button variant="primary" size="sm" type="submit" disabled={!enrollStudentId}>
                            Enroll
                          </Button>
                        </form>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                          {courseStudents.map((s) => (
                            <div
                              key={s._id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]"
                            >
                              <div>
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{s.name}</p>
                                <p className="text-3xs text-slate-400 font-mono">{s.email}</p>
                              </div>
                              <button
                                onClick={() => handleRemoveStudent(s._id)}
                                className="text-3xs text-rose-600 font-bold hover:underline cursor-pointer"
                              >
                                Unenroll
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-medium p-8">
                    Select a course on the left to manage faculty assignments and student enrollments.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "assignments" && (
            <SectionCard
              title="Continuous Assessment Assignments"
              subtitle="All course coursework and assignments registered across the institution"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-white/[0.02] text-slate-400 font-semibold uppercase tracking-wider text-2xs border-b border-slate-100 dark:border-white/[0.04]">
                    <tr>
                      <th className="px-5 py-3.5">Title</th>
                      <th className="px-5 py-3.5">Course</th>
                      <th className="px-5 py-3.5">Due Date</th>
                      <th className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {assignments.map((assignment) => (
                      <tr key={assignment._id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                          {assignment.title}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                          {assignment.courseId?.name || "Unknown Course"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 font-mono text-2xs">
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status="neutral" label={assignment.status || "Active"} />
                        </td>
                      </tr>
                    ))}
                    {assignments.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                          No assignments found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {activeTab === "announcements" && (
            <SectionCard
              title="Official Institutional Circulars"
              subtitle="Targeted communications circulated across college, department, or section scopes"
              action={
                <Button variant="primary" size="sm" onClick={() => setIsCreatingAnnouncement(true)}>
                  + New Announcement
                </Button>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.map((a: any) => (
                  <div
                    key={a._id}
                    className="p-5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-200/70 dark:bg-white/10 text-slate-800 dark:text-slate-200 capitalize">
                          {a.category || "General"}
                        </span>
                        <span className="text-3xs font-mono text-slate-400">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{a.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                        {a.body}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.04] flex items-center justify-between text-2xs">
                      <span className="text-slate-500 uppercase font-mono">
                        Audience: {a.audience}{a.section ? ` (Sec ${a.section})` : ""}
                      </span>
                      {a.priority === "urgent" && <StatusBadge status="urgent" label="Urgent" />}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {activeTab === "attendance" && (
            <SectionCard
              title="Aggregate Attendance Logs"
              subtitle="Institutional attendance registers and compliance percentages"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-white/[0.02] text-slate-400 font-semibold uppercase tracking-wider text-2xs border-b border-slate-100 dark:border-white/[0.04]">
                    <tr>
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-5 py-3.5">Course</th>
                      <th className="px-5 py-3.5 text-center">Classes</th>
                      <th className="px-5 py-3.5 text-center">Present</th>
                      <th className="px-5 py-3.5 text-center">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {attendanceSummary.map((summary, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                          {summary.student?.firstName} {summary.student?.lastName}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 font-mono text-2xs">
                          {summary.course?.courseCode || "EC"}
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono">{summary.totalClasses}</td>
                        <td className="px-5 py-3.5 text-center text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          {summary.presentCount + summary.lateCount}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`font-mono font-bold ${
                              summary.percentage >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                            }`}
                          >
                            {summary.percentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {attendanceSummary.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                          No attendance records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {activeTab === "schedules" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Timetable */}
              <SectionCard title="College Timetable Entries" subtitle="Scheduled theory & laboratory slots">
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {timetable.map((t) => (
                    <div
                      key={t._id}
                      className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {t.courseId?.name || "Course Session"}
                        </p>
                        <p className="text-2xs text-slate-400 mt-0.5">
                          {t.facultyId?.name ? `${t.facultyId.name} · ` : ""}
                          <span className="capitalize">{t.type || "Lecture"}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 capitalize">
                          Day {t.dayOfWeek}
                        </span>
                        <p className="text-3xs text-slate-400 font-mono">
                          {t.startTime} - {t.endTime}
                        </p>
                      </div>
                    </div>
                  ))}
                  {timetable.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-8">No timetable entries logged.</p>
                  )}
                </div>
              </SectionCard>

              {/* Examinations */}
              <SectionCard title="Scheduled Examinations" subtitle="Mid-term and end-semester examinations">
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {exams.map((e) => (
                    <div
                      key={e._id}
                      className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{e.title}</p>
                        <p className="text-2xs text-slate-400 mt-0.5">
                          {e.courseId?.name || "Subject"} · {e.facultyId?.name || "Evaluator"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                          {new Date(e.date).toLocaleDateString()}
                        </span>
                        <p className="text-3xs text-slate-400 font-mono">
                          {e.startTime} - {e.endTime}
                        </p>
                      </div>
                    </div>
                  ))}
                  {exams.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-8">No examinations scheduled.</p>
                  )}
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === "calendar" && (
            <SectionCard
              title="Academic Calendar"
              subtitle="Institutional events, milestones, and statutory holidays"
              action={
                <Button variant="primary" size="sm" onClick={() => setIsCreatingEvent(true)}>
                  + New Event
                </Button>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-white/[0.02] text-slate-400 font-semibold uppercase tracking-wider text-2xs border-b border-slate-100 dark:border-white/[0.04]">
                    <tr>
                      <th className="px-5 py-3.5">Title</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {events.map((ev) => (
                      <tr key={ev._id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">{ev.title}</td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 font-mono text-2xs">
                          {new Date(ev.date).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status="neutral" label={ev.type} />
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{ev.description || "—"}</td>
                      </tr>
                    ))}
                    {events.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                          No calendar events registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isCreatingUser}
        onClose={() => setIsCreatingUser(false)}
        title="Add Institutional User"
        subtitle="Provision a student, faculty member, or college administrator account"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Password *</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">System Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty Member</option>
              <option value="college_admin">College Administrator</option>
            </select>
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreatingUser(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!newName || !newEmail || !newPassword}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Department Modal */}
      <Modal
        isOpen={isCreatingDepartment}
        onClose={() => setIsCreatingDepartment(false)}
        title="Add Academic Department"
        subtitle="Register a new academic department or program in the institution"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department Code *
            </label>
            <input
              type="text"
              value={newDepCode}
              onChange={(e) => setNewDepCode(e.target.value)}
              placeholder="e.g. ECE"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department Name *
            </label>
            <input
              type="text"
              value={newDepName}
              onChange={(e) => setNewDepName(e.target.value)}
              placeholder="e.g. Electronics & Communication Engineering"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={newDepDesc}
              onChange={(e) => setNewDepDesc(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none resize-none"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreatingDepartment(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!newDepCode || !newDepName}>
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Announcement Modal */}
      <Modal
        isOpen={isCreatingAnnouncement}
        onClose={() => setIsCreatingAnnouncement(false)}
        title="Publish Official Circular"
        subtitle="Target notice strictly to relevant academic audience"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notice Title *</label>
            <input
              type="text"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
              placeholder="e.g. Mid-Term Examination Schedule Declared"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Message Content *
            </label>
            <textarea
              value={newAnnouncement.body}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, body: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none resize-none"
              rows={4}
              placeholder="Official instructions, room allocations, guidelines..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
              <select
                value={newAnnouncement.category}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, category: e.target.value as any })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="general">General Notice</option>
                <option value="holiday">Holiday Declaration</option>
                <option value="exam">Examination Schedule</option>
                <option value="deadline">Important Deadline</option>
                <option value="schedule">Timetable / Schedule</option>
                <option value="instruction">Academic Instruction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Audience Scope *
              </label>
              <select
                value={newAnnouncement.audience}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, audience: e.target.value as any })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="college">Entire College</option>
                <option value="department">Specific Department</option>
                <option value="section">Specific Section Cohort</option>
                <option value="course">Course Enrollees</option>
              </select>
            </div>
          </div>

          {/* Scoped Target Selectors */}
          {(newAnnouncement.audience === "department" || newAnnouncement.audience === "section") && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Department *
              </label>
              <select
                value={newAnnouncement.departmentId}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, departmentId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.departmentCode} - {d.departmentName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {newAnnouncement.audience === "section" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Section (e.g. A, B, C) *
              </label>
              <input
                type="text"
                placeholder="e.g. A"
                value={newAnnouncement.section}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, section: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          )}

          {newAnnouncement.audience === "course" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Course *
              </label>
              <select
                value={newAnnouncement.courseId}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, courseId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="">Select Course...</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.courseCode || c.code} - {c.courseName || c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Urgency Priority</label>
            <select
              value={newAnnouncement.priority}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value as any })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="normal">Normal Priority</option>
              <option value="urgent">Urgent</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreatingAnnouncement(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!newAnnouncement.title || !newAnnouncement.body}
            >
              Publish Notice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Calendar Event Modal */}
      <Modal
        isOpen={isCreatingEvent}
        onClose={() => setIsCreatingEvent(false)}
        title="New Academic Calendar Event"
        subtitle="Schedule an official event or statutory institutional holiday"
        maxWidth="md"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Event Title *</label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Event Date *</label>
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Event Type</label>
            <select
              value={newEvent.type}
              onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="academic">Academic Milestone</option>
              <option value="holiday">Statutory Holiday</option>
              <option value="exam">Examination Period</option>
              <option value="event">Campus Event</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none resize-none"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreatingEvent(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!newEvent.title || !newEvent.date}>
              Create Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
