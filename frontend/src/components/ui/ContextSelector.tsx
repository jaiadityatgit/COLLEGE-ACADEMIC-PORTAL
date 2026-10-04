import React from "react";

export interface ContextOption {
  value: string;
  label: string;
}

export interface ContextSelectorProps {
  label?: string;
  badgeText?: string;
  academicYears?: ContextOption[];
  selectedYear?: string;
  onYearChange?: (year: string) => void;

  semesters?: ContextOption[];
  selectedSemester?: string;
  onSemesterChange?: (sem: string) => void;

  courses?: ContextOption[];
  selectedCourse?: string;
  onCourseChange?: (courseId: string) => void;

  sections?: ContextOption[];
  selectedSection?: string;
  onSectionChange?: (sec: string) => void;

  infoNote?: string;
  className?: string;
}

export const ContextSelector: React.FC<ContextSelectorProps> = ({
  label = "Academic Context",
  badgeText = "Authoritative",
  academicYears,
  selectedYear,
  onYearChange,
  semesters,
  selectedSemester,
  onSemesterChange,
  courses,
  selectedCourse,
  onCourseChange,
  sections,
  selectedSection,
  onSectionChange,
  infoNote,
  className = "",
}) => {
  return (
    <div
      className={`p-4 bg-white dark:bg-[#1c202c] border border-slate-200/80 dark:border-white/[0.06] rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold text-base shadow-xs shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {label}
            </span>
            {badgeText && (
              <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/20">
                {badgeText}
              </span>
            )}
          </div>
          {infoNote && (
            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
              {infoNote}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {academicYears && onYearChange && (
          <select
            value={selectedYear || "all"}
            onChange={(e) => onYearChange(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 cursor-pointer shadow-xs"
          >
            <option value="all">All Years</option>
            {academicYears.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>
        )}

        {semesters && onSemesterChange && (
          <select
            value={selectedSemester || "all"}
            onChange={(e) => onSemesterChange(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 cursor-pointer shadow-xs"
          >
            <option value="all">All Semesters</option>
            {semesters.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        )}

        {sections && onSectionChange && (
          <select
            value={selectedSection || "all"}
            onChange={(e) => onSectionChange(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 cursor-pointer shadow-xs"
          >
            <option value="all">All Sections</option>
            {sections.map((sec) => (
              <option key={sec.value} value={sec.value}>
                Section {sec.label}
              </option>
            ))}
          </select>
        )}

        {courses && onCourseChange && (
          <select
            value={selectedCourse || "all"}
            onChange={(e) => onCourseChange(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 cursor-pointer shadow-xs max-w-[240px]"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};
