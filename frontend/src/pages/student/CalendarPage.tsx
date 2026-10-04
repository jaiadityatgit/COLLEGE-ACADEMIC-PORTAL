import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";

interface AcademicEvent {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  type: "holiday" | "exam" | "deadline" | "academic";
}

interface TimetableSlot {
  _id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: "lecture" | "lab" | "tutorial";
  courseId?: { _id: string; name: string; courseCode: string };
  facultyId?: { _id: string; name: string; email?: string };
}

interface AttendanceSession {
  _id: string;
  date: string;
  status: "present" | "absent" | "od" | "late" | "excused";
  sessionType?: "lecture" | "lab" | "tutorial";
  remarks?: string;
  courseId?: { _id: string; name?: string; title?: string; courseCode?: string } | string;
  facultyId?: { _id: string; name?: string };
}

export default function CalendarPage() {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSession[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Month navigation state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    Promise.allSettled([
      api.get("/calendar"),
      api.get("/attendance"),
      api.get("/timetable"),
    ])
      .then(([eventsRes, attendanceRes, timetableRes]) => {
        if (eventsRes.status === "fulfilled") {
          setEvents(eventsRes.value.data.data || []);
        }
        if (attendanceRes.status === "fulfilled") {
          setAttendance(attendanceRes.value.data.data || []);
        }
        if (timetableRes.status === "fulfilled") {
          const tt = timetableRes.value.data.data;
          setTimetable(Array.isArray(tt) ? tt : Array.isArray(tt?.entries) ? tt.entries : []);
        }
      })
      .catch((err) => console.error("Error loading calendar data", err))
      .finally(() => setLoading(false));
  }, []);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonthLabel = `${monthNames[month]} ${year}`;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().split("T")[0]);
  };

  // Map attendance by date string (YYYY-MM-DD)
  const attendanceByDate = useMemo(() => {
    const map: Record<string, AttendanceSession[]> = {};
    attendance.forEach((rec) => {
      if (!rec.date) return;
      const d = String(rec.date).split("T")[0];
      if (!map[d]) map[d] = [];
      map[d].push(rec);
    });
    return map;
  }, [attendance]);

  // Map academic events by date string
  const eventsByDate = useMemo(() => {
    const map: Record<string, AcademicEvent[]> = {};
    events.forEach((ev) => {
      if (!ev.startDate) return;
      const start = ev.startDate.split("T")[0];
      const end = ev.endDate ? ev.endDate.split("T")[0] : start;

      // Handle single day or multi-day range
      let cur = new Date(start + "T00:00:00");
      const last = new Date(end + "T00:00:00");
      while (cur <= last) {
        const key = cur.toISOString().split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push(ev);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [events]);

  // Selected date details
  const selectedDateObj = useMemo(() => {
    return new Date(selectedDateStr + "T00:00:00");
  }, [selectedDateStr]);

  const selectedDayOfWeek = selectedDateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const selectedDateEvents = eventsByDate[selectedDateStr] || [];
  const selectedDateAttendance = attendanceByDate[selectedDateStr] || [];

  // Today's scheduled timetable entries for this day of the week
  const scheduledSlotsForDay = useMemo(() => {
    return timetable
      .filter((t) => t.dayOfWeek === selectedDayOfWeek)
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  }, [timetable, selectedDayOfWeek]);

  // Merge scheduled timetable with actual attendance records for the selected day
  const dailyTimelineItems = useMemo(() => {
    const items: Array<{
      id: string;
      startTime: string;
      endTime: string;
      courseName: string;
      courseCode: string;
      facultyName: string;
      sessionType: string;
      status: "present" | "absent" | "od" | "none" | string;
      remarks?: string;
    }> = [];

    const matchedAttendanceIds = new Set<string>();

    scheduledSlotsForDay.forEach((slot) => {
      const slotCourseId = slot.courseId?._id?.toString();

      // Find corresponding attendance record for this course
      const att = selectedDateAttendance.find((a) => {
        const aCourseId = typeof a.courseId === "object" ? a.courseId?._id?.toString() : (typeof a.courseId === "string" ? a.courseId : undefined);
        return aCourseId && slotCourseId && aCourseId === slotCourseId;
      });

      if (att) matchedAttendanceIds.add(att._id);

      items.push({
        id: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        courseName: slot.courseId?.name || "Subject Session",
        courseCode: slot.courseId?.courseCode || "",
        facultyName: slot.facultyId?.name || "Faculty In-Charge",
        sessionType: slot.type || "lecture",
        status: att ? att.status : "none",
        remarks: att?.remarks,
      });
    });

    // Also include any attendance logged for this date that wasn't in the standard timetable
    selectedDateAttendance.forEach((att) => {
      if (matchedAttendanceIds.has(att._id)) return;
      const cObj = typeof att.courseId === "object" ? att.courseId : null;
      items.push({
        id: att._id,
        startTime: "--:--",
        endTime: "--:--",
        courseName: cObj?.title || cObj?.name || "Special Session",
        courseCode: cObj?.courseCode || "",
        facultyName: att.facultyId?.name || "Faculty In-Charge",
        sessionType: att.sessionType || "lecture",
        status: att.status,
        remarks: att.remarks,
      });
    });

    return items;
  }, [scheduledSlotsForDay, selectedDateAttendance]);

  const formattedSelectedDate = useMemo(() => {
    return selectedDateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDateObj]);

  if (loading) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="skeleton h-80 rounded-2xl" />
          <div className="skeleton h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Academic Calendar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Institutional schedule, academic milestones, and day-by-day session attendance timeline
          </p>
        </div>

        {/* ── Monthly Grid View ── */}
        <Card padding="md" className="border border-slate-200/80 dark:border-white/[0.06]">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.04]">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                id="prev-month-btn"
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors text-xs font-bold"
                title="Previous Month"
              >
                ←
              </button>
              <span className="text-sm font-bold text-slate-900 dark:text-white px-2 min-w-[150px] text-center">
                {currentMonthLabel}
              </span>
              <button
                onClick={handleNextMonth}
                id="next-month-btn"
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors text-xs font-bold"
                title="Next Month"
              >
                →
              </button>
              <button
                onClick={handleToday}
                id="today-btn"
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 font-medium transition-colors ml-1"
              >
                Today
              </button>
            </div>

            {/* Semantic Legend */}
            <div className="flex items-center gap-4 text-2xs text-slate-500 dark:text-slate-400 font-medium flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>On Duty</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Academic Event</span>
              </div>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 pt-3 pb-2 text-center text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank leading offsets */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-20 sm:h-24 rounded-xl bg-slate-50/40 dark:bg-white/[0.01]" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNumber = idx + 1;
              const dayString = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
              const isSelected = selectedDateStr === dayString;
              const isToday = new Date().toISOString().split("T")[0] === dayString;

              const dayAttendance = attendanceByDate[dayString] || [];
              const dayEvents = eventsByDate[dayString] || [];

              const presentCount = dayAttendance.filter((a) => a.status === "present" || a.status === "late").length;
              const absentCount = dayAttendance.filter((a) => a.status === "absent").length;
              const odCount = dayAttendance.filter((a) => a.status === "od").length;
              const totalSessions = dayAttendance.length;

              return (
                <button
                  key={dayString}
                  onClick={() => setSelectedDateStr(dayString)}
                  id={`calendar-day-${dayString}`}
                  className={`min-h-[80px] sm:min-h-[96px] rounded-xl p-1.5 text-left flex flex-col justify-between transition-all duration-150 relative border ${
                    isSelected
                      ? "border-neutral-900 dark:border-white ring-2 ring-neutral-900/10 dark:ring-white/20 bg-slate-50 dark:bg-white/[0.06]"
                      : "border-slate-100 dark:border-white/[0.04] hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isToday
                          ? "w-5 h-5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center text-[10px]"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {dayNumber}
                    </span>

                    {dayEvents.length > 0 && (
                      <span
                        className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"
                        title={dayEvents.map((e) => e.title).join(", ")}
                      />
                    )}
                  </div>

                  {/* Day Content Badges */}
                  <div className="space-y-1 mt-1">
                    {/* Academic Event Name if present */}
                    {dayEvents.slice(0, 1).map((ev) => (
                      <p
                        key={ev._id}
                        className="text-[10px] font-medium text-amber-700 dark:text-amber-300 truncate bg-amber-50 dark:bg-amber-950/30 px-1 rounded"
                      >
                        {ev.title}
                      </p>
                    ))}

                    {/* Semantic Grouped Attendance Indicator */}
                    {totalSessions > 0 && (
                      <div className="pt-0.5">
                        {presentCount === totalSessions ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {totalSessions === 1 ? "1 Present" : `${totalSessions}/${totalSessions} Present`}
                          </span>
                        ) : absentCount === totalSessions ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {totalSessions} Absent
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap">
                            {presentCount > 0 && (
                              <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                {presentCount}P
                              </span>
                            )}
                            {absentCount > 0 && (
                              <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                                {absentCount}A
                              </span>
                            )}
                            {odCount > 0 && (
                              <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
                                {odCount}OD
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* ── Daily Detail View ── */}
        <div id="daily-detail-view" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-2xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Daily Academic Timeline
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {formattedSelectedDate}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>{dailyTimelineItems.length} {dailyTimelineItems.length === 1 ? "session" : "sessions"} scheduled</span>
              {selectedDateAttendance.length > 0 && (
                <>
                  <span>•</span>
                  <span>{selectedDateAttendance.length} logged</span>
                </>
              )}
            </div>
          </div>

          {/* Academic Event Notices for Selected Day */}
          {selectedDateEvents.length > 0 && (
            <div className="space-y-2">
              {selectedDateEvents.map((ev) => (
                <div
                  key={ev._id}
                  className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{ev.title}</p>
                      <Badge variant="warning" size="sm" className="capitalize text-[10px]">
                        {ev.type}
                      </Badge>
                    </div>
                    {ev.description && (
                      <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1 leading-relaxed">
                        {ev.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Timetable + Session Attendance Roster */}
          <Card padding="none" className="border border-slate-200/80 dark:border-white/[0.06] overflow-hidden">
            {dailyTimelineItems.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No sessions scheduled on this date</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Enjoy your day or select another date on the calendar to view its schedule.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {dailyTimelineItems.map((item) => {
                  const isPresent = item.status === "present" || item.status === "late";
                  const isAbsent = item.status === "absent";
                  const isOD = item.status === "od";
                  const isNoRecord = item.status === "none" || !item.status;

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-white/[0.01] transition-colors"
                    >
                      {/* Left: Time and Session Details */}
                      <div className="flex items-start gap-4 min-w-0">
                        {/* Time Slot */}
                        <div className="text-left min-w-[90px] flex-shrink-0 pt-0.5">
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-none font-mono">
                            {item.startTime}–{item.endTime}
                          </p>
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400">
                            {item.sessionType}
                          </span>
                        </div>

                        {/* Subject and Faculty */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {item.courseName}
                            </h3>
                            {item.courseCode && (
                              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                                ({item.courseCode})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Faculty: {item.facultyName}
                          </p>
                          {item.remarks && (
                            <p className="text-2xs text-slate-400 dark:text-slate-500 mt-1 italic">
                              "{item.remarks}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Authoritative Attendance Status Indicator */}
                      <div className="flex-shrink-0 self-start sm:self-center">
                        {isPresent && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Present</span>
                          </span>
                        )}

                        {isAbsent && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                            <span>Absent</span>
                          </span>
                        )}

                        {isOD && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            <span>On Duty (OD)</span>
                          </span>
                        )}

                        {isNoRecord && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-500 dark:bg-white/[0.04] dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.04]">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span>No attendance recorded</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
