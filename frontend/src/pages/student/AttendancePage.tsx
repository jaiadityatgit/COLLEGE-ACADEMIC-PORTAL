import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";

export default function AttendancePage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.get("/courses"), api.get("/attendance")])
      .then(([coursesRes, attendanceRes]) => {
        if (coursesRes.status === "fulfilled") setCourses(coursesRes.value.data.data || []);
        if (attendanceRes.status === "fulfilled") setAttendance(attendanceRes.value.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Group attendance by course for summary cards
  const courseStats = useMemo(() => {
    return courses.map((c) => {
      const records = attendance.filter((a: any) => {
        const cid = typeof a.courseId === "object" ? a.courseId?._id : a.courseId;
        return cid === c._id;
      });
      const total = records.length;
      const present = records.filter((r: any) => r.status === "present" || r.status === "late" || r.status === "od").length;
      return {
        ...c,
        total,
        present,
        pct: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    });
  }, [courses, attendance]);

  const overallTotal = courseStats.reduce((a, c) => a + c.total, 0);
  const overallPresent = courseStats.reduce((a, c) => a + c.present, 0);
  const overallPct = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0;

  const getStatusVariant = (pct: number): "success" | "warning" | "danger" => {
    if (pct >= 75) return "success";
    if (pct >= 65) return "warning";
    return "danger";
  };

  const getStatusLabel = (pct: number) => {
    if (pct >= 75) return "Healthy";
    if (pct >= 65) return "Attention Required";
    return "Critical Threshold";
  };

  if (loading) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-8 w-40 rounded-lg" />
          <div className="skeleton h-44 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Attendance Record</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Authoritative institutional session attendance and compliance tracking</p>
        </div>

        {/* Overall Attendance Metric Card */}
        <Card padding="lg" className="border border-slate-200/80 dark:border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="text-2xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Overall Attendance
              </span>
              <div className="flex items-baseline gap-3 mt-1.5">
                <span className={`text-4xl sm:text-5xl font-bold tracking-tight ${
                  overallPct >= 75 ? "text-emerald-600 dark:text-emerald-400" : overallPct >= 65 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                }`}>
                  {overallPct}%
                </span>
                <Badge variant={getStatusVariant(overallPct)} size="md" dot>
                  {getStatusLabel(overallPct)}
                </Badge>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2">
                {overallPresent} of {overallTotal} sessions attended
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Statutory requirement: 75% minimum attendance per semester
              </p>
            </div>

            {/* Overall Progress Meter */}
            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Compliance Progress</span>
                <span>{overallPct}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    overallPct >= 75 ? "bg-emerald-500" : overallPct >= 65 ? "bg-amber-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.min(overallPct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0%</span>
                <span className="font-medium text-amber-600">Min 75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Daily Attendance Timeline Redirect Banner */}
        <Card padding="md" className="border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Detailed Daily Session Timeline</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Day-by-day session presence, absences, on-duty logs, and schedule periods are maintained in your Academic Calendar.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/calendar")}
              id="view-calendar-timeline-btn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-slate-100 transition-colors shadow-xs whitespace-nowrap self-start sm:self-auto"
            >
              <span>View Academic Calendar Timeline</span>
              <span>→</span>
            </button>
          </div>
        </Card>

        {/* Per-Subject Breakdown Table */}
        {courseStats.length === 0 ? (
          <EmptyState
            title="No course attendance records"
            description="Course sessions will appear here once attendance records are uploaded by faculty."
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Subject Breakdown</h2>
              <span className="text-xs text-slate-400 font-mono">{courseStats.length} courses</span>
            </div>

            {/* Desktop Table View */}
            <Card padding="none" className="hidden md:block overflow-hidden border border-slate-200/80 dark:border-white/[0.06]">
              <div className="overflow-x-auto">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th className="px-6 py-3.5">Course Name</th>
                      <th className="text-center">Total</th>
                      <th className="text-center">Attended</th>
                      <th className="text-center">Missed</th>
                      <th className="text-center">Percentage</th>
                      <th className="w-56 px-6">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseStats.map((c) => (
                      <tr key={c._id}>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900 dark:text-white">{c.name || c.title}</p>
                          <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">{c.courseCode}</p>
                        </td>
                        <td className="text-center text-slate-600 dark:text-slate-400 font-medium">{c.total}</td>
                        <td className="text-center text-emerald-600 dark:text-emerald-400 font-semibold">{c.present}</td>
                        <td className="text-center text-rose-600 dark:text-rose-400 font-semibold">{Math.max(0, c.total - c.present)}</td>
                        <td className="text-center">
                          <Badge variant={getStatusVariant(c.pct)} size="sm" dot>
                            {c.pct}%
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                c.pct >= 75 ? "bg-emerald-500" : c.pct >= 65 ? "bg-amber-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${Math.min(c.pct, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {courseStats.map((c) => (
                <Card key={c._id} padding="md" className="border border-slate-200/80 dark:border-white/[0.06]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">{c.name || c.title}</p>
                      <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">{c.courseCode}</p>
                    </div>
                    <Badge variant={getStatusVariant(c.pct)} size="sm">
                      {c.pct}%
                    </Badge>
                  </div>

                  <div className="mt-3">
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          c.pct >= 75 ? "bg-emerald-500" : c.pct >= 65 ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.min(c.pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                    <span>{c.present} of {c.total} sessions attended</span>
                    <span className="font-medium text-slate-400">{c.total === 0 ? "No sessions" : `${c.total - c.present} absent`}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
