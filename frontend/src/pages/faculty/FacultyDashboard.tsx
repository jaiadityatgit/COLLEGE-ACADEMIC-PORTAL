import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { SectionCard } from "../../components/ui/SectionCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { FacultyContextBar } from "../../components/faculty/FacultyContextBar";
import { TeachingContext } from "../../services/teachingAssignment";

export default function FacultyDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Authoritative Teaching Context state
  const [selectedTeachingContext, setSelectedTeachingContext] = useState<TeachingContext | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSem, setSelectedSem] = useState<string>("all");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");

  // Announcement Modal state
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [announceCourse, setAnnounceCourse] = useState("");
  const [announcePriority, setAnnouncePriority] = useState("normal");
  const [postingAnnounce, setPostingAnnounce] = useState(false);

  // Timetable Modal state
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [ttCourse, setTtCourse] = useState("");
  const [ttDay, setTtDay] = useState("Monday");
  const [ttStart, setTtStart] = useState("09:00");
  const [ttEnd, setTtEnd] = useState("10:00");
  const [ttType, setTtType] = useState("lecture");
  const [savingTt, setSavingTt] = useState(false);

  // Reports Drawer state
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportType, setReportType] = useState<"attendance" | "assignments" | "grades">("attendance");
  const [loadingReport, setLoadingReport] = useState(false);

  const fetchData = async () => {
    try {
      const [cRes, aRes, tRes, annRes] = await Promise.allSettled([
        api.get("/courses"),
        api.get("/assignments"),
        api.get("/timetable"),
        api.get("/announcements"),
      ]);
      if (cRes.status === "fulfilled") {
        const d = cRes.value.data.data;
        setSubjects(Array.isArray(d) ? d : []);
      }
      if (aRes.status === "fulfilled") {
        const d = aRes.value.data.data;
        setAssignments(Array.isArray(d) ? d : []);
      }
      if (tRes.status === "fulfilled") {
        const d = tRes.value.data.data;
        setTimetable(Array.isArray(d) ? d : (Array.isArray(d?.entries) ? d.entries : []));
      }
      if (annRes.status === "fulfilled") {
        const d = annRes.value.data.data;
        setAnnouncements(Array.isArray(d) ? d : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeAssignments = Array.isArray(assignments) ? assignments : [];
  const safeTimetable = Array.isArray(timetable) ? timetable : [];
  const safeAnnouncements = Array.isArray(announcements) ? announcements : [];

  // Filter courses by current context
  const filteredSubjects = useMemo(() => {
    return safeSubjects.filter((s) => {
      if (selectedYear !== "all" && s.academicYear !== selectedYear) return false;
      if (selectedSem !== "all" && s.semester !== selectedSem) return false;
      if (selectedCourseId !== "all" && s._id !== selectedCourseId) return false;
      return true;
    });
  }, [safeSubjects, selectedYear, selectedSem, selectedCourseId]);

  const activeCourseIds = useMemo(() => {
    return new Set(filteredSubjects.map((s) => s._id.toString()));
  }, [filteredSubjects]);

  // Filter assignments by active courses
  const filteredAssignments = useMemo(() => {
    if (selectedCourseId === "all" && selectedYear === "all" && selectedSem === "all") {
      return safeAssignments;
    }
    return safeAssignments.filter((a) => {
      const cId = a.courseId?._id ? a.courseId._id.toString() : a.courseId?.toString();
      return cId && activeCourseIds.has(cId);
    });
  }, [safeAssignments, activeCourseIds, selectedCourseId, selectedYear, selectedSem]);

  // Filter timetable by active courses
  const filteredTimetable = useMemo(() => {
    if (selectedCourseId === "all" && selectedYear === "all" && selectedSem === "all") {
      return safeTimetable;
    }
    return safeTimetable.filter((t) => {
      const cId = t.courseId?._id ? t.courseId._id.toString() : t.courseId?.toString();
      return cId && activeCourseIds.has(cId);
    });
  }, [safeTimetable, activeCourseIds, selectedCourseId, selectedYear, selectedSem]);

  const todayNum = new Date().getDay();
  const daysNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayStr = daysNames[todayNum];

  const todayClasses = filteredTimetable.filter((entry: any) => {
    if (entry?.dayOfWeek === undefined || entry?.dayOfWeek === null) return false;
    if (typeof entry.dayOfWeek === "number") {
      return entry.dayOfWeek === todayNum;
    }
    const val = String(entry.dayOfWeek).trim().toLowerCase();
    return val === todayStr.toLowerCase();
  });

  const totalStudents = filteredSubjects.reduce((acc, s) => acc + (s.studentIds?.length || s.studentCount || 0), 0);

  const handleContextChange = (ctx: TeachingContext | null) => {
    setSelectedTeachingContext(ctx);
    if (ctx) {
      setSelectedYear(ctx.academicYear);
      setSelectedSem(String(ctx.semester));
      setSelectedCourseId(ctx.courseId);
      setAnnounceCourse(ctx.courseId);
    } else {
      setSelectedYear("all");
      setSelectedSem("all");
      setSelectedCourseId("all");
      setAnnounceCourse("");
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceBody.trim()) return;

    const courseIdToUse = selectedTeachingContext?.courseId || announceCourse;
    if (!courseIdToUse) {
      alert("Please select a teaching context/course to post a notice.");
      return;
    }

    setPostingAnnounce(true);
    try {
      const res = await api.post("/announcements", {
        title: announceTitle.trim(),
        body: announceBody.trim(),
        priority: announcePriority,
        audience: "course",
        courseId: courseIdToUse,
        category: "instruction"
      });

      setAnnouncements((prev) => [res.data.data, ...prev]);
      setShowAnnounceModal(false);
      setAnnounceTitle("");
      setAnnounceBody("");
      alert("Course announcement posted successfully to enrolled students!");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to post announcement.");
    } finally {
      setPostingAnnounce(false);
    }
  };

  const handleCreateTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttCourse || !ttDay || !ttStart) return;

    const dayMap: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
    };
    const numericDay = typeof ttDay === "number" ? ttDay : (dayMap[ttDay] ?? 1);

    setSavingTt(true);
    try {
      await api.post("/timetable", {
        courseId: ttCourse,
        dayOfWeek: numericDay,
        startTime: ttStart,
        endTime: ttEnd,
        type: ttType,
      });

      alert("Timetable slot created and schedule updated!");
      setShowTimetableModal(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to create timetable slot.");
    } finally {
      setSavingTt(false);
    }
  };

  const handleDeleteTimetable = async (slotId: string) => {
    if (!window.confirm("Are you sure you want to remove this timetable entry?")) return;
    try {
      await api.delete(`/timetable/${slotId}`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to delete slot.");
    }
  };

  const fetchReport = async (type: "attendance" | "assignments" | "grades") => {
    setReportType(type);
    setLoadingReport(true);
    setShowReportsModal(true);
    try {
      const res = await api.get(`/reports/${type}`);
      setReportData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReport(false);
    }
  };

  const facultyDisplayName = /^(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)/i.test(user?.name || "")
    ? user?.name
    : `Prof. ${user?.name || "Faculty Member"}`;

  const isContextFiltered = selectedYear !== "all" || selectedSem !== "all" || selectedCourseId !== "all";

  if (loading) {
    return (
      <div className="h-full overflow-auto bg-slate-50/60 dark:bg-[#0b0f19]">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-10 w-72 rounded-xl" />
          <div className="skeleton h-20 w-full rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-slate-50/60 dark:bg-[#0b0f19]">
      <div className="max-w-[1360px] mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8 animate-fade-in">
        {/* Top Page Header */}
        <PageHeader
          title={`${greeting()}, ${facultyDisplayName}`}
          subtitle={`Department of Electronics & Communication Engineering · ${todayStr}, ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          breadcrumbs={[
            { label: "Academics", href: "/faculty" },
            { label: "Faculty Workspace" },
          ]}
          badges={[
            { label: "AY 2026–2027", variant: "neutral" },
            { label: user?.designation || "Faculty Member", variant: "info" },
            { label: isContextFiltered ? "Scoped View" : "All Courses", variant: isContextFiltered ? "warning" : "success" },
          ]}
          actions={
            <div className="flex items-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchReport("attendance")}
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                Export Reports
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAnnounceModal(true)}
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Post Notice
              </Button>
            </div>
          }
        />

        {/* Welcome & Quick Shortcuts Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Cols: Faculty Context Banner */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#131926] p-6 border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
                  ● Teaching Workspace Active
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Academic Instruction & Course Operations
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                  Manage attendance registers, assessment marks, lecture timetable slots, and problem sets. Context selection automatically filters students and rosters to your assigned teaching load.
                </p>
              </div>
              <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 items-center justify-center font-bold text-lg shadow-sm shrink-0">
                👨‍🏫
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-5 mt-5 border-t border-slate-100 dark:border-white/[0.06] text-xs">
              <div>
                <p className="text-2xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Department</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">ECE (VLSI & Embedded)</p>
              </div>
              <div>
                <p className="text-2xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Term</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">AY 2026–2027 (Odd Sem)</p>
              </div>
              <div>
                <p className="text-2xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Today's Sessions</p>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{todayClasses.length} Scheduled</p>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Quick Action Shortcuts */}
          <div className="rounded-2xl bg-white dark:bg-[#131926] p-6 border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Quick Shortcuts
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Common faculty academic tasks
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <button
                onClick={() => {
                  if (selectedCourseId !== "all") navigate(`/faculty/attendance?courseId=${selectedCourseId}`);
                  else navigate("/faculty/attendance");
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.04] text-left hover:border-slate-300 dark:hover:border-white/10 hover:shadow-xs transition-all group cursor-pointer"
              >
                <span className="text-base block mb-1">📋</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block group-hover:text-slate-900 dark:group-hover:text-white">
                  Attendance
                </span>
                <span className="text-2xs text-slate-400">Mark register →</span>
              </button>

              <button
                onClick={() => {
                  if (selectedCourseId !== "all") navigate(`/faculty/subjects/${selectedCourseId}/marks`);
                  else if (filteredSubjects.length > 0) navigate(`/faculty/subjects/${filteredSubjects[0]._id}/marks`);
                  else navigate("/faculty/subjects");
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.04] text-left hover:border-slate-300 dark:hover:border-white/10 hover:shadow-xs transition-all group cursor-pointer"
              >
                <span className="text-base block mb-1">📝</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block group-hover:text-slate-900 dark:group-hover:text-white">
                  Enter Marks
                </span>
                <span className="text-2xs text-slate-400">Gradebook →</span>
              </button>

              <button
                onClick={() => {
                  if (selectedCourseId !== "all") navigate(`/faculty/subjects/${selectedCourseId}/assignments`);
                  else if (filteredSubjects.length > 0) navigate(`/faculty/subjects/${filteredSubjects[0]._id}/assignments`);
                  else navigate("/faculty/subjects");
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.04] text-left hover:border-slate-300 dark:hover:border-white/10 hover:shadow-xs transition-all group cursor-pointer"
              >
                <span className="text-base block mb-1">📑</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block group-hover:text-slate-900 dark:group-hover:text-white">
                  Assignments
                </span>
                <span className="text-2xs text-slate-400">Create & review →</span>
              </button>

              <button
                onClick={() => navigate(selectedCourseId !== "all" ? `/faculty/students?courseId=${selectedCourseId}` : "/faculty/students")}
                className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.04] text-left hover:border-slate-300 dark:hover:border-white/10 hover:shadow-xs transition-all group cursor-pointer"
              >
                <span className="text-base block mb-1">👥</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block group-hover:text-slate-900 dark:group-hover:text-white">
                  Students
                </span>
                <span className="text-2xs text-slate-400">Class roster →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Teaching Context Bar (Authoritative Context First) */}
        <FacultyContextBar
          selectedContext={selectedTeachingContext}
          onSelectContext={handleContextChange}
        />

        {/* 4-Metric SaaS Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Assigned Courses"
            value={filteredSubjects.length}
            subtitle={isContextFiltered ? "Teaching workload in selected filter" : "Active courses in department"}
            badge={{
              label: isContextFiltered ? "Filtered" : "Full Load",
              variant: isContextFiltered ? "warning" : "success",
            }}
            onClick={() => navigate("/faculty/subjects")}
            icon={
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />

          <StatCard
            label="Enrolled Students"
            value={totalStudents}
            subtitle="Students across active sections"
            badge={{
              label: "Roster Scope",
              variant: "info",
            }}
            onClick={() => navigate(selectedCourseId !== "all" ? `/faculty/students?courseId=${selectedCourseId}` : "/faculty/students")}
            icon={
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />

          <StatCard
            label="Active Assignments"
            value={filteredAssignments.length}
            subtitle="Problem sets & continuous evaluations"
            badge={{
              label: "Live Tasks",
              variant: "neutral",
            }}
            onClick={() => {
              if (selectedCourseId !== "all") navigate(`/faculty/subjects/${selectedCourseId}/assignments`);
              else if (filteredSubjects.length > 0) navigate(`/faculty/subjects/${filteredSubjects[0]._id}/assignments`);
              else navigate("/faculty/subjects");
            }}
            icon={
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />

          <StatCard
            label="Classes Today"
            value={todayClasses.length}
            subtitle={`Instructional slots for ${todayStr}`}
            badge={{
              label: todayStr,
              variant: todayClasses.length > 0 ? "success" : "neutral",
            }}
            onClick={() => navigate("/timetable")}
            icon={
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Schedule & Assigned Subjects */}
          <div className="lg:col-span-2 space-y-8">
            {/* Teaching Schedule */}
            <SectionCard
              title={`Teaching Schedule (${todayStr})`}
              subtitle="Daily instructional slots and laboratory sessions"
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowTimetableModal(true)}
                  icon={
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  }
                >
                  Add Slot
                </Button>
              }
            >
              {todayClasses.length === 0 ? (
                <EmptyState
                  title="No teaching sessions scheduled for today"
                  description="You have no instructional classes or laboratory periods scheduled on this day."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => setShowTimetableModal(true)}>
                      + Schedule a slot
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {todayClasses.map((cls: any) => (
                    <div
                      key={cls._id}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] hover:border-slate-200 dark:hover:border-white/[0.08] transition-all"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-center min-w-[70px] py-1.5 px-2 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-white/10 shrink-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">{cls.startTime}</p>
                          <p className="text-2xs text-slate-400 font-mono">{cls.endTime}</p>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-2xs font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                              {cls.courseId?.courseCode || "EC"}
                            </span>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {typeof cls.courseId === "object" ? cls.courseId.name : "Course Session"}
                            </p>
                          </div>
                          <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1 capitalize">
                            Period: {cls.startTime} - {cls.endTime} · Classroom / Lab
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <StatusBadge
                          status={cls.type === "lab" ? "active" : "info"}
                          label={cls.type === "lab" ? "Laboratory" : "Lecture"}
                        />
                        <button
                          onClick={() => handleDeleteTimetable(cls._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                          title="Delete slot"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Assigned Courses */}
            <SectionCard
              title="Assigned Courses & Workspaces"
              subtitle="Subject curriculum management, marks, and student rosters"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate("/faculty/subjects")}>
                  View all courses →
                </Button>
              }
            >
              {filteredSubjects.length === 0 ? (
                <EmptyState
                  title="No courses in active context"
                  description="No assigned courses match your selected academic year or semester filter."
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedYear("all");
                        setSelectedSem("all");
                        setSelectedCourseId("all");
                      }}
                    >
                      Reset Teaching Context
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredSubjects.map((s: any) => (
                    <div
                      key={s._id}
                      onClick={() => navigate(`/faculty/subjects/${s._id}`)}
                      className="p-5 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xs font-bold text-slate-800 dark:text-slate-200 font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06]">
                            {s.courseCode || "EC-CORE"}
                          </span>
                          <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300">
                            {s.credits} Credits
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors line-clamp-1">
                          {s.name}
                        </h4>
                        <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                          {s.semester ? (s.semester.toLowerCase().includes("sem") ? s.semester : `Semester ${s.semester}`) : "Sem --"} · {s.studentIds?.length || s.studentCount || 0} students enrolled
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-100 dark:border-white/[0.04] text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>Open Workspace</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Right Col: Announcements Feed & Quick Actions */}
          <div className="space-y-8">
            {/* Department Notices */}
            <SectionCard
              title="Department Notices"
              subtitle="Official announcements and circulations"
              action={
                <Button variant="ghost" size="sm" onClick={() => setShowAnnounceModal(true)}>
                  + Post
                </Button>
              }
            >
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {safeAnnouncements.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">
                    No active departmental notices
                  </p>
                ) : (
                  safeAnnouncements.slice(0, 6).map((a: any) => (
                    <div
                      key={a._id}
                      className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {a.title}
                        </p>
                        {a.priority === "high" || a.priority === "urgent" ? (
                          <StatusBadge status="urgent" label="High Priority" />
                        ) : (
                          <StatusBadge status="neutral" label="Notice" />
                        )}
                      </div>
                      <p className="text-2xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {a.body}
                      </p>
                      <div className="text-3xs text-slate-400 font-mono pt-1">
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Today"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            {/* Quick Tools */}
            <SectionCard
              title="Academic Tools"
              subtitle="Operational management shortcuts"
            >
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (selectedCourseId !== "all") navigate(`/faculty/attendance?courseId=${selectedCourseId}`);
                    else navigate("/faculty/attendance");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">📝</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Mark / Edit Attendance</p>
                      <p className="text-3xs text-slate-400">Class-wise roll call and verification</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">→</span>
                </button>

                <button
                  onClick={() => {
                    if (selectedCourseId !== "all") navigate(`/faculty/students?courseId=${selectedCourseId}`);
                    else navigate("/faculty/students");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">👥</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Manage Students</p>
                      <p className="text-3xs text-slate-400">Student rosters & attendance correction</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">→</span>
                </button>

                <button
                  onClick={() => {
                    if (selectedCourseId !== "all") navigate(`/faculty/subjects/${selectedCourseId}/marks`);
                    else if (filteredSubjects.length > 0) navigate(`/faculty/subjects/${filteredSubjects[0]._id}/marks`);
                    else navigate("/faculty/subjects");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">📊</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Enter / Edit Marks</p>
                      <p className="text-3xs text-slate-400">Continuous assessments & grading</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">→</span>
                </button>

                <button
                  onClick={() => {
                    if (selectedCourseId !== "all") navigate(`/faculty/subjects/${selectedCourseId}/assignments`);
                    else if (filteredSubjects.length > 0) navigate(`/faculty/subjects/${filteredSubjects[0]._id}/assignments`);
                    else navigate("/faculty/subjects");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">📑</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Manage Assignments</p>
                      <p className="text-3xs text-slate-400">Deadlines & student submissions</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">→</span>
                </button>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* Post Announcement Modal */}
      <Modal
        isOpen={showAnnounceModal}
        onClose={() => setShowAnnounceModal(false)}
        title="Publish Course Notice"
        subtitle="Official notice will reach all students enrolled in the active teaching context."
        maxWidth="md"
      >
        <form onSubmit={handlePostAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notice Title *
            </label>
            <input
              type="text"
              required
              value={announceTitle}
              onChange={(e) => setAnnounceTitle(e.target.value)}
              placeholder="e.g. Assignment Submission Deadline Tomorrow"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Course
            </label>
            <select
              value={selectedTeachingContext?.courseId || announceCourse}
              onChange={(e) => setAnnounceCourse(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
            >
              {safeSubjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.courseCode || s.name} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Priority
            </label>
            <select
              value={announcePriority}
              onChange={(e) => setAnnouncePriority(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
            >
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Announcement Text *
            </label>
            <textarea
              required
              rows={4}
              value={announceBody}
              onChange={(e) => setAnnounceBody(e.target.value)}
              placeholder="Detailed instructions or message for students..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowAnnounceModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={postingAnnounce}>
              Post Notice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Timetable Modal */}
      <Modal
        isOpen={showTimetableModal}
        onClose={() => setShowTimetableModal(false)}
        title="Add Timetable Slot"
        subtitle="Schedule an instructional class or laboratory period"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTimetable} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Course *
            </label>
            <select
              required
              value={ttCourse}
              onChange={(e) => setTtCourse(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
            >
              <option value="">Choose course…</option>
              {safeSubjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.courseCode} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Day of Week
              </label>
              <select
                value={ttDay}
                onChange={(e) => setTtDay(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Session Type
              </label>
              <select
                value={ttType}
                onChange={(e) => setTtType(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer"
              >
                <option value="lecture">Lecture</option>
                <option value="lab">Lab Session</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={ttStart}
                onChange={(e) => setTtStart(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                End Time
              </label>
              <input
                type="time"
                value={ttEnd}
                onChange={(e) => setTtEnd(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowTimetableModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={savingTt}>
              Create Slot
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reports Modal */}
      <Modal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
        title={`${reportType.toUpperCase()} Academic Report`}
        subtitle="Extracted academic metrics and student data export"
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {(["attendance", "assignments", "grades"] as const).map((t) => (
              <button
                key={t}
                onClick={() => fetchReport(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  reportType === t
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {loadingReport ? (
            <div className="skeleton h-56 rounded-xl" />
          ) : (
            <pre className="p-4 bg-slate-50 dark:bg-black/30 border border-slate-200/60 dark:border-white/[0.04] rounded-xl text-2xs font-mono overflow-x-auto text-slate-800 dark:text-slate-200 max-h-96">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowReportsModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
