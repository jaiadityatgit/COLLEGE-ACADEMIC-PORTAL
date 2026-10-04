import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { assignmentService } from "../../services/assignment";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";

interface CourseDetail {
  _id: string;
  name: string;
  courseCode: string;
  credits: number;
  courseType: string;
  semester: string;
  description: string;
  syllabus: string[];
  facultyIds: { _id: string; name: string; designation?: string }[];
  notebookId?: string;
}

interface SourceItem {
  _id: string;
  name: string;
  type: string;
  category: string;
  status: string;
  createdAt: string;
  fileSize?: number;
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "materials", label: "Course Materials" },
  { key: "assignments", label: "Assignments" },
  { key: "attendance", label: "Attendance" },
  { key: "announcements", label: "Announcements" },
];

export default function SubjectPage() {
  const { subjectId, tab } = useParams<{ subjectId: string; tab?: string }>();
  const activeTab = tab || "overview";
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subjectId) return;
    setLoading(true);
    api.get(`/courses/${subjectId}`)
      .then((res) => setCourse(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subjectId]);

  const setTab = (t: string) => {
    navigate(`/subjects/${subjectId}/${t}`);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/subjects");
    }
  };

  if (loading || !course) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-8 w-64 rounded-lg" />
          <div className="skeleton h-12 w-full rounded-xl" />
          <div className="skeleton h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const isMaterialTab = ["materials", "notes", "ppts", "lab-manual", "previous-papers", "references", "other"].includes(activeTab);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Subject Header Banner ── */}
      <div className="surface-card border-b border-gray-200/60 dark:border-white/[0.04] px-6 lg:px-8 py-5 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2 text-xs">
          <button onClick={handleBack} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
            ← Subjects Directory
          </button>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-gray-500 dark:text-gray-400 font-mono">{course.courseCode}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{course.name}</h1>
              <Badge variant={course.courseType === "lab" ? "success" : "info"} size="sm">
                {course.courseType === "lab" ? "Laboratory" : "Theory"}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {course.courseCode} · {course.credits} Credits
              {course.facultyIds?.length > 0 && ` · Faculty: ${course.facultyIds.map(f => typeof f === "object" ? f.name : "").filter(Boolean).join(", ")}`}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-xs ${course.courseType === "lab" ? "bg-emerald-600" : "bg-neutral-900"}`}>
              {course.courseCode?.slice(-2) || "??"}
            </div>
          </div>
        </div>

        {/* ── Segmented Navigation Tabs ── */}
        <div className="flex gap-2 mt-6 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => {
            const isActive = activeTab === t.key || (t.key === "materials" && isMaterialTab);
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-auto p-6 lg:p-8 surface-page">
        {activeTab === "overview" && <OverviewTab course={course} />}
        {isMaterialTab && (
          <StudentCourseMaterialsTab
            subjectId={subjectId!}
            course={course}
            initialCategory={
              activeTab === "notes" ? "lecture_notes" :
              activeTab === "ppts" ? "ppt" :
              activeTab === "lab-manual" ? "lab_manual" :
              activeTab === "previous-papers" ? "previous_paper" :
              activeTab === "references" ? "reference_book" :
              activeTab === "other" ? "other" : "all"
            }
          />
        )}
        {activeTab === "assignments" && <AssignmentsTab subjectId={subjectId!} course={course} />}
        {activeTab === "attendance" && <AttendanceTab subjectId={subjectId!} />}
        {activeTab === "announcements" && <AnnouncementsTab subjectId={subjectId!} />}
      </div>
    </div>
  );
}

function OverviewTab({ course }: { course: CourseDetail }) {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      {course.description && (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Description</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{course.description}</p>
        </Card>
      )}

      {course.syllabus && course.syllabus.length > 0 && (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Syllabus & Modules</h3>
          <div className="space-y-2">
            {course.syllabus.map((topic, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/60 dark:bg-white/[0.02]">
                <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 mt-0.5 font-medium">{topic}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {course.facultyIds?.length > 0 && (
        <Card padding="md">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Faculty Instructors</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {course.facultyIds.map((f) => (
              <div key={f._id} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/60 dark:bg-white/[0.02]">
                <div className="w-9 h-9 rounded-lg bg-neutral-900 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {(typeof f === "object" ? f.name : "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{typeof f === "object" ? f.name : "Faculty"}</p>
                  {f.designation && <p className="text-xs text-slate-500 dark:text-slate-400">{f.designation}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card padding="md">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Workspace Sections</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Materials", desc: "Notes, PPTs & manuals", tab: "materials" },
            { label: "Assignments", desc: "Problem sets & tasks", tab: "assignments" },
            { label: "Attendance", desc: "Records & metrics", tab: "attendance" },
            { label: "Announcements", desc: "Notices & updates", tab: "announcements" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(`/subjects/${course._id}/${action.tab}`)}
              className="text-left p-4 rounded-xl border border-slate-200/70 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all group"
            >
              <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">{action.label}</p>
              <p className="text-2xs text-slate-400 dark:text-slate-500 mt-1">{action.desc}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return "—";
  }
}

function getFileBadge(filename: string, fileType?: string) {
  const ext = (filename || "").split(".").pop()?.toLowerCase() || (fileType || "").toLowerCase();
  if (ext === "pdf") {
    return { label: "PDF", bg: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" };
  } else if (ext === "pptx" || ext === "ppt") {
    return { label: ext.toUpperCase(), bg: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" };
  } else if (ext === "docx" || ext === "doc") {
    return { label: ext.toUpperCase(), bg: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400" };
  }
  return { label: ext.toUpperCase() || "FILE", bg: "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400" };
}

function StudentCourseMaterialsTab({ course, initialCategory = "all" }: { subjectId: string; course: CourseDetail; initialCategory?: string }) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [items, setItems] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  const fetchSources = async () => {
    if (!course?._id) { setLoading(false); return; }
    try {
      const res = await api.get(`/sources/course/${course._id}`);
      setItems(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [course?._id]);

  const handleOpenView = async (item: SourceItem) => {
    try {
      const res = await api.get(`/sources/${item._id}/download?inline=true`, { responseType: "blob" });
      const ext = item.name.split(".").pop()?.toLowerCase();
      let mimeType = "application/octet-stream";
      if (ext === "pdf") mimeType = "application/pdf";
      else if (ext === "docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else if (ext === "pptx") mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      else if (ext === "ppt") mimeType = "application/vnd.ms-powerpoint";

      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: mimeType }));
      if (ext === "pdf") {
        window.open(blobUrl, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      alert("Failed to open material file.");
    }
  };

  const handleDownload = async (item: SourceItem) => {
    try {
      const res = await api.get(`/sources/${item._id}/download`, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      alert("Failed to download material file.");
    }
  };

  const categories = [
    { key: "all", label: "All Materials" },
    { key: "lecture_notes", label: "Lecture Notes" },
    { key: "ppt", label: "Lecture PPTs" },
    { key: "lab_manual", label: "Lab Manuals" },
    { key: "previous_paper", label: "Previous Papers" },
    { key: "reference_book", label: "Reference Materials" },
    { key: "other", label: "Other Materials" },
  ];

  const filteredItems = activeCategory === "all"
    ? items
    : items.filter((s) => s.category === activeCategory);

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      <Card padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Course Materials Repository</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Official notes, PPTs, lab manuals, and papers published for {course.courseCode}
            </p>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.04] px-3 py-1.5 rounded-lg w-fit">
            {items.length} Files
          </span>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pt-4 mt-4 border-t border-gray-100 dark:border-white/[0.04]">
          {categories.map((cat) => {
            const count = cat.key === "all" ? items.length : items.filter(s => s.category === cat.key).length;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold"
                    : "bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.08]"
                }`}
              >
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-2xs ${isActive ? "bg-white/20 dark:bg-gray-900/20 text-white dark:text-gray-900" : "text-gray-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Material File List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No materials published"
          description="No course materials have been uploaded under this category yet."
        />
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const badge = getFileBadge(item.name, item.type);
            return (
              <Card
                key={item._id}
                padding="sm"
                className="flex items-center justify-between gap-4 hover:border-gray-300 dark:hover:border-white/[0.1] transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`px-2 py-1 rounded-md text-2xs font-bold uppercase ${badge.bg}`}>
                    {badge.label}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                    <p className="text-2xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Uploaded {formatDate(item.createdAt)} · {formatFileSize(item.fileSize)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenView(item)}>
                    View
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleDownload(item)}>
                    Download
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssignmentsTab({ subjectId }: { subjectId: string; course: CourseDetail }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assignmentService.getAssignments(subjectId)
      .then((res: any) => setAssignments(res.data?.data || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subjectId]);

  if (loading) {
    return <div className="skeleton h-64 rounded-2xl" />;
  }

  return (
    <div className="max-w-4xl space-y-4 animate-fade-in">
      {assignments.length === 0 ? (
        <EmptyState title="No assignments posted" description="No problem sets or assignments have been issued for this subject yet." />
      ) : (
        assignments.map((a) => (
          <Card key={a._id} padding="md">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                  <Badge variant={new Date(a.dueDate) < new Date() ? "neutral" : "warning"} size="sm">
                    Due {new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Badge>
                  {a.submissionMethod && (
                    <Badge variant="neutral" size="sm" className="capitalize">
                      {a.submissionMethod === "online" ? "Online Submission" : a.submissionMethod}
                    </Badge>
                  )}
                </div>
                {(a.instructions || a.description) && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                    {a.instructions || a.description}
                  </p>
                )}

                {/* Question Paper / Material Attachments */}
                {a.attachments && a.attachments.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
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

                <p className="text-2xs text-gray-400 dark:text-gray-500 mt-2.5">
                  Total Marks: {a.totalMarks} · Created {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function AttendanceTab({ subjectId }: { subjectId: string }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/attendance?courseId=${subjectId}`)
      .then((res) => setRecords(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subjectId]);

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  const total = records.length;
  const present = records.filter((r) => r.status === "present" || r.status === "late").length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <Card padding="md" className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Attendance Summary</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{present} of {total} classes attended</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${pct >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>{pct}%</p>
          <p className="text-2xs text-gray-400">75% required</p>
        </div>
      </Card>

      <Card padding="none">
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Session History</h3>
        </div>
        <div className="divider" />
        <div className="p-5">
          {records.length === 0 ? (
            <EmptyState title="No attendance recorded" description="No attendance sessions have been taken for this course yet." />
          ) : (
            <div className="space-y-2">
              {records.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/60 dark:bg-white/[0.02]">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                  <Badge variant={r.status === "present" ? "success" : r.status === "late" ? "warning" : "danger"} size="sm">
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function AnnouncementsTab({ subjectId }: { subjectId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/announcements/course/${subjectId}`)
      .then((res) => setItems(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subjectId]);

  if (loading) return <div className="skeleton h-64 rounded-2xl" />;

  return (
    <div className="max-w-4xl space-y-4 animate-fade-in">
      {items.length === 0 ? (
        <EmptyState title="No course announcements" description="No notices have been published specifically for this course yet." />
      ) : (
        items.map((a) => (
          <Card key={a._id} padding="md">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{a.title}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{a.body}</p>
            <p className="text-2xs text-gray-400 dark:text-gray-500 mt-3">
              Posted {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </Card>
        ))
      )}
    </div>
  );
}
