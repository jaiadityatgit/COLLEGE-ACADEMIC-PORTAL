import React, { useEffect, useState } from "react";
import { hodService } from "../../services/hodService";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

export default function HODCourseAnalyticsPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    hodService.getCourseAnalytics()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const toggleCompare = (id: string) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : prev);
  };

  const comparedCourses = courses.filter(c => compareIds.includes(c._id));

  const GradeBar = ({ dist }: { dist: any }) => {
    const total = (dist?.A || 0) + (dist?.B || 0) + (dist?.C || 0) + (dist?.D || 0) + (dist?.F || 0);
    if (total === 0) return <p className="text-2xs text-gray-400">No grades</p>;
    const colors = { A: "bg-emerald-500", B: "bg-sky-500", C: "bg-amber-500", D: "bg-orange-500", F: "bg-rose-500" };
    return (
      <div className="flex h-2 rounded-full overflow-hidden w-full bg-gray-100 dark:bg-white/[0.04]">
        {(["A", "B", "C", "D", "F"] as const).map(g => {
          const pct = (dist[g] / total) * 100;
          return pct > 0 ? <div key={g} className={`${colors[g]} transition-all duration-300`} style={{ width: `${pct}%` }} /> : null;
        })}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Course Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{courses.length} active courses</p>
          </div>
          <Button
            variant={compareMode ? "primary" : "secondary"}
            size="sm"
            onClick={() => { setCompareMode(!compareMode); setCompareIds([]); }}
          >
            {compareMode ? "Exit Compare" : "Compare Courses"}
          </Button>
        </div>

        {/* Compare View */}
        {compareMode && comparedCourses.length === 2 && (
          <Card padding="none" className="ring-1 ring-neutral-900/10 dark:ring-white/10">
            <div className="px-6 py-4">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Course Comparison</h2>
            </div>
            <div className="divider" />
            <div className="p-6 grid grid-cols-3 text-xs gap-4">
              <div className="font-semibold text-gray-400 uppercase tracking-widest">Metric</div>
              {comparedCourses.map(c => <div key={c._id} className="font-semibold text-gray-900 dark:text-white text-center">{c.name}</div>)}

              {[
                { label: "Enrollment", key: "enrollment" },
                { label: "Avg Attendance", key: "avgAttendance", suffix: "%" },
                { label: "Assignment Completion", key: "assignmentCompletion", suffix: "%" },
                { label: "Engagement Score", key: "engagementScore", suffix: "/100" },
              ].map(metric => (
                <React.Fragment key={metric.key}>
                  <div className="text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-white/[0.04]">{metric.label}</div>
                  {comparedCourses.map(c => {
                    const val = c[metric.key] || 0;
                    return (
                      <div key={c._id} className="text-center font-semibold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-white/[0.04]">
                        {val}{metric.suffix || ""}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </Card>
        )}

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courses.map((c) => (
            <Card key={c._id} padding="md" className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{c.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.courseCode} · {c.credits} Credits</p>
                </div>
                {compareMode && (
                  <Button
                    variant={compareIds.includes(c._id) ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => toggleCompare(c._id)}
                  >
                    {compareIds.includes(c._id) ? "Selected" : "Select"}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-gray-50/60 dark:bg-white/[0.02] text-xs">
                <div>
                  <p className="text-2xs text-gray-400 dark:text-gray-500 uppercase">Students</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{c.enrollment || 0}</p>
                </div>
                <div>
                  <p className="text-2xs text-gray-400 dark:text-gray-500 uppercase">Avg Att.</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{c.avgAttendance || 0}%</p>
                </div>
                <div>
                  <p className="text-2xs text-gray-400 dark:text-gray-500 uppercase">Engagement</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{c.engagementScore || 0}</p>
                </div>
              </div>

              <div>
                <p className="text-2xs text-gray-400 dark:text-gray-500 uppercase mb-1.5">Grade Distribution</p>
                <GradeBar dist={c.gradeDistribution} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
