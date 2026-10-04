import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";

interface Subject {
  _id: string;
  name: string;
  courseCode: string;
  credits: number;
  courseType: string;
  semester: string;
  facultyIds: { _id: string; name: string }[];
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "theory" | "lab">("all");
  const navigate = useNavigate();

  useEffect(() => {
    Promise.allSettled([
      api.get("/courses"),
      api.get("/assignments"),
      api.get("/attendance"),
      api.get("/exams"),
    ])
      .then(([coursesRes, assignmentsRes, attendanceRes, examsRes]) => {
        if (coursesRes.status === "fulfilled") setSubjects(coursesRes.value.data.data || []);
        if (assignmentsRes.status === "fulfilled") setAssignments(assignmentsRes.value.data.data || []);
        if (attendanceRes.status === "fulfilled") setAttendance(attendanceRes.value.data.data || []);
        if (examsRes.status === "fulfilled") setExams(examsRes.value.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const enrichedSubjects = useMemo(() => {
    return subjects.map((s) => {
      const attRecords = attendance.filter((a: any) => {
        const cid = typeof a.courseId === "object" ? a.courseId._id : a.courseId;
        return cid === s._id;
      });
      const attTotal = attRecords.length;
      const attPresent = attRecords.filter((r: any) => r.status === "present" || r.status === "late").length;
      const attPct = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : -1;

      const subjectAssignments = assignments.filter((a: any) => {
        const cid = typeof a.courseId === "object" ? a.courseId._id : a.courseId;
        return cid === s._id;
      });
      const pendingAssignments = subjectAssignments.filter((a: any) => new Date(a.dueDate) >= new Date());

      const subjectExams = exams.filter((e: any) => {
        const cid = typeof e.courseId === "object" ? e.courseId._id : e.courseId;
        return cid === s._id;
      });
      const upcomingExam = subjectExams
        .filter((e: any) => new Date(e.date) >= new Date())
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      return {
        ...s,
        attPct,
        attTotal,
        assignmentCount: subjectAssignments.length,
        pendingCount: pendingAssignments.length,
        upcomingExam,
      };
    });
  }, [subjects, assignments, attendance, exams]);

  const filteredSubjects = useMemo(() => {
    let result = enrichedSubjects;
    if (filter === "theory") result = result.filter(s => s.courseType !== "lab");
    if (filter === "lab") result = result.filter(s => s.courseType === "lab");
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.courseCode.toLowerCase().includes(q) ||
        s.facultyIds?.some((f) => typeof f === "object" && f.name.toLowerCase().includes(q))
    );
  }, [enrichedSubjects, searchQuery, filter]);

  if (loading) {
    return (
      <div className="h-full overflow-auto bg-slate-50/60 dark:bg-[#0b0f19]">
        <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="space-y-2">
            <div className="skeleton h-8 w-48 rounded-lg" />
            <div className="skeleton h-4 w-72 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-slate-50/60 dark:bg-[#0b0f19]">
      <div className="max-w-[1360px] mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8 animate-fade-in">
        {/* Page Header */}
        <PageHeader
          title="Curriculum Courses & Workspaces"
          subtitle={`Department of Electronics & Communication Engineering · ${subjects.length} Enrolled Courses`}
          breadcrumbs={[
            { label: "Academics", href: "/dashboard" },
            { label: "Courses" }
          ]}
          badges={[
            { label: "AY 2026–2027", variant: "neutral" },
            { label: `${subjects.length} Enrolled`, variant: "info" }
          ]}
          actions={
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search by code or title…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 px-3.5 py-1.5 text-xs bg-white dark:bg-[#131926] border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          }
        />

        {/* Filter pills */}
        <div className="flex items-center gap-2">
          {(["all", "theory", "lab"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
                filter === f
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {f === "all" ? "All Subjects" : f === "theory" ? "Theory Lectures" : "Laboratories"}
            </button>
          ))}
        </div>

        {/* Subject Grid */}
        {filteredSubjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubjects.map((s) => {
              const isLab = s.courseType === "lab";
              return (
                <div
                  key={s._id}
                  onClick={() => navigate(`/subjects/${s._id}`)}
                  className="p-5 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-mono font-bold text-white shadow-xs ${
                          isLab ? "bg-emerald-600" : "bg-neutral-900 dark:bg-white dark:text-neutral-900"
                        }`}
                      >
                        {s.courseCode?.slice(-2) || "EC"}
                      </div>
                      <Badge variant={isLab ? "success" : "info"} size="sm">
                        {s.credits} Credits
                      </Badge>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white transition-colors leading-snug">
                      {s.name}
                    </h3>
                    <p className="text-2xs text-slate-400 font-mono mt-0.5">{s.courseCode}</p>

                    {s.facultyIds?.length > 0 && (
                      <p className="text-2xs text-slate-500 dark:text-slate-400 mt-2 truncate">
                        Prof. {s.facultyIds.map((f) => (typeof f === "object" ? f.name : "")).filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-2xs">
                    <div>
                      {s.attPct >= 0 ? (
                        <Badge variant={s.attPct >= 75 ? "success" : s.attPct >= 65 ? "warning" : "danger"} size="sm" dot>
                          {s.attPct}% Attendance
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-3xs font-medium">No attendance log</span>
                      )}
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {s.pendingCount > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{s.pendingCount} pending task{s.pendingCount > 1 ? "s" : ""}</span>
                      ) : (
                        `${s.assignmentCount} coursework`
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : searchQuery ? (
          <EmptyState
            title={`No results for "${searchQuery}"`}
            description="Try a different search term or clear your filters."
            action={
              <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(""); setFilter("all"); }}>
                Clear filters
              </Button>
            }
          />
        ) : subjects.length === 0 ? (
          <EmptyState
            title="No enrolled subjects"
            description="Contact your department office to assign your course load."
          />
        ) : null}
      </div>
    </div>
  );
}
