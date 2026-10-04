import React, { useEffect, useState, useMemo } from "react";
import { teachingAssignmentService, TeachingContext } from "../../services/teachingAssignment";

interface FacultyContextBarProps {
  selectedContext: TeachingContext | null;
  onSelectContext: (ctx: TeachingContext | null) => void;
  className?: string;
}

export const FacultyContextBar: React.FC<FacultyContextBarProps> = ({
  selectedContext,
  onSelectContext,
  className = ""
}) => {
  const [contexts, setContexts] = useState<TeachingContext[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    teachingAssignmentService
      .getMyContexts()
      .then((res) => {
        if (!isMounted) return;
        const list = res.data.data || [];
        setContexts(list);
        if (list.length > 0 && !selectedContext) {
          onSelectContext(list[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to load teaching contexts:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className={`p-4 rounded-2xl bg-white dark:bg-[#1c202c] border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex items-center justify-between animate-pulse ${className}`}>
        <div className="h-5 w-48 bg-slate-200 dark:bg-white/10 rounded" />
        <div className="h-8 w-64 bg-slate-200 dark:bg-white/10 rounded-xl" />
      </div>
    );
  }

  if (contexts.length === 0) {
    return (
      <div className={`p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-2">
          <span>⚠️</span>
          <span>No authoritative teaching assignments found for your account. Please contact your HOD or Admin.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl bg-white dark:bg-[#1c202c] border border-slate-200/80 dark:border-white/[0.06] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-base shadow-xs shrink-0">
          🎓
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Teaching Context
            </span>
            <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Authoritative
            </span>
          </div>
          <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
            Academic actions, student rosters, and attendance are strictly scoped to the active teaching assignment.
          </p>
        </div>
      </div>

      {/* Context Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <select
            value={selectedContext?.assignmentId || ""}
            onChange={(e) => {
              const found = contexts.find((c) => c.assignmentId === e.target.value);
              if (found) onSelectContext(found);
            }}
            className="w-full sm:w-auto min-w-[280px] px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 shadow-xs cursor-pointer"
          >
            {contexts.map((ctx) => (
              <option key={ctx.assignmentId} value={ctx.assignmentId}>
                {ctx.academicYear} • Sem {ctx.semester} • {ctx.section ? `Sec ${ctx.section}` : "All"} • {ctx.courseCode} - {ctx.courseName}
              </option>
            ))}
          </select>
        </div>

        {selectedContext && (
          <div className="hidden lg:flex items-center gap-1.5 text-2xs font-mono font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300">
            <span>👥 {selectedContext.studentCount || 0} Students</span>
          </div>
        )}
      </div>
    </div>
  );
};
