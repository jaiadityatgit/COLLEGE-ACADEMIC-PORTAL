import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { FacultyContextBar } from "../../components/faculty/FacultyContextBar";
import { teachingAssignmentService, TeachingContext } from "../../services/teachingAssignment";

interface EnrolledStudent {
  _id: string;
  studentId?: string;
  name: string;
  email: string;
  rollNumber?: string;
  section?: string;
  academicYear?: string;
  totalClasses?: number;
  attendedCount?: number;
  percentage?: number;
}

export default function FacultyStudentsPage() {
  const { studentId: paramStudentId } = useParams<{ studentId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSem, setSelectedSem] = useState<string>("all");

  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected student for detail workspace
  const [activeStudentId, setActiveStudentId] = useState<string | null>(paramStudentId || null);

  // Sync param with state
  useEffect(() => {
    if (paramStudentId) {
      setActiveStudentId(paramStudentId);
    }
  }, [paramStudentId]);

  // Authoritative Teaching Context state
  const [selectedContext, setSelectedContext] = useState<TeachingContext | null>(null);
  const [contextCourse, setContextCourse] = useState<any>(null);

  // Fetch authorized courses for faculty fallback
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
      .catch((err) => console.error("Error loading faculty courses", err))
      .finally(() => setLoadingCourses(false));
  }, [location.search]);

  // Fetch students for authoritative active context
  const fetchStudentsForContext = useCallback(async () => {
    if (!selectedContext) return;
    setLoadingStudents(true);
    try {
      const res = await teachingAssignmentService.getContextStudents({
        courseId: selectedContext.courseId,
        section: selectedContext.section,
        batchId: selectedContext.batchId,
      });

      const data = res.data.data;
      if (data?.course) {
        setContextCourse(data.course);
      }

      const list: EnrolledStudent[] = (data.students || []).map((s: any) => ({
        _id: s.userId || s.studentId,
        studentId: s.studentId,
        name: s.name,
        email: s.email,
        rollNumber: s.registerNumber || "N/A",
        section: s.section || selectedContext.section,
        academicYear: s.academicYear || selectedContext.academicYear,
        percentage: s.attendancePercentage !== undefined ? Math.round(s.attendancePercentage) : undefined,
      }));

      setStudents(list);
    } catch (err) {
      console.error("Error fetching context students", err);
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedContext]);

  useEffect(() => {
    fetchStudentsForContext();
  }, [fetchStudentsForContext]);

  // Filter students by search
  const displayedStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  const handleOpenStudentDetail = (stId: string) => {
    setActiveStudentId(stId);
    navigate(`/faculty/students/${stId}?courseId=${selectedCourseId}`);
  };

  const handleBackToRoster = () => {
    setActiveStudentId(null);
    navigate(`/faculty/students?courseId=${selectedCourseId}`);
  };

  const selectedCourse = useMemo(() => {
    return contextCourse || courses.find((c) => c._id === selectedCourseId) || null;
  }, [contextCourse, courses, selectedCourseId]);

  const activeStudent = useMemo(() => {
    return students.find((s) => s._id === activeStudentId) || null;
  }, [students, activeStudentId]);

  if (loadingCourses) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="skeleton h-28 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Render Student Detail Workspace if student is selected ──
  if (activeStudentId && activeStudent && selectedCourse) {
    return (
      <FacultyStudentDetailWorkspace
        student={activeStudent}
        course={selectedCourse}
        onBack={handleBackToRoster}
        onRefreshSummary={fetchStudentsForContext}
      />
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Student Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Authorized student roster, academic profiles, attendance verification, and gradebook management
          </p>
        </div>

        {/* ── Authoritative Teaching Context Selector ── */}
        <FacultyContextBar
          selectedContext={selectedContext}
          onSelectContext={(ctx) => setSelectedContext(ctx)}
        />

        {/* ── Active Course Roster ── */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {selectedCourse ? selectedCourse.name : "Course"} Roster
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedCourse?.courseCode} · {students.length} enrolled {students.length === 1 ? "student" : "students"}
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by student name or roll number…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input text-xs py-2 px-3 w-full"
              />
            </div>
          </div>

          {loadingStudents ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-16 rounded-2xl" />
              ))}
            </div>
          ) : displayedStudents.length === 0 ? (
            <EmptyState
              title={students.length === 0 ? "No students enrolled" : "No matching students found"}
              description={
                students.length === 0
                  ? "There are no students currently enrolled in this course context."
                  : "No students matched your search query. Try adjusting your search term."
              }
            />
          ) : (
            <Card padding="none" className="border border-slate-200/80 dark:border-white/[0.06] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th className="px-6 py-3.5">Student Information</th>
                      <th>Register / Roll No</th>
                      <th>Section</th>
                      <th className="text-center">Attendance Compliance</th>
                      <th className="text-right px-6">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedStudents.map((st) => {
                      const pct = st.percentage;
                      const isHealthy = pct !== undefined && pct >= 75;
                      const isWarning = pct !== undefined && pct >= 65 && pct < 75;
                      const isCritical = pct !== undefined && pct < 65;

                      return (
                        <tr
                          key={st._id}
                          onClick={() => handleOpenStudentDetail(st._id)}
                          className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900 dark:text-white leading-snug">{st.name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{st.email}</p>
                          </td>
                          <td>
                            <span className="font-mono text-xs text-slate-700 dark:text-slate-300 font-medium">
                              {st.rollNumber}
                            </span>
                          </td>
                          <td>
                            {st.section ? (
                              <span className="px-2 py-0.5 rounded-md text-2xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                                Section {st.section}
                              </span>
                            ) : (
                              <span className="text-2xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="text-center">
                            {pct !== undefined ? (
                              <Badge
                                variant={isHealthy ? "success" : isWarning ? "warning" : "danger"}
                                size="sm"
                                dot
                              >
                                {pct}%
                              </Badge>
                            ) : (
                              <span className="text-xs text-slate-400 font-mono">No records</span>
                            )}
                          </td>
                          <td className="text-right px-6 py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenStudentDetail(st._id);
                              }}
                            >
                              Open Workspace →
                            </Button>
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

interface WorkspaceProps {
  student: EnrolledStudent;
  course: any;
  onBack: () => void;
  onRefreshSummary: () => void;
}

function FacultyStudentDetailWorkspace({ student, course, onBack, onRefreshSummary }: WorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "marks" | "assignments">("overview");

  // Attendance history
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);
  const [correctStatus, setCorrectStatus] = useState<string>("present");
  const [correctReason, setCorrectReason] = useState("");
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Grades history
  const [grades, setGrades] = useState<any[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any | null>(null);
  const [newMarkVal, setNewMarkVal] = useState<string>("");
  const [markReason, setMarkReason] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState(false);

  // Assignments & Submissions
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<any | null>(null);
  const [awardedMarks, setAwardedMarks] = useState("");
  const [gradingFeedback, setGradingFeedback] = useState("");
  const [savingSubmissionGrade, setSavingSubmissionGrade] = useState(false);

  // Load student records for this course
  const loadAttendance = useCallback(async () => {
    setLoadingAttendance(true);
    try {
      const res = await api.get(`/attendance?courseId=${course._id}&studentId=${student._id}`);
      setAttendanceRecords(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttendance(false);
    }
  }, [course._id, student._id]);

  const loadGrades = useCallback(async () => {
    setLoadingGrades(true);
    try {
      const res = await api.get(`/gradebook?courseId=${course._id}&studentId=${student._id}`);
      setGrades(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGrades(false);
    }
  }, [course._id, student._id]);

  const loadSubmissions = useCallback(async () => {
    setLoadingSubmissions(true);
    try {
      // Fetch course assignments then find submissions
      const assignRes = await api.get(`/assignments?courseId=${course._id}`);
      const courseAssignments: any[] = assignRes.data.data || [];

      // Fetch submissions for each assignment
      const allSubmissions: any[] = [];
      await Promise.all(
        courseAssignments.map(async (a) => {
          try {
            const subRes = await api.get(`/assignments/${a._id}/submissions`);
            const subs: any[] = subRes.data.data || [];
            const studentSub = subs.find((s) => {
              const sid = s.studentId?._id ? s.studentId._id.toString() : s.studentId?.toString();
              return sid === student._id;
            });
            if (studentSub) {
              allSubmissions.push({ ...studentSub, assignmentTitle: a.title, assignmentMaxMarks: a.totalMarks, assignmentDueDate: a.dueDate });
            }
          } catch { /* ignore individual failures */ }
        })
      );
      setSubmissions(allSubmissions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [course._id, student._id]);

  useEffect(() => {
    if (activeTab === "attendance") loadAttendance();
    if (activeTab === "marks") loadGrades();
    if (activeTab === "assignments") loadSubmissions();
    if (activeTab === "overview") {
      loadAttendance();
      loadGrades();
    }
  }, [activeTab, loadAttendance, loadGrades, loadSubmissions]);

  // Attendance Correction Handler
  const handleCorrectAttendance = async (rec: any) => {
    setSavingAttendance(true);
    try {
      await api.post("/attendance", {
        studentId: student._id,
        courseId: course._id,
        date: rec.date,
        status: correctStatus,
        remarks: correctReason.trim() || undefined,
        reason: correctReason.trim() || "Faculty academic attendance correction",
      });

      alert(`Attendance for ${student.name} on ${rec.date} updated to ${correctStatus.toUpperCase()}!`);
      setEditingAttendanceId(null);
      setCorrectReason("");
      loadAttendance();
      onRefreshSummary();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to correct attendance.");
    } finally {
      setSavingAttendance(false);
    }
  };

  // Grade Correction Handler
  const handleSaveGradeCorrection = async () => {
    if (!editingGrade) return;
    const num = Number(newMarkVal);
    if (isNaN(num) || num < 0 || num > editingGrade.maxMarks) {
      alert(`Marks must be between 0 and ${editingGrade.maxMarks}`);
      return;
    }

    setSavingGrade(true);
    try {
      await api.post("/gradebook", {
        studentId: student._id,
        courseId: course._id,
        title: editingGrade.title,
        marksObtained: num,
        maxMarks: editingGrade.maxMarks,
        remarks: markReason.trim() || undefined,
        reason: markReason.trim() || "Faculty academic mark correction",
      });

      alert(`Mark for "${editingGrade.title}" successfully corrected to ${num}/${editingGrade.maxMarks}!`);
      setEditingGrade(null);
      setNewMarkVal("");
      setMarkReason("");
      loadGrades();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to update grade.");
    } finally {
      setSavingGrade(false);
    }
  };

  // Submission Grade Handler
  const handleSaveSubmissionGrade = async () => {
    if (!gradingSubmission) return;
    const num = Number(awardedMarks);
    if (isNaN(num) || num < 0) {
      alert("Please enter a valid marks value");
      return;
    }

    setSavingSubmissionGrade(true);
    try {
      await api.patch(`/assignments/submissions/${gradingSubmission._id}/grade`, {
        marks: num,
        feedback: gradingFeedback.trim() || undefined,
      });

      alert(`Submission for "${gradingSubmission.assignmentTitle}" graded: ${num} marks awarded!`);
      setGradingSubmission(null);
      setAwardedMarks("");
      setGradingFeedback("");
      loadSubmissions();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save submission grade.");
    } finally {
      setSavingSubmissionGrade(false);
    }
  };

  const totalClasses = attendanceRecords.length;
  const attendedClasses = attendanceRecords.filter((r) => r.status === "present" || r.status === "late" || r.status === "od").length;
  const attendancePct = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : student.percentage ?? 0;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Navigation Breadcrumb */}
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <span>← Back to Student Roster</span>
          </button>
        </div>

        {/* Student Workspace Header */}
        <Card padding="md" className="border border-slate-200/80 dark:border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{student.name}</h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-semibold">
                  {student.rollNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {student.email} · Enrolled in <strong className="text-slate-700 dark:text-slate-300">{course.name} ({course.courseCode})</strong>
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Attendance</span>
                <p className={`text-lg font-bold ${attendancePct >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {attendancePct}%
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Sessions</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {attendedClasses}/{totalClasses}
                </p>
              </div>
            </div>
          </div>

          {/* Segmented Workspace Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.04]">
            {[
              { key: "overview", label: "Overview" },
              { key: "attendance", label: "Attendance Correction" },
              { key: "marks", label: "Marks Correction" },
              { key: "assignments", label: "Submissions & Grading" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.key
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* ── Tab Content ── */}

        {/* 1. Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card padding="md">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Compliance Rate</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{attendancePct}%</p>
                <p className="text-xs text-slate-400 mt-1">{attendancePct >= 75 ? "Meets institutional requirement" : "Below statutory 75%"}</p>
              </Card>
              <Card padding="md">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Total Assessments</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{grades.length}</p>
                <p className="text-xs text-slate-400 mt-1">Recorded in canonical gradebook</p>
              </Card>
              <Card padding="md">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Assignment Submissions</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{submissions.length}</p>
                <p className="text-xs text-slate-400 mt-1">Submitted problem sets</p>
              </Card>
            </div>

            <Card padding="md">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Faculty Academic Authority</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                You are authorized to review and correct academic records for {student.name} strictly within the bounds of <strong>{course.name}</strong>.
                All updates made here record audit trails in the institutional compliance registry and immediately reflect on the student's portal.
              </p>
            </Card>
          </div>
        )}

        {/* 2. Attendance Correction Tab */}
        {activeTab === "attendance" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Session Attendance Records</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Review logged presence and apply authorized retroactive status corrections
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">{attendanceRecords.length} sessions logged</span>
            </div>

            {loadingAttendance ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
              </div>
            ) : attendanceRecords.length === 0 ? (
              <EmptyState
                title="No attendance records"
                description="No attendance has been logged for this student in this course yet."
              />
            ) : (
              <Card padding="none" className="border border-slate-200/80 dark:border-white/[0.06] overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {attendanceRecords.map((rec) => {
                    const isEditing = editingAttendanceId === rec._id;
                    const st = String(rec.status).toLowerCase();

                    return (
                      <div key={rec._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{rec.date}</span>
                            <span className="text-xs capitalize px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400">
                              {rec.sessionType || "lecture"}
                            </span>
                          </div>
                          {rec.remarks && (
                            <p className="text-xs text-slate-400 mt-0.5 italic">"{rec.remarks}"</p>
                          )}
                        </div>

                        {/* Status / Inline Correction Form */}
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <select
                              value={correctStatus}
                              onChange={(e) => setCorrectStatus(e.target.value)}
                              className="input text-xs py-1 px-2"
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="od">On Duty (OD)</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Reason for correction…"
                              value={correctReason}
                              onChange={(e) => setCorrectReason(e.target.value)}
                              className="input text-xs py-1 px-2 w-44"
                            />
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={savingAttendance}
                              onClick={() => handleCorrectAttendance(rec)}
                            >
                              {savingAttendance ? "Saving…" : "Save"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingAttendanceId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={st === "present" || st === "late" ? "success" : st === "absent" ? "danger" : "info"}
                              size="sm"
                            >
                              {st === "od" ? "On Duty" : st}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingAttendanceId(rec._id);
                                setCorrectStatus(rec.status);
                                setCorrectReason("");
                              }}
                            >
                              Correct Status
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* 3. Marks Correction Tab */}
        {activeTab === "marks" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Internal Assessment Marks</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  View and correct internal assessment scores recorded in the authoritative gradebook
                </p>
              </div>
            </div>

            {loadingGrades ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
              </div>
            ) : grades.length === 0 ? (
              <EmptyState
                title="No marks recorded"
                description="No assessment marks have been posted for this student in this course yet."
              />
            ) : (
              <Card padding="none" className="border border-slate-200/80 dark:border-white/[0.06] overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {grades.map((g) => {
                    const isEditing = editingGrade?._id === g._id;
                    return (
                      <div key={g._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">{g.title}</p>
                          <p className="text-xs text-slate-400 capitalize mt-0.5">
                            {g.type || "Internal Assessment"} {g.weightage ? `· ${g.weightage}% weightage` : ""}
                          </p>
                        </div>

                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={g.maxMarks}
                                value={newMarkVal}
                                onChange={(e) => setNewMarkVal(e.target.value)}
                                className="input text-xs py-1 px-2 w-20 text-center font-bold"
                              />
                              <span className="text-xs text-slate-400 font-mono">/{g.maxMarks}</span>
                            </div>
                            <input
                              type="text"
                              placeholder="Reason for mark change…"
                              value={markReason}
                              onChange={(e) => setMarkReason(e.target.value)}
                              className="input text-xs py-1 px-2 w-44"
                            />
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={savingGrade}
                              onClick={handleSaveGradeCorrection}
                            >
                              {savingGrade ? "Saving…" : "Save"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingGrade(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                              {g.marksObtained} / {g.maxMarks}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingGrade(g);
                                setNewMarkVal(String(g.marksObtained));
                                setMarkReason("");
                              }}
                            >
                              Edit Mark
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* 4. Submissions & Grading Tab */}
        {activeTab === "assignments" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Assignment Submissions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Review submitted solutions, inspect attachments, and award grades
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">{submissions.length} submissions</span>
            </div>

            {loadingSubmissions ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
              </div>
            ) : submissions.length === 0 ? (
              <EmptyState
                title="No submissions found"
                description="This student has not submitted any assignments for this course yet."
              />
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => {
                  const isGrading = gradingSubmission?._id === sub._id;
                  const isGraded = sub.status === "graded" || sub.marks !== undefined;

                  return (
                    <Card key={sub._id} padding="md">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{sub.assignmentTitle}</h4>
                            <Badge variant={isGraded ? "success" : "info"} size="sm">
                              {isGraded ? `Graded: ${sub.marks}/${sub.assignmentMaxMarks}` : "Submitted"}
                            </Badge>
                          </div>
                          <p className="text-2xs text-slate-400 mt-1 font-mono">
                            Submitted: {new Date(sub.submittedAt || sub.createdAt).toLocaleString()}
                          </p>

                          {sub.notes && (
                            <div className="mt-2.5 p-3 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Student Answer / Notes</span>
                              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{sub.notes}</p>
                            </div>
                          )}

                          {/* Attached files */}
                          {sub.files && sub.files.length > 0 && (
                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                              {sub.files.map((f: any, idx: number) => {
                                const fname = typeof f === "object" ? f.name || f.filename : String(f);
                                const fileKey = typeof f === "object" ? f.key || f.path || f.filename : String(f);
                                const downloadUrl = `/api/v1/assignments/submission-files/download?file=${encodeURIComponent(fileKey)}&submissionId=${sub._id}`;

                                return (
                                  <a
                                    key={idx}
                                    href={downloadUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                                  >
                                    <span>📎</span>
                                    <span className="truncate max-w-[200px]">{fname}</span>
                                    <span>↓</span>
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0">
                          {isGrading ? (
                            <div className="flex flex-col gap-2 w-56">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  placeholder="Marks"
                                  value={awardedMarks}
                                  onChange={(e) => setAwardedMarks(e.target.value)}
                                  className="input text-xs py-1 px-2 w-20 text-center font-bold"
                                />
                                <span className="text-xs text-slate-400 font-mono">/{sub.assignmentMaxMarks}</span>
                              </div>
                              <input
                                type="text"
                                placeholder="Feedback for student…"
                                value={gradingFeedback}
                                onChange={(e) => setGradingFeedback(e.target.value)}
                                className="input text-xs py-1 px-2"
                              />
                              <div className="flex items-center gap-2 pt-1">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={savingSubmissionGrade}
                                  onClick={handleSaveSubmissionGrade}
                                >
                                  {savingSubmissionGrade ? "Saving…" : "Save Grade"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setGradingSubmission(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant={isGraded ? "secondary" : "primary"}
                              size="sm"
                              onClick={() => {
                                setGradingSubmission(sub);
                                setAwardedMarks(sub.marks !== undefined ? String(sub.marks) : "");
                                setGradingFeedback(sub.feedback || "");
                              }}
                            >
                              {isGraded ? "Edit Grade" : "Grade Submission"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
