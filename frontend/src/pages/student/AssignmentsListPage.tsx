import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";

export default function AssignmentsListPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingAssignment, setSubmittingAssignment] = useState<any | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [assignRes, coursesRes, subRes] = await Promise.allSettled([
        api.get("/assignments"),
        api.get("/courses"),
        api.get("/assignments/my-submissions"),
      ]);
      if (assignRes.status === "fulfilled") setAssignments(assignRes.value.data.data || []);
      if (coursesRes.status === "fulfilled") setCourses(coursesRes.value.data.data || []);
      if (subRes.status === "fulfilled") setSubmissions(subRes.value.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment) return;

    setIsSubmitting(true);
    try {
      await api.post(`/assignments/${submittingAssignment._id}/submit`, {
        notes: submissionNotes,
      });
      alert("Assignment submitted successfully!");
      setSubmittingAssignment(null);
      setSubmissionNotes("");
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to submit assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  const now = new Date();
  const upcoming = assignments
    .filter((a) => new Date(a.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const past = assignments
    .filter((a) => new Date(a.dueDate) < now)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const getCourseName = (a: any) => {
    if (typeof a.courseId === "object" && a.courseId?.name) return a.courseId;
    const c = courses.find((c) => c._id === a.courseId);
    return c || { name: "Unknown Course", courseCode: "" };
  };

  const daysUntil = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Due Today";
    if (diff === 1) return "Due Tomorrow";
    if (diff <= 3) return `${diff} days left`;
    return `${diff} days`;
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Assignments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {upcoming.length} pending assignments · {submissions.length} submitted
          </p>
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Upcoming ({upcoming.length})
            </h2>
            <div className="space-y-3">
              {upcoming.map((a) => {
                const course = getCourseName(a);
                const daysLeft = Math.ceil((new Date(a.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysLeft <= 2;
                const sub = submissions.find((s) => (typeof s.assignmentId === "object" ? s.assignmentId._id : s.assignmentId) === a._id);

                return (
                  <Card key={a._id} padding="md" className={isUrgent && !sub ? "border-rose-300 dark:border-rose-500/30" : ""}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                          <Badge
                            variant={sub?.status === "graded" ? "success" : sub ? "info" : isUrgent ? "danger" : "warning"}
                            size="sm"
                          >
                            {sub?.status === "graded" ? `Graded: ${sub.marks}/${a.totalMarks}` : sub ? "Submitted" : daysUntil(a.dueDate)}
                          </Badge>
                          {a.submissionMethod && (
                            <Badge variant="neutral" size="sm" className="capitalize">
                              {a.submissionMethod === "online" ? "Online Submission" : a.submissionMethod}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                          {course.courseCode || ""} — {course.name || ""}
                        </p>
                        {(a.instructions || a.description) && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                            {a.instructions || a.description}
                          </p>
                        )}

                        {/* Question Paper / Attachments */}
                        {a.attachments && a.attachments.length > 0 && (
                          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                            <span className="text-2xs font-semibold text-slate-400">Attached Materials:</span>
                            {a.attachments.map((att: any, idx: number) => {
                              let parsed = att;
                              if (typeof att === "string" && att.startsWith("{")) {
                                try { parsed = JSON.parse(att); } catch {}
                              }
                              const name = typeof parsed === "object" ? parsed.name || parsed.filename : String(parsed);
                              const fileKey = typeof parsed === "object" ? parsed.key || parsed.path || parsed.filename : String(parsed);
                              const downloadUrl = `/api/v1/assignments/attachments/download?file=${encodeURIComponent(fileKey)}&assignmentId=${a._id}`;

                              return (
                                <a
                                  key={idx}
                                  href={downloadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                                >
                                  <span>📄</span>
                                  <span className="truncate max-w-[200px]">{name}</span>
                                  <span>↓ Download</span>
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {a.totalMarks} <span className="text-gray-400 font-normal text-xs">marks</span>
                        </p>
                        <p className="text-2xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                          Due: {new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-white/[0.04] text-xs">
                      <Badge variant="neutral" size="sm">
                        Status: {a.status}
                      </Badge>

                      <div className="flex items-center gap-2">
                        {!sub && (
                          <Button variant="primary" size="sm" onClick={() => setSubmittingAssignment(a)}>
                            Submit solution
                          </Button>
                        )}
                        {course._id && (
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/subjects/${course._id}/assignments`)}>
                            View workspace
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Past Assignments ({past.length})
            </h2>
            <div className="space-y-2">
              {past.map((a) => {
                const course = getCourseName(a);
                const sub = submissions.find((s) => (typeof s.assignmentId === "object" ? s.assignmentId._id : s.assignmentId) === a._id);
                return (
                  <Card key={a._id} padding="sm">
                    <div className="flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{a.title}</p>
                        <p className="text-2xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {course.courseCode} · Due {new Date(a.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={sub ? "success" : "danger"} size="sm">
                          {sub ? "Submitted" : "Missed"}
                        </Badge>
                        <span className="font-mono text-2xs text-gray-400">{a.totalMarks} marks</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {assignments.length === 0 && (
          <EmptyState
            title="No assignments posted"
            description="Course assignments will appear here when posted by your faculty."
          />
        )}
      </div>

      {/* Submission Modal */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="surface-card rounded-2xl max-w-md w-full p-6 shadow-overlay animate-scale-in space-y-4 border border-gray-200/60 dark:border-white/[0.06]">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Submit Assignment Work</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{submittingAssignment.title}</p>
            </div>
            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Submission Notes / Text Solution
                </label>
                <textarea
                  required
                  rows={4}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Enter your answer, explanation, or repository link…"
                  className="input"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setSubmittingAssignment(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  Confirm submission
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
