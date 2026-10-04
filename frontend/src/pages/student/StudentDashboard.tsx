import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import api from "../../services/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { SectionCard } from "../../components/ui/SectionCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ChartCard } from "../../components/ui/ChartCard";


interface TimetableEntry {
  _id: string;
  courseId: { _id: string; name: string; courseCode: string };
  facultyId: { _id: string; name: string };
  startTime: string;
  endTime: string;
  type: string;
  dayOfWeek: number;
}

interface AnnouncementItem {
  _id: string;
  title: string;
  body: string;
  category?: string;
  priority: string;
  createdAt: string;
}

interface AssignmentItem {
  _id: string;
  title: string;
  courseId: { _id: string; name: string; courseCode: string };
  dueDate: string;
  totalMarks: number;
  status: string;
}

interface GradeItem {
  _id: string;
  courseId: { _id: string; name: string; courseCode: string };
  title: string;
  marksObtained: number;
  maxMarks: number;
}

interface ExamItem {
  _id: string;
  title: string;
  courseId: { _id: string; name: string; courseCode: string };
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  totalMarks: number;
  status: string;
}

interface SubjectCard {
  _id: string;
  name: string;
  courseCode: string;
  credits: number;
  courseType: string;
  facultyIds: { _id: string; name: string }[];
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
}


