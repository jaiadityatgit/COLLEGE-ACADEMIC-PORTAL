import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

interface TimetableEntry {
  _id: string;
  courseId: { _id: string; name: string; courseCode: string };
  facultyId: { _id: string; name: string };
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAYS = [1, 2, 3, 4, 5];

export default function TimetablePage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const d = new Date().getDay();
    return d >= 1 && d <= 5 ? d : 1;
  });
  const [viewMode, setViewMode] = useState<"all" | "single">("all");

  useEffect(() => {
    api.get("/timetable")
      .then((res) => setEntries(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().getDay();

  if (loading) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-8 w-48 rounded-lg" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const daysToRender = viewMode === "single" ? [selectedDay] : WEEKDAYS;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Academic Timetable</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Weekly schedule for lectures, tutorials, and laboratory sessions</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "all"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Full Week
            </button>
            <button
              onClick={() => setViewMode("single")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "single"
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Day View
            </button>
          </div>
        </div>

        {/* Day Selector Pills (Essential for Mobile & Day View) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {WEEKDAYS.map((day) => {
            const isToday = day === today;
            const isSelected = day === selectedDay;
            const daySessions = entries.filter((e) => e.dayOfWeek === day).length;
            return (
              <button
                key={day}
                onClick={() => {
                  setSelectedDay(day);
                  if (viewMode === "all" && window.innerWidth < 768) {
                    setViewMode("single");
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border ${
                  isSelected
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                    : "bg-white dark:bg-[#1c202c] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-[#232838]"
                }`}
              >
                <span>{DAYS[day]}</span>
                {isToday && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                  }`}>
                    Today
                  </span>
                )}
                <span className={`text-[11px] font-mono ${isSelected ? "text-neutral-300" : "text-slate-400"}`}>
                  {daySessions}
                </span>
              </button>
            );
          })}
        </div>

        {/* Schedule Cards */}
        <div className="space-y-5">
          {daysToRender.map((day) => {
            const dayEntries = entries
              .filter((e) => e.dayOfWeek === day)
              .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
            const isToday = day === today;

            return (
              <Card
                key={day}
                padding="none"
                className={isToday ? "ring-2 ring-neutral-900/10 dark:ring-white/10" : ""}
              >
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{DAYS[day]}</h2>
                    {isToday && (
                      <Badge variant="success" size="sm">
                        Today
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {dayEntries.length} {dayEntries.length === 1 ? "session" : "sessions"}
                  </span>
                </div>
                <div className="divider" />
                <div className="p-5">
                  {dayEntries.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                      No sessions scheduled for {DAYS[day]}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dayEntries.map((entry) => (
                        <div
                          key={entry._id}
                          className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100/80 dark:border-white/[0.03]"
                        >
                          <div className="text-center min-w-[56px] flex-shrink-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{entry.startTime}</p>
                            <p className="text-2xs text-slate-400 dark:text-slate-500 font-mono">{entry.endTime}</p>
                          </div>
                          <div
                            className={`w-1 h-10 rounded-full flex-shrink-0 ${
                              entry.type === "lab" ? "bg-emerald-500" : entry.type === "tutorial" ? "bg-amber-500" : "bg-neutral-900 dark:bg-white"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {typeof entry.courseId === "object" ? entry.courseId.name : "Course Session"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {typeof entry.facultyId === "object" ? entry.facultyId.name : "Faculty"}
                              {typeof entry.courseId === "object" && entry.courseId.courseCode && ` · ${entry.courseId.courseCode}`}
                            </p>
                          </div>
                          <Badge
                            variant={entry.type === "lab" ? "success" : entry.type === "tutorial" ? "warning" : "info"}
                            size="sm"
                          >
                            {entry.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
