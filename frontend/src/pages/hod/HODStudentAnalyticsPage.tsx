import React, { useEffect, useState, useCallback } from "react";
import { hodService } from "../../services/hodService";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

export default function HODStudentAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ semester?: string; section?: string; courseId?: string }>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await hodService.getStudentAnalytics(filters);
      setData(result);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return <div className="flex items-center justify-center h-full surface-page"><p className="text-sm text-gray-500 dark:text-gray-400">Unable to load analytics.</p></div>;

  const dist = data.attendanceDistribution || { excellent: 0, good: 0, average: 0, poor: 0, critical: 0 };
  const totalInDist = dist.excellent + dist.good + dist.average + dist.poor + dist.critical;
  const distBars = [
    { label: "≥90%", count: dist.excellent, color: "bg-emerald-500", key: "excellent" },
    { label: "75-89%", count: dist.good, color: "bg-sky-500", key: "good" },
    { label: "60-74%", count: dist.average, color: "bg-amber-500", key: "average" },
    { label: "40-59%", count: dist.poor, color: "bg-orange-500", key: "poor" },
    { label: "<40%", count: dist.critical, color: "bg-rose-500", key: "critical" },
  ];
  const maxBarCount = Math.max(...distBars.map(b => b.count), 1);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Student Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{data.totalStudents} students in department</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filters.semester || ""}
              onChange={e => setFilters(prev => ({ ...prev, semester: e.target.value || undefined }))}
              className="input w-36"
            >
              <option value="">All Semesters</option>
              {(data.filters?.semesters || []).map((s: any) => <option key={s._id} value={s.number}>{s.name}</option>)}
            </select>
            <select
              value={filters.section || ""}
              onChange={e => setFilters(prev => ({ ...prev, section: e.target.value || undefined }))}
              className="input w-36"
            >
              <option value="">All Sections</option>
              {(data.filters?.batches || []).filter((b: any) => b.section).map((b: any) => <option key={b._id} value={b.section}>Section {b.section}</option>)}
            </select>
            <select
              value={filters.courseId || ""}
              onChange={e => setFilters(prev => ({ ...prev, courseId: e.target.value || undefined }))}
              className="input w-44"
            >
              <option value="">All Courses</option>
              {(data.filters?.courses || []).map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card padding="md">
            <p className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total Students</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.totalStudents}</p>
          </Card>
          <Card padding="md">
            <p className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">At-Risk (&lt;75%)</p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{data.atRiskStudents?.length || 0}</p>
          </Card>
          <Card padding="md">
            <p className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Top Performers</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{data.topPerformers?.length || 0}</p>
          </Card>
          <Card padding="md">
            <p className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Weak Subjects</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{(data.weakSubjects || []).filter((w: any) => w.failRate > 20).length}</p>
          </Card>
        </div>

        {/* Attendance Distribution */}
        <Card padding="none">
          <div className="px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Attendance Distribution</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{totalInDist} students with attendance records</p>
          </div>
          <div className="divider" />
          <div className="p-6">
            <div className="space-y-3">
              {distBars.map((bar) => {
                const pct = totalInDist > 0 ? Math.round((bar.count / totalInDist) * 100) : 0;
                return (
                  <div key={bar.key} className="flex items-center gap-4 text-xs">
                    <span className="w-16 text-gray-600 dark:text-gray-400 font-medium">{bar.label}</span>
                    <div className="flex-1 h-3 rounded-full bg-gray-100 dark:bg-white/[0.04] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${bar.color}`}
                        style={{ width: `${(bar.count / maxBarCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-20 text-right font-semibold text-gray-900 dark:text-white">
                      {bar.count} <span className="text-gray-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* At Risk Students Table */}
        {data.atRiskStudents && data.atRiskStudents.length > 0 && (
          <Card padding="none">
            <div className="px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">At-Risk Students (&lt;75% Attendance)</h2>
            </div>
            <div className="divider" />
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th className="px-6">Roll No</th>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th className="text-center">Attendance %</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.atRiskStudents.map((s: any) => (
                    <tr key={s._id}>
                      <td className="px-6 py-4 font-mono text-2xs text-gray-500 dark:text-gray-400">{s.rollNo || "—"}</td>
                      <td className="font-medium text-gray-900 dark:text-white">{s.name}</td>
                      <td className="text-xs text-gray-500 dark:text-gray-400 font-mono">{s.email}</td>
                      <td className="text-center">
                        <span className="font-bold text-rose-600 dark:text-rose-400">{s.attendancePercentage}%</span>
                      </td>
                      <td className="text-center">
                        <Badge variant="danger" size="sm">At Risk</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
