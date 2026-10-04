import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { hodService } from "../../services/hodService";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { SectionCard } from "../../components/ui/SectionCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ChartCard } from "../../components/ui/ChartCard";

function Sparkline({ data, color = "#18181b" }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-7 mt-2">
      {data.slice(-7).map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all duration-300 hover:opacity-100"
          style={{
            height: `${Math.max((v / max) * 100, 15)}%`,
            backgroundColor: v >= 75 ? "#10b981" : v >= 65 ? "#f59e0b" : "#f43f5e",
            opacity: 0.6 + (i / data.length) * 0.4,
            minWidth: 4,
          }}
          title={`${v}%`}
        />
      ))}
    </div>
  );
}

function AnimatedNum({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    let start = 0;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{display}</>;
}

export default function HODDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hodService
      .getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) {
    return (
      <div className="h-full overflow-auto bg-slate-50/60 dark:bg-[#0b0f19]">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-10 w-72 rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50/60 dark:bg-[#0b0f19] p-8">
        <EmptyState
          title="Unable to load dashboard data"
          description="There was an issue fetching the departmental metrics. Please check network connectivity or try refreshing."
          action={
            <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const trendPcts = (data.attendanceTrend || []).map((t: any) => t.percentage || 0);

  const quickLinks = [
    { label: "Faculty Directory", sub: "Staff workloads & assignments", to: "/hod/faculty", icon: "👨‍🏫" },
    { label: "Student Analytics", sub: "Cohorts, attendance & marks", to: "/hod/students", icon: "👥" },
    { label: "Course Analytics", sub: "Curriculum & syllabus tracking", to: "/hod/courses", icon: "📚" },
    { label: "Lab Management", sub: "Equipment & practical sessions", to: "/hod/labs", icon: "🔬" },
    { label: "Approval Center", sub: "Pending leaves & requests", to: "/hod/approvals", icon: "✍️" },
    { label: "Report Center", sub: "Compliance & NAAC audits", to: "/hod/reports", icon: "📑" },
  ];

  const hodDisplayName = /^(Dr\.|Prof\.)/i.test(user?.name || "") ? user?.name : `Dr. ${user?.name || "HOD"}`;

  return (
    <div className="h-full overflow-auto bg-slate-50/60 dark:bg-[#0b0f19]">
      <div className="max-w-[1360px] mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8 animate-fade-in">
        {/* Page Header */}
        <PageHeader
          title={`Department Operations — ${hodDisplayName}`}
          subtitle="Department of Electronics and Communication Engineering (VLSI Design & Technology) · Academic Year 2026–2027"
          breadcrumbs={[
            { label: "Academics", href: "/hod" },
            { label: "Department Dashboard" },
          ]}
          badges={[
            { label: "AY 2026–2027", variant: "neutral" },
            { label: "Dept: ECE / VLSI", variant: "info" },
            { label: "Executive Governance", variant: "success" },
          ]}
          actions={
            <div className="flex items-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/hod/reports")}
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                HOD Reports
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/hod/approvals")}
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Approvals Center
              </Button>
            </div>
          }
        />

        {/* Top Department Overview Banner */}
        <div className="rounded-2xl bg-white dark:bg-[#131926] p-6 border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
              ● Academic Operations Nominal
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Electronics & Communication Engineering Directorate
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time monitoring of departmental attendance ratios, instructional course compliance, laboratory utilisation, and faculty teaching workload across all four B.Tech cohorts (2023–2027).
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0 divide-x divide-slate-100 dark:divide-white/[0.06]">
            <div className="text-right">
              <p className="text-2xs font-medium text-slate-400 uppercase tracking-wider">Overall Attendance</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {data.attendance?.percentage || 0}%
              </p>
              <p className="text-3xs text-emerald-600 dark:text-emerald-400 font-semibold">Min 75% Requirement</p>
            </div>
            <div className="pl-6 text-right">
              <p className="text-2xs font-medium text-slate-400 uppercase tracking-wider">Cohort Pass Ratio</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {data.passPercentage?.percentage || 0}%
              </p>
              <p className="text-3xs text-slate-400 font-medium">Summative Assessments</p>
            </div>
          </div>
        </div>

        {/* 6-Metric High-Density KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Students"
            value={data.totalStudents || 0}
            subtitle="Enrolled in ECE cohorts"
            badge={{ label: "Active", variant: "info" }}
            onClick={() => navigate("/hod/students")}
            icon={
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />

          <StatCard
            label="Faculty Count"
            value={data.totalFaculty || 0}
            subtitle="Professors & Instructors"
            badge={{ label: "Active", variant: "success" }}
            onClick={() => navigate("/hod/faculty")}
            icon={
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            }
          />

          <StatCard
            label="Courses"
            value={data.totalCourses || 0}
            subtitle="Sem 1-8 Curriculum"
            badge={{ label: "Catalog", variant: "neutral" }}
            onClick={() => navigate("/hod/courses")}
            icon={
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
          />

          <StatCard
            label="Laboratories"
            value={data.totalLabs || 0}
            subtitle="VLSI & DSP Labs"
            badge={{ label: "Practical", variant: "info" }}
            onClick={() => navigate("/hod/labs")}
            icon={
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            }
          />

          <StatCard
            label="Dept Attendance"
            value={`${data.attendance?.percentage || 0}%`}
            subtitle="Aggregate attendance"
            badge={{
              label: (data.attendance?.percentage || 0) >= 75 ? "Optimal" : "Review",
              variant: (data.attendance?.percentage || 0) >= 75 ? "success" : "warning",
            }}
            onClick={() => navigate("/hod/students")}
            icon={
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <StatCard
            label="Announcements"
            value={data.announcementCount || 0}
            subtitle="Active circulars"
            badge={{ label: "Circulated", variant: "neutral" }}
            onClick={() => navigate("/announcements")}
            icon={
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            }
          />
        </div>

        {/* Quick Management Shortcuts Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {quickLinks.map((link) => (
            <button
              key={link.to}
              onClick={() => navigate(link.to)}
              className="p-4 rounded-xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 hover:shadow-xs transition-all text-left cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <span className="text-xl block mb-2">{link.icon}</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors">
                  {link.label}
                </p>
                <p className="text-3xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
                  {link.sub}
                </p>
              </div>
              <span className="text-2xs font-semibold text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1 group-hover:text-slate-900 dark:group-hover:text-white">
                Access portal <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </span>
            </button>
          ))}
        </div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Attendance Trend Demographics */}
          <SectionCard
            title="Cohort Attendance Trends"
            subtitle="Recent aggregate attendance distribution across department cohorts"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate("/hod/students")}>
                Cohort Details →
              </Button>
            }
          >
            {data.attendanceTrend?.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-10">
                No recent attendance logs recorded
              </p>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Recent 7-Day Trend</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      Avg: {Math.round(trendPcts.reduce((a: number, b: number) => a + b, 0) / (trendPcts.length || 1))}%
                    </span>
                  </div>
                  <Sparkline data={trendPcts} />
                </div>

                <div className="space-y-2.5">
                  {data.attendanceTrend?.slice(-5).map((t: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className="w-20 text-slate-500 dark:text-slate-400 font-mono text-2xs truncate">
                        {t.date || `Day ${i + 1}`}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            t.percentage >= 75
                              ? "bg-emerald-500"
                              : t.percentage >= 65
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${t.percentage}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold w-12 text-right text-slate-900 dark:text-white text-2xs">
                        {t.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* Department Timetable Slots */}
          <SectionCard
            title="Active Department Timetable Slots"
            subtitle="Real-time instructional session schedule across classrooms and labs"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate("/timetable")}>
                Full Schedule →
              </Button>
            }
          >
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {data.recentTimetable?.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-10">
                  No timetable sessions registered in active term
                </p>
              ) : (
                data.recentTimetable?.slice(0, 7).map((slot: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xs font-bold px-2 py-1 rounded bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300">
                        {dayNames[slot.dayOfWeek] || "Day"}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {typeof slot.courseId === "object" ? slot.courseId.name : "Course Session"}
                        </p>
                        <p className="text-3xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          {slot.startTime} – {slot.endTime}
                        </p>
                      </div>
                    </div>

                    <StatusBadge
                      status={slot.type === "lab" ? "active" : "neutral"}
                      label={slot.type === "lab" ? "Laboratory" : "Lecture"}
                    />
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