function MiniCalendar() {
  const today = new Date();
  const currentMonth = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = today.getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  return (
    <div className="p-4 bg-slate-50/70 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/[0.04]">
      <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
        <span>{currentMonth}</span>
        <span className="text-2xs font-mono font-medium px-2 py-0.5 rounded-md bg-white dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
          Sem 2026-27
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-2xs mb-1 font-semibold text-slate-400 dark:text-slate-500">
        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {days.map((d, idx) => (
          <div
            key={idx}
            className={`h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
              d === null
                ? "text-transparent"
                : d === todayDate
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.06]"
            }`}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}


function DashboardSkeleton() {
  return (
    <div className="h-full overflow-auto surface-page">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="space-y-2">
          <div className="skeleton h-8 w-64 rounded-xl" />
          <div className="skeleton h-4 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 skeleton h-96 rounded-2xl" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}


export default function StudentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [todaySchedule, setTodaySchedule] = useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<SubjectCard[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [timetableRes, coursesRes, announcementsRes, assignmentsRes, gradesRes, examsRes, notificationsRes, attendanceRes] =
        await Promise.allSettled([
          api.get("/timetable"),
          api.get("/courses"),
          api.get("/announcements"),
          api.get("/assignments"),
          api.get("/gradebook"),
          api.get("/exams"),
          api.get("/notifications"),
          api.get("/attendance"),
        ]);

      if (timetableRes.status === "fulfilled") {
        const all = timetableRes.value.data.data || [];
        const today = new Date().getDay();
        setTodaySchedule(
          all
            .filter((t: any) => t.dayOfWeek === today)
            .sort((a: any, b: any) => (a.startTime || "").localeCompare(b.startTime || ""))
        );
      }
      if (coursesRes.status === "fulfilled") {
        const coursesData = coursesRes.value.data.data || [];
        setSubjects(coursesData);
        setCourses(coursesData);
      }
      if (announcementsRes.status === "fulfilled") {
        setAnnouncements((announcementsRes.value.data.data || []).slice(0, 5));
      }
      if (assignmentsRes.status === "fulfilled") {
        const allAssignments = assignmentsRes.value.data.data || [];
        const upcoming = allAssignments
          .filter((a: any) => new Date(a.dueDate) >= new Date())
          .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        setAssignments(upcoming.slice(0, 5));
      }
      if (gradesRes.status === "fulfilled") {
        setGrades((gradesRes.value.data.data || []).slice(0, 6));
      }
      if (examsRes.status === "fulfilled") {
        const allExams = examsRes.value.data.data || [];
        const upcoming = allExams
          .filter((e: any) => new Date(e.date) >= new Date())
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setExams(upcoming.slice(0, 4));
      }
      if (notificationsRes.status === "fulfilled") {
        setNotifications((notificationsRes.value.data.data?.notifications || []).slice(0, 5));
      }
      if (attendanceRes.status === "fulfilled") {
        setAttendance(attendanceRes.value.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const attendanceStats = React.useMemo(() => {
    if (courses.length === 0 || attendance.length === 0) {
      return { overall: 0, totalClasses: 0, presentCount: 0, absentCount: 0, bySubject: [] as any[] };
    }
    const bySubject = courses.map((c) => {
      const records = attendance.filter((a: any) => {
        const cid = typeof a.courseId === "object" ? a.courseId._id : a.courseId;
        return cid === c._id;
      });
      const total = records.length;
      const present = records.filter((r: any) => r.status === "present" || r.status === "od" || r.status === "late").length;
      const absent = records.filter((r: any) => r.status === "absent").length;
      return {
        ...c,
        total,
        present,
        absent,
        pct: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    });
    const totalClasses = bySubject.reduce((a, c) => a + c.total, 0);
    const presentCount = bySubject.reduce((a, c) => a + c.present, 0);
    const absentCount = bySubject.reduce((a, c) => a + c.absent, 0);
    return {
      overall: totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0,
      totalClasses,
      presentCount,
      absentCount,
      bySubject,
    };
  }, [courses, attendance]);

  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const daysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Due today";
    if (diff === 1) return "Due tomorrow";
    return `${diff} days left`;
  };

  if (loading) return <DashboardSkeleton />;

  const pendingAssignmentCount = assignments.length;
  const upcomingExamCount = exams.length;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* ─── 1. Header Banner & Quick Links (Inspired by Reference Image 1 & 2) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Welcome Card */}
          <div className="lg:col-span-2 p-6 sm:p-7 rounded-2xl bg-neutral-900 text-white shadow-card flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-white text-2xs font-semibold backdrop-blur-xs">
                <span>🎓 Academic Session 2026–2027</span>
                <span>·</span>
                <span>Active Enrolled Student</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white pt-1">
                {greeting()}, {user?.name?.split(" ")[0]}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Welcome to your student workspace for the Department of Electronics and Communication Engineering.
                You have {todaySchedule.length} session{todaySchedule.length === 1 ? "" : "s"} scheduled for {dayName}.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3 pt-5 mt-4 border-t border-white/10 text-xs text-slate-300">
              <span className="font-semibold text-white">Institutional Status:</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium text-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                In Good Standing
              </span>
              <span>·</span>
              <span>{subjects.length} Active Courses</span>
            </div>

            {/* Subtle decorative background geometry */}
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
              <svg width="260" height="260" viewBox="0 0 200 200" fill="currentColor">
                <circle cx="100" cy="100" r="80" />
              </svg>
            </div>
          </div>

          {/* Quick Links Card (Reference Image 1: Time table, Attendance, Exam Result, Reports) */}
          <Card padding="md" className="flex flex-col justify-between">
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                Quick Shortcuts
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => navigate("/timetable")}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] transition-all text-center border border-slate-100 dark:border-white/[0.04] group cursor-pointer"
                >
                  <span className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-1 text-sm font-semibold">
                    📅
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white">
                    Timetable
                  </span>
                </button>

                <button
                  onClick={() => navigate("/attendance")}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] transition-all text-center border border-slate-100 dark:border-white/[0.04] group cursor-pointer"
                >
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-1 text-sm font-semibold">
                    📊
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white">
                    Attendance
                  </span>
                </button>

                <button
                  onClick={() => navigate("/assignments")}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] transition-all text-center border border-slate-100 dark:border-white/[0.04] group cursor-pointer"
                >
                  <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-1 text-sm font-semibold">
                    📝
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white">
                    Assignments
                  </span>
                </button>

                <button
                  onClick={() => navigate("/exams")}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] transition-all text-center border border-slate-100 dark:border-white/[0.04] group cursor-pointer"
                >
                  <span className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 flex items-center justify-center mb-1 text-sm font-semibold">
                    📋
                  </span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white">
                    Exam Result
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-2xs text-slate-400 dark:text-slate-500">
              <span>Semester 2026-27</span>
              <button onClick={() => navigate("/calendar")} className="text-slate-700 dark:text-slate-300 font-semibold hover:underline">
                View Calendar →
              </button>
            </div>
          </Card>
        </div>

        {/* ─── 2. Top 4 Metric StatCards (Commercial SaaS Grid) ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            label="Attendance Ratio"
            value={`${attendanceStats.overall}%`}
            subtitle="75% minimum required"
            iconBg="emerald"
            badge={{
              text: attendanceStats.overall >= 75 ? "Compliant" : "Deficit",
              variant: attendanceStats.overall >= 75 ? "success" : "danger",
            }}
            ringProgress={attendanceStats.overall}
            ringColor={attendanceStats.overall >= 75 ? "#059669" : "#e11d48"}
            linkText="View attendance record"
            onLinkClick={() => navigate("/attendance")}
          />

          <StatCard
            label="Enrolled Courses"
            value={subjects.length}
            subtitle="Core & elective credits"
            iconBg="sky"
            badge={{ text: "Active", variant: "info" }}
            linkText="View courses & syllabus"
            onLinkClick={() => navigate("/subjects")}
          />

          <StatCard
            label="Pending Tasks"
            value={pendingAssignmentCount}
            subtitle={pendingAssignmentCount === 0 ? "All coursework completed" : "Coursework tasks open"}
            iconBg="amber"
            badge={{
              text: pendingAssignmentCount === 0 ? "Up to date" : "Action Needed",
              variant: pendingAssignmentCount === 0 ? "success" : "warning",
            }}
            linkText="Submit assignments"
            onLinkClick={() => navigate("/assignments")}
          />

          <StatCard
            label="Scheduled Exams"
            value={upcomingExamCount}
            subtitle={upcomingExamCount === 0 ? "No active test dates" : "Upcoming term assessments"}
            iconBg="rose"
            badge={{ text: upcomingExamCount > 0 ? "Active Schedule" : "None", variant: "neutral" }}
            linkText="Inspect exam schedule"
            onLinkClick={() => navigate("/exams")}
          />
        </div>

        {/* ─── 3. Main Dashboard 3-Column Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Teaching Schedule (Horizontal Carousel / Pill Cards from Reference) */}
            <SectionCard
              title="Today's Timetable"
              subtitle={`${dayName}'s active classroom lectures & laboratories`}
              headerAction={
                <Button variant="ghost" size="sm" onClick={() => navigate("/timetable")}>
                  Full Timetable →
                </Button>
              }
            >
              {todaySchedule.length === 0 ? (
                <EmptyState
                  title="No classes scheduled today"
                  description="Enjoy your open day or use it to work on assignments."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => navigate("/subjects")}>
                      Browse Coursework
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {todaySchedule.map((entry) => (
                    <div
                      key={entry._id}
                      onClick={() => entry.courseId?._id && navigate(`/subjects/${entry.courseId._id}`)}
                      className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] hover:bg-slate-100/90 dark:hover:bg-white/[0.04] transition-all cursor-pointer group border border-slate-100/80 dark:border-white/[0.04]"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="text-center min-w-[56px] px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] flex-shrink-0 shadow-2xs">
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {entry.startTime}
                          </p>
                          <p className="text-2xs text-slate-400 dark:text-slate-500 font-mono">
                            {entry.endTime}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-black dark:group-hover:text-white transition-colors">
                            {typeof entry.courseId === "object" ? entry.courseId.name : "Course"}
                          </p>
                          <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            Faculty: {typeof entry.facultyId === "object" ? entry.facultyId.name : "Assigned Faculty"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusBadge
                          status={entry.type === "lab" ? "success" : entry.type === "tutorial" ? "warning" : "info"}
                          label={entry.type}
                          size="sm"
                        />
                        <span className="text-slate-400 group-hover:translate-x-1 transition-transform text-xs">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Attendance Demographics & Subject Comparison */}
            <ChartCard
              title="Attendance by Subject"
              subtitle="Real-time compliance tracking across all enrolled courses"
              barsData={attendanceStats.bySubject
                .filter((s) => s.total > 0)
                .map((s) => ({
                  label: s.courseCode || s.name,
                  value: s.pct,
                  maxValue: 100,
                  color: s.pct >= 75 ? "#059669" : s.pct >= 65 ? "#d97706" : "#e11d48",
                  secondaryLabel: `${s.present}/${s.total} Classes`,
                }))}
              barsOrientation="horizontal"
              headerAction={
                <Button variant="ghost" size="sm" onClick={() => navigate("/attendance")}>
                  Full Report →
                </Button>
              }
            />

            {/* Recent Marks / Assessment Performance (Real MongoDB Gradebook Data) */}
            <SectionCard
              title="Recent Marks & Assessments"
              subtitle="Official internal tests, quiz evaluations, and semester marks"
              headerAction={
                <Button variant="ghost" size="sm" onClick={() => navigate("/grades")}>
                  Full Gradebook →
                </Button>
              }
            >
              {grades.length === 0 ? (
                <EmptyState
                  title="No marks published yet"
                  description="Grades will appear here once faculty evaluate coursework or exams."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {grades.map((g) => {
                    const pct = g.maxMarks > 0 ? Math.round((g.marksObtained / g.maxMarks) * 100) : 0;
                    return (
                      <div
                        key={g._id}
                        className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-2xs font-bold font-mono text-slate-400 uppercase">
                            {typeof g.courseId === "object" ? g.courseId.courseCode : "COURSE"}
                          </p>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                            {g.title || "Assessment"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {g.marksObtained} <span className="text-xs text-slate-400 font-normal">/ {g.maxMarks}</span>
                          </p>
                          <span
                            className={`text-2xs font-semibold ${
                              pct >= 75
                                ? "text-emerald-600 dark:text-emerald-400"
                                : pct >= 50
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {pct}% Score
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* Enrolled Courses Grid */}
            <SectionCard
              title="Enrolled Courses Workspaces"
              subtitle="Access syllabus, lecture materials, and problem sets"
              headerAction={
                <Button variant="ghost" size="sm" onClick={() => navigate("/subjects")}>
                  All Courses ({subjects.length}) →
                </Button>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {subjects.slice(0, 4).map((s) => (
                  <div
                    key={s._id}
                    onClick={() => navigate(`/subjects/${s._id}`)}
                    className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/10 hover:shadow-card cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                          {s.courseCode}
                        </span>
                        <StatusBadge
                          status={s.courseType === "lab" ? "success" : "info"}
                          label={`${s.credits} Credits`}
                          size="sm"
                          showDot={false}
                        />
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white line-clamp-1 transition-colors">
                        {s.name}
                      </p>
                      {s.facultyIds?.length > 0 && (
                        <p className="text-2xs text-slate-400 dark:text-slate-500 mt-1 truncate">
                          {s.facultyIds.map((f) => (typeof f === "object" ? f.name : "")).filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-slate-100 dark:border-white/[0.04] text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Open Workspace</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Right Column Widgets */}
          <div className="space-y-6">
            {/* Mini Calendar Widget */}
            <SectionCard title="Schedules & Calendar" subtitle="Semester academic calendar">
              <MiniCalendar />
            </SectionCard>

            {/* Upcoming Deadlines & Problem Sets */}
            <SectionCard
              title="Upcoming Deadlines"
              subtitle="Homework & assignment submissions"
              headerAction={
                <Button variant="ghost" size="sm" onClick={() => navigate("/assignments")}>
                  View all
                </Button>
              }
            >
              {assignments.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                  No upcoming deadlines
                </p>
              ) : (
                <div className="space-y-3">
                  {assignments.map((a) => (
                    <div
                      key={a._id}
                      onClick={() => navigate("/assignments")}
                      className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] hover:bg-slate-100/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {a.title}
                          </p>
                          <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {typeof a.courseId === "object" ? a.courseId.courseCode : ""} · {a.totalMarks} marks
                          </p>
                        </div>
                        <StatusBadge status="warning" label={daysUntil(a.dueDate)} size="sm" />
                      </div>
                      <p className="text-2xs font-mono text-slate-400 dark:text-slate-500 mt-2">
                        Due: {new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Upcoming Exams List */}
            <SectionCard
              title="Upcoming Examinations"
              subtitle="Mid-term and end-term schedules"
              headerAction={
                <Button variant="ghost" size="sm" onClick={() => navigate("/exams")}>
                  Schedule
                </Button>
              }
            >
              {exams.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                  No scheduled exams
                </p>
              ) : (
                <div className="space-y-3">
                  {exams.map((e) => (
                    <div
                      key={e._id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]"
                    >
                      <div className="text-center min-w-[44px] px-2 py-1.5 rounded-lg bg-white dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] flex-shrink-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                          {new Date(e.date).getDate()}
                        </p>
                        <p className="text-2xs font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                          {new Date(e.date).toLocaleDateString("en-US", { month: "short" })}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {e.title}
                        </p>
                        <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {typeof e.courseId === "object" ? e.courseId.courseCode : ""} · {e.totalMarks} Marks
                        </p>
                      </div>
                      <StatusBadge status="danger" label={e.type || "Exam"} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Official Notice Board */}
            <SectionCard
              title="Department Notices"
              subtitle="Official announcements & guidelines"
              headerAction={
                <Button variant="ghost" size="sm" onClick={() => navigate("/announcements")}>
                  View all
                </Button>
              }
            >
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {announcements.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                    No recent announcements
                  </p>
                ) : (
                  announcements.map((a) => (
                    <div
                      key={a._id}
                      className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            a.priority === "urgent" || a.priority === "high" ? "bg-rose-500" : "bg-neutral-900 dark:bg-white"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {a.title}
                          </p>
                          <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {a.body}
                          </p>
                          <p className="text-2xs font-mono text-slate-400 dark:text-slate-500 mt-1.5">
                            {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
