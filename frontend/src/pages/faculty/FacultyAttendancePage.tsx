import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { FacultyContextBar } from "../../components/faculty/FacultyContextBar";
import { teachingAssignmentService, TeachingContext } from "../../services/teachingAssignment";

export default function FacultyAttendancePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedContext, setSelectedContext] = useState<TeachingContext | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSem, setSelectedSem] = useState<string>("all");

  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [sessionType, setSessionType] = useState<string>("lecture");
  const [students, setStudents] = useState<any[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [existingRecordsFound, setExistingRecordsFound] = useState(false);
  const [correctionReason, setCorrectionReason] = useState("");

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch authorized courses
  useEffect(() => {
    setLoadingCourses(true);
    api.get("/courses")
      .then((res) => {
        const list = res.data.data || [];
        setCourses(list);
        if (list.length > 0) {
          const searchParams = new URLSearchParams(location.search);
          const cParam = searchParams.get("courseId");
          if (cParam && list.some((c: any) => c._id === cParam)) {
            setSelectedCourseId(cParam);
          } else {
            setSelectedCourseId(list[0]._id);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingCourses(false));
  }, [location.search]);

  // Context filters
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => { if (c.academicYear) set.add(c.academicYear); });
    return Array.from(set);
  }, [courses]);

  const availableSemesters = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => { if (c.semester) set.add(c.semester); });
    return Array.from(set);
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (selectedYear !== "all" && c.academicYear !== selectedYear) return false;
      if (selectedSem !== "all" && c.semester !== selectedSem) return false;
      return true;
    });
  }, [courses, selectedYear, selectedSem]);

  useEffect(() => {
    if (filteredCourses.length > 0 && !filteredCourses.some((c) => c._id === selectedCourseId)) {
      setSelectedCourseId(filteredCourses[0]._id);
    }
  }, [filteredCourses, selectedCourseId]);

  const selectedCourse = useMemo(() => {
    return courses.find((c) => c._id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  // Load students for active authoritative context
  const loadStudentsAndAttendance = useCallback(async () => {
    const courseIdToUse = selectedContext?.courseId || selectedCourseId;
    if (!courseIdToUse) return;
    setLoadingStudents(true);
    try {
      let studentList: any[] = [];
      if (selectedContext) {
        const cRes = await teachingAssignmentService.getContextStudents({
          courseId: selectedContext.courseId,
          section: selectedContext.section,
          batchId: selectedContext.batchId
        });
        studentList = (cRes.data.data?.students || []).map((s: any) => ({
          _id: s.userId || s.studentId,
          studentId: s.studentId,
          name: s.name,
          email: s.email,
          rollNumber: s.registerNumber || "N/A",
          section: s.section || selectedContext.section,
        }));
      } else {
        const sRes = await api.get(`/courses/${courseIdToUse}/students`);
        studentList = sRes.data.data || [];
      }

      const attendanceRes = await api.get(`/attendance?courseId=${courseIdToUse}&date=${date}`);
      const records: any[] = attendanceRes.data.data || [];

      setStudents(studentList);

      if (records.length > 0) {
        setExistingRecordsFound(true);
        const sMap: Record<string, string> = {};
        const rMap: Record<string, string> = {};

        records.forEach((r: any) => {
          const sid = r.studentId?._id ? r.studentId._id.toString() : r.studentId?.toString();
          if (sid) {
            sMap[sid] = r.status;
            if (r.remarks) rMap[sid] = r.remarks;
          }
        });

        // Default any student missing from logged record to present
        studentList.forEach((st) => {
          if (!sMap[st._id]) sMap[st._id] = "present";
        });

        setStatusMap(sMap);
        setRemarksMap(rMap);
        if (records[0]?.sessionType) setSessionType(records[0].sessionType);
      } else {
        setExistingRecordsFound(false);
        const sMap: Record<string, string> = {};
        studentList.forEach((st) => { sMap[st._id] = "present"; });
        setStatusMap(sMap);
        setRemarksMap({});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedContext, selectedCourseId, date]);

  useEffect(() => {
    loadStudentsAndAttendance();
  }, [loadStudentsAndAttendance]);

  const setAllStatus = (st: string) => {
    const sMap: Record<string, string> = {};
    students.forEach((s) => { sMap[s._id] = st; });
    setStatusMap(sMap);
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0 || !selectedCourseId) return;

    setSaving(true);
    try {
      const records = students.map((st) => ({
        studentId: st._id,
        status: statusMap[st._id] || "present",
        remarks: remarksMap[st._id]?.trim() || undefined,
      }));

      await api.post("/attendance/bulk", {
        courseId: selectedCourseId,
        date,
        sessionType,
        records,
        reason: correctionReason.trim() || undefined,
      });

      alert(
        existingRecordsFound
          ? `Attendance corrected for ${students.length} students on ${date}!`
          : `Attendance marked for ${students.length} students on ${date}!`
      );

      setExistingRecordsFound(true);
      setCorrectionReason("");
      loadStudentsAndAttendance();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter((st) => (statusMap[st._id] || "present") === "present").length;
  const absentCount = students.filter((st) => statusMap[st._id] === "absent").length;
  const odCount = students.filter((st) => statusMap[st._id] === "od").length;

  if (loadingCourses) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="skeleton h-24 rounded-2xl" />
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
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Attendance Workspace</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Authoritative session attendance registration, retroactive corrections, and statutory compliance tracking
          </p>
        </div>

        {/* ── Authoritative Teaching Context Selector ── */}
        <FacultyContextBar
          selectedContext={selectedContext}
          onSelectContext={(ctx) => {
            setSelectedContext(ctx);
            if (ctx) setSelectedCourseId(ctx.courseId);
          }}
        />

        {/* ── Attendance Session Form ── */}
        <Card padding="md" className="border border-slate-200/80 dark:border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.04]">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {existingRecordsFound ? "Edit Submitted Attendance" : "Mark Session Attendance"}
              </h2>
              {existingRecordsFound ? (
                <Badge variant="warning" size="sm">
                  Existing Record · Editable
                </Badge>
              ) : (
                <Badge variant="success" size="sm">
                  New Session
                </Badge>
              )}
            </div>

            <Button
              variant="primary"
              size="sm"
              disabled={saving || students.length === 0}
              onClick={handleSaveAttendance}
            >
              {saving ? "Saving…" : existingRecordsFound ? "Save Attendance Corrections" : "Submit Attendance"}
            </Button>
          </div>

          {/* Session Configuration Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Session Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input text-xs py-2 w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Session Type</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="input text-xs py-2 w-full"
              >
                <option value="lecture">Lecture</option>
                <option value="lab">Laboratory Session</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Quick Bulk Actions</label>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setAllStatus("present")} className="flex-1">
                  All Present
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setAllStatus("absent")} className="flex-1">
                  All Absent
                </Button>
              </div>
            </div>
          </div>

          {/* Reason for correction if existing record */}
          {existingRecordsFound && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
              <label className="block text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                Reason for Attendance Correction (Recorded in Institutional Audit Log)
              </label>
              <input
                type="text"
                placeholder="e.g. Medical leave approved, student was on official institutional duty (OD), clerical entry correction"
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="input text-xs py-2 w-full"
              />
            </div>
          )}

          {/* Live Roster Summary */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.04] text-xs font-medium">
            <span className="text-slate-500">Session Summary:</span>
            <span className="text-emerald-600 font-bold">{presentCount} Present</span>
            <span className="text-rose-600 font-bold">{absentCount} Absent</span>
            <span className="text-sky-600 font-bold">{odCount} On Duty</span>
            <span className="text-slate-400 font-mono">({students.length} total enrolled)</span>
          </div>
        </Card>

        {/* ── Student Attendance Roster ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Student Attendance Roster
            </h2>
            <span className="text-xs text-slate-400 font-mono">{students.length} students</span>
          </div>

          {loadingStudents ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : students.length === 0 ? (
            <EmptyState
              title="No students found"
              description="No students are enrolled in this course context."
            />
          ) : (
            <Card padding="none" className="border border-slate-200/80 dark:border-white/[0.06] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th className="px-6 py-3.5">Student Information</th>
                      <th>Register / Roll No</th>
                      <th className="text-center">Session Status</th>
                      <th className="px-6">Remarks / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((st) => {
                      const currentStatus = statusMap[st._id] || "present";
                      return (
                        <tr key={st._id}>
                          <td className="px-6 py-3.5">
                            <p className="font-semibold text-slate-900 dark:text-white">{st.name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{st.email}</p>
                          </td>
                          <td className="font-mono text-xs text-slate-600 dark:text-slate-300 font-medium">
                            {st.rollNumber || "N/A"}
                          </td>
                          <td className="text-center">
                            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] gap-1">
                              <button
                                type="button"
                                onClick={() => setStatusMap((prev) => ({ ...prev, [st._id]: "present" }))}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  currentStatus === "present"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-slate-500 hover:text-slate-900"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => setStatusMap((prev) => ({ ...prev, [st._id]: "absent" }))}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  currentStatus === "absent"
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "text-slate-500 hover:text-slate-900"
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => setStatusMap((prev) => ({ ...prev, [st._id]: "od" }))}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                  currentStatus === "od"
                                    ? "bg-sky-600 text-white shadow-xs"
                                    : "text-slate-500 hover:text-slate-900"
                                }`}
                              >
                                OD
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <input
                              type="text"
                              placeholder="Optional remark…"
                              value={remarksMap[st._id] || ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setRemarksMap((prev) => ({ ...prev, [st._id]: v }));
                              }}
                              className="input text-xs py-1 px-2 w-full max-w-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
