import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { assignmentService } from "../../services/assignment";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "upload", label: "Course Materials" },
  { key: "assignments", label: "Assignments" },
  { key: "grade-submissions", label: "Grade Submissions" },
  { key: "attendance", label: "Mark Attendance" },
  { key: "marks", label: "Internal Marks" },
  { key: "announcements", label: "Announcements" },
];

export default function FacultySubjectPage() {
  const { subjectId, tab } = useParams<{ subjectId: string; tab?: string }>();
  const activeTab = tab || "overview";
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
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
    navigate(`/faculty/subjects/${subjectId}/${t}`);
  };

  if (loading || !course) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-8 w-64 rounded-lg" />
          <div className="skeleton h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Subject Header */}
      <div className="surface-card border-b border-gray-200/60 dark:border-white/[0.04] px-6 lg:px-8 py-5 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2 text-xs">
          <button onClick={() => navigate("/faculty/subjects")} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
            ← My Subjects
          </button>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-gray-500 dark:text-gray-400 font-mono">{course.courseCode}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{course.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300">Faculty Workspace</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {course.courseCode} · {course.credits || 3} Credits · {course.courseType === "lab" ? "Laboratory" : "Theory"} · {course.studentIds?.length || 0} Students enrolled
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-6 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                activeTab === t.key
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "overview" && <FacultyOverviewTab course={course} />}
        {activeTab === "upload" && <FacultyMaterialsTab course={course} />}
        {activeTab === "assignments" && <FacultyAssignmentsTab course={course} />}
        {activeTab === "grade-submissions" && <FacultyGradeSubmissionsTab course={course} />}
        {activeTab === "attendance" && <FacultyAttendanceTab course={course} />}
        {activeTab === "marks" && <FacultyInternalMarksTab course={course} />}
        {activeTab === "announcements" && <FacultyAnnouncementsTab course={course} />}
      </div>
    </div>
  );
}

function FacultyOverviewTab({ course }: { course: any }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/courses/${course._id}/students`)
      .then((res) => setStudents(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [course._id]);

  return (
    <div className="max-w-4xl space-y-6">
      {course.description && (
        <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-ink mb-2">Subject Description</h3>
          <p className="text-sm text-ink-muted leading-relaxed">{course.description}</p>
        </div>
      )}

      {/* Syllabus */}
      {course.syllabus && course.syllabus.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-ink mb-3">Syllabus Outline</h3>
          <div className="space-y-2">
            {course.syllabus.map((topic: string, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface">
                <span className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                <p className="text-sm text-ink">{topic}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Students Roster */}
      <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-ink">Enrolled Student Roster</h3>
            <p className="text-xs text-ink-muted mt-0.5">{students.length} students enrolled in this course</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><span className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" /></div>
        ) : students.length === 0 ? (
          <p className="text-xs text-ink-faint text-center py-6">No students enrolled yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface text-ink-faint uppercase">
                  <th className="text-left px-4 py-2 font-semibold">Roll No</th>
                  <th className="text-left px-4 py-2 font-semibold">Student Name</th>
                  <th className="text-left px-4 py-2 font-semibold">Email</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st._id} className="border-t border-surface-border hover:bg-surface/50">
                    <td className="px-4 py-2.5 font-medium text-ink">{st.rollNumber || "714024169001"}</td>
                    <td className="px-4 py-2.5 font-semibold text-ink">{st.name}</td>
                    <td className="px-4 py-2.5 text-ink-muted">{st.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
    return { label: "PDF", bg: "bg-red-50 text-red-700 border-red-200" };
  } else if (ext === "pptx" || ext === "ppt") {
    return { label: ext.toUpperCase(), bg: "bg-amber-50 text-amber-700 border-amber-200" };
  } else if (ext === "docx" || ext === "doc") {
    return { label: ext.toUpperCase(), bg: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  return { label: ext.toUpperCase() || "FILE", bg: "bg-slate-50 text-slate-700 border-slate-200" };
}

const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  lecture_notes: { label: "Lecture Notes", icon: "📝" },
  ppt: { label: "Lecture PPTs", icon: "📊" },
  lab_manual: { label: "Lab Manuals", icon: "🔬" },
  previous_paper: { label: "Previous Papers", icon: "📑" },
  reference_book: { label: "Reference Materials", icon: "📚" },
  other: { label: "Other Materials", icon: "📁" }
};

function FacultyMaterialsTab({ course }: { course: any }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [uploadCategory, setUploadCategory] = useState("lecture_notes");
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSources = async () => {
    if (!course._id) { setLoading(false); return; }
    try {
      const res = await api.get(`/sources/course/${course._id}`);
      setSources(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [course._id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !course._id) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("courseId", course._id);
      formData.append("category", uploadCategory);
      formData.append("file", file);

      await api.post("/sources/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Official course material uploaded successfully and published to students.");
      fetchSources();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to upload official course material.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (sourceId: string, filename: string) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) return;
    try {
      await api.delete(`/sources/${sourceId}`);
      setSources((prev) => prev.filter((s) => s._id !== sourceId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete document.");
    }
  };

  const handleOpenView = async (item: any) => {
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
    } catch (err) {
      alert("Failed to open material file.");
    }
  };

  const handleDownload = async (item: any) => {
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
    } catch (err) {
      alert("Failed to download material file.");
    }
  };

  const categories = [
    { key: "all", label: "All Materials", icon: "📚" },
    { key: "lecture_notes", label: "Lecture Notes", icon: "📝" },
    { key: "ppt", label: "Lecture PPTs", icon: "📊" },
    { key: "lab_manual", label: "Lab Manuals", icon: "🔬" },
    { key: "previous_paper", label: "Previous Papers", icon: "📑" },
    { key: "reference_book", label: "Reference Materials", icon: "📚" },
    { key: "other", label: "Other Materials", icon: "📁" },
  ];

  const filteredSources = activeCategory === "all"
    ? sources
    : sources.filter((s) => s.category === activeCategory);

  return (
    <div className="max-w-5xl space-y-6">
      {/* Official Academic Header Banner */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink">Official Course Materials Repository</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                Official LMS Repository
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              Publish official academic documents for students enrolled in {course.courseCode} ({course.name}).
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-muted bg-surface px-3 py-1.5 rounded-xl border border-surface-border">
            <span>Total Published:</span>
            <span className="font-bold text-ink">{sources.length} materials</span>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-semibold text-ink">Upload Official Document:</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">Select Target Category:</span>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="text-xs border border-surface-border rounded-lg px-2.5 py-1 bg-white font-medium text-ink focus:outline-none focus:ring-1 focus:ring-neutral-900/10 focus:border-neutral-900"
              >
                <option value="lecture_notes">Lecture Notes</option>
                <option value="ppt">Lecture PPTs</option>
                <option value="lab_manual">Lab Manuals</option>
                <option value="previous_paper">Previous Question Papers</option>
                <option value="reference_book">Reference Materials</option>
                <option value="other">Other Materials</option>
              </select>
            </div>
          </div>

          <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".pdf,.docx,.pptx,.ppt" />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-neutral-400 bg-slate-50/50 hover:bg-slate-100/50 rounded-xl p-6 text-center cursor-pointer transition-all group"
          >
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-2xl group-hover:scale-110 transition-transform">📤</span>
              <p className="text-sm font-semibold text-ink">Click to select and publish course material</p>
              <p className="text-xs text-ink-faint">Accepted formats: PDF, PPTX, PPT, DOCX (Max size: 50 MB)</p>
            </div>

            {uploading && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-neutral-900 font-semibold bg-white py-2 px-4 rounded-lg shadow-sm border border-slate-200 max-w-xs mx-auto">
                <span className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
                <span>Uploading official course material…</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Published Materials Repository */}
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2">
            <span>Published Academic Documents</span>
            <span className="text-xs font-normal text-ink-muted">({filteredSources.length})</span>
          </h3>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
            {categories.map((cat) => {
              const count = cat.key === "all" ? sources.length : sources.filter(s => s.category === cat.key).length;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeCategory === cat.key
                      ? "bg-neutral-900 text-white font-semibold shadow-xs"
                      : "bg-surface text-ink-muted hover:text-ink hover:bg-surface-panel border border-surface-border"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === cat.key ? "bg-white/20 text-white" : "bg-surface-panel text-ink-faint"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <span className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="text-center py-10 bg-surface rounded-xl border border-surface-border">
            <p className="text-3xl mb-2">📁</p>
            <p className="text-xs font-medium text-ink-muted">No course materials published under this category yet.</p>
            <p className="text-[11px] text-ink-faint mt-0.5">Use the upload box above to publish materials for your students.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface text-ink-faint uppercase font-semibold text-[10px] tracking-wider border-b border-surface-border">
                  <th className="text-left px-4 py-3">Document Title</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-left px-4 py-3">Format / Size</th>
                  <th className="text-left px-4 py-3">Published Date</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredSources.map((item) => {
                  const badge = getFileBadge(item.name, item.type);
                  const catInfo = CATEGORY_MAP[item.category] || { label: item.category || "General", icon: "📄" };
                  return (
                    <tr key={item._id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-ink">
                        <div className="flex items-center gap-3 min-w-0 max-w-xs md:max-w-sm">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="truncate text-xs font-semibold text-ink" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted bg-surface px-2.5 py-1 rounded-md border border-surface-border">
                          <span>{catInfo.icon}</span>
                          <span>{catInfo.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink-muted text-[11px]">
                        {badge.label} • {formatFileSize(item.fileSize)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink-muted text-[11px]">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Ready
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenView(item)}
                            className="px-2.5 py-1 text-xs text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors font-medium"
                          >
                            Open / View
                          </button>
                          <button
                            onClick={() => handleDownload(item)}
                            className="px-2.5 py-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors font-medium"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => handleDelete(item._id, item.name)}
                            className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FacultyAssignmentsTab({ course }: { course: any }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [submissionMethod, setSubmissionMethod] = useState("online");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [editReason, setEditReason] = useState("");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [saving, setSaving] = useState(false);

  const attachFileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssignments = async () => {
    try {
      const res = await api.get(`/assignments?courseId=${course._id}`);
      setAssignments(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [course._id]);

  const openCreateModal = () => {
    setEditingAssignment(null);
    setTitle("");
    setDescription("");
    setDueDate("");
    setTotalMarks("100");
    setSubmissionMethod("online");
    setAttachments([]);
    setEditReason("");
    setShowModal(true);
  };

  const openEditModal = (a: any) => {
    setEditingAssignment(a);
    setTitle(a.title || "");
    setDescription(a.description || "");
    setDueDate(a.dueDate ? new Date(a.dueDate).toISOString().split("T")[0] : "");
    setTotalMarks(String(a.totalMarks || 100));
    setSubmissionMethod(a.submissionMethod || "online");
    setAttachments(a.attachments || []);
    setEditReason("");
    setShowModal(true);
  };

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAttachment(true);
    try {
      const res = await assignmentService.uploadAttachment(file);
      if (res.data.success) {
        setAttachments((prev) => [...prev, res.data.data]);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to upload assignment attachment.");
    } finally {
      setUploadingAttachment(false);
      if (attachFileInputRef.current) attachFileInputRef.current.value = "";
    }
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        dueDate,
        totalMarks: Number(totalMarks) || 100,
        submissionMethod,
        attachments: attachments.map((att) => (typeof att === "object" ? JSON.stringify(att) : att)),
        reason: editReason.trim() || undefined
      };

      if (editingAssignment) {
        await api.patch(`/assignments/${editingAssignment._id}`, payload);
        alert("Assignment updated successfully! Students now see the revised assignment.");
      } else {
        await api.post("/assignments", {
          ...payload,
          courseId: course._id,
          notebookId: course.notebookId,
        });
        alert("Assignment created successfully with attachments!");
      }

      setShowModal(false);
      fetchAssignments();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save assignment.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAttachment = async (att: any, assignmentId?: string) => {
    try {
      const filename = typeof att === "string" ? att.split("=").pop() || att : att.filename || att.name;
      const url = `/assignments/attachments/download?file=${encodeURIComponent(filename)}${assignmentId ? `&assignmentId=${assignmentId}` : ""}&inline=true`;
      const res = await api.get(url, { responseType: "blob" });
      const ext = (typeof att === "string" ? att : att.name || filename).split(".").pop()?.toLowerCase();
      let mimeType = "application/octet-stream";
      if (ext === "pdf") mimeType = "application/pdf";
      else if (ext === "docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else if (ext === "pptx") mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: mimeType }));
      if (ext === "pdf") {
        window.open(blobUrl, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = typeof att === "string" ? att : att.name || "attachment";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      alert("Failed to open attachment.");
    }
  };

  const handleDownloadAttachment = async (att: any, assignmentId?: string) => {
    try {
      const filename = typeof att === "string" ? att.split("=").pop() || att : att.filename || att.name;
      const url = `/assignments/attachments/download?file=${encodeURIComponent(filename)}${assignmentId ? `&assignmentId=${assignmentId}` : ""}`;
      const res = await api.get(url, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = typeof att === "string" ? att : att.name || "attachment";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert("Failed to download attachment.");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Subject Assignments</h2>
          <p className="text-xs text-ink-muted">Create, edit, and manage course assignments with official attachments</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          + Create Assignment
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><span className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" /></div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-surface-border">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-sm font-medium text-ink-muted">No assignments created yet</p>
          <button
            onClick={openCreateModal}
            className="mt-3 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
          >
            Create Assignment
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a._id} className="p-5 bg-white rounded-2xl border border-surface-border shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-ink">{a.title}</p>
                    <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-neutral-100 text-neutral-700 capitalize">
                      {a.submissionMethod || "online"}
                    </span>
                  </div>
                  {a.description && <p className="text-xs text-ink-muted mt-1 leading-relaxed">{a.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(a)}
                    className="px-3 py-1 bg-surface hover:bg-surface-panel border border-surface-border text-ink text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>✏️</span>
                    <span>Edit</span>
                  </button>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                    {a.status}
                  </span>
                </div>
              </div>

              {/* Display Attached Assignment Files */}
              {a.attachments && a.attachments.length > 0 && (
                <div className="p-3 bg-surface rounded-xl border border-surface-border space-y-2">
                  <p className="text-[10px] font-bold uppercase text-ink-faint">Attached Problem Documents ({a.attachments.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {a.attachments.map((att: any, idx: number) => {
                      const attName = typeof att === "string" ? att.split("-").pop() || "Attachment" : att.name || "Attachment";
                      return (
                        <div key={idx} className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-surface-border text-xs">
                          <span className="font-semibold text-ink truncate max-w-xs">{attName}</span>
                          <button
                            onClick={() => handleOpenAttachment(att, a._id)}
                            className="text-neutral-900 hover:underline font-medium text-[11px]"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadAttachment(att, a._id)}
                            className="text-emerald-600 hover:text-emerald-800 font-medium text-[11px]"
                          >
                            Download
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-surface-border/50 text-xs text-ink-faint">
                <span>📅 Due: {new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • 📊 {a.totalMarks} marks</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-slide-up">
            <h3 className="text-lg font-bold text-ink">
              {editingAssignment ? "Edit Assignment" : "New Assignment"}
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              {editingAssignment ? `Update details for "${editingAssignment.title}"` : `Post a new assignment for ${course.name}`}
            </p>
            <form onSubmit={handleSaveAssignment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-faint uppercase mb-1">Assignment Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lab Report 1: DSP Filtering Analysis"
                  className="w-full p-3 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-faint uppercase mb-1">Instructions / Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the instructions or problem set…"
                  className="w-full p-3 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-faint uppercase mb-1">Total Marks</label>
                  <input
                    required
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    className="w-full p-3 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-faint uppercase mb-1">Due Date</label>
                  <input
                    required
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-3 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-faint uppercase mb-1">Submission Method</label>
                <select
                  value={submissionMethod}
                  onChange={(e) => setSubmissionMethod(e.target.value)}
                  className="w-full p-2.5 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white font-medium"
                >
                  <option value="online">Online File Upload (Portal)</option>
                  <option value="physical">Physical Hardcopy Submission</option>
                  <option value="lab_demo">In-Person Lab Demonstration</option>
                </select>
              </div>

              {/* Attach Files picker */}
              <div>
                <label className="block text-xs font-bold text-ink-faint uppercase mb-1">Attach Problem / Reference Files</label>
                <input
                  type="file"
                  ref={attachFileInputRef}
                  onChange={handleAttachFile}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.pptx,.ppt"
                />
                <button
                  type="button"
                  onClick={() => attachFileInputRef.current?.click()}
                  disabled={uploadingAttachment}
                  className="w-full p-2.5 bg-surface border border-dashed border-slate-300 hover:border-neutral-500 rounded-xl text-xs font-semibold text-neutral-800 hover:bg-slate-100/50 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {uploadingAttachment ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
                      <span>Uploading Attachment…</span>
                    </>
                  ) : (
                    <span>+ Attach Question Paper (.pdf, .docx, .pptx)</span>
                  )}
                </button>

                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachments.map((att, idx) => {
                      const attName = typeof att === "string" ? att.split("-").pop() || "Attachment" : att.name || "Attachment";
                      return (
                        <div key={idx} className="flex items-center justify-between bg-surface px-3 py-1.5 rounded-lg border border-surface-border text-xs">
                          <span className="font-medium text-ink truncate max-w-[200px]">{attName}</span>
                          <button
                            type="button"
                            onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 text-[11px] font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {editingAssignment && (
                <div>
                  <label className="block text-xs font-bold text-ink-faint uppercase mb-1">Revision Reason (Optional)</label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="e.g. Extended deadline / updated question rubric"
                    className="w-full p-2.5 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingAssignment ? "Update Assignment" : "Publish Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FacultyGradeSubmissionsTab({ course }: { course: any }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignId, setSelectedAssignId] = useState("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Grade modal
  const [gradingSub, setGradingSub] = useState<any | null>(null);
  const [marksInput, setMarksInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    api.get(`/assignments?courseId=${course._id}`)
      .then((res) => {
        const list = res.data.data || [];
        setAssignments(list);
        if (list.length > 0) setSelectedAssignId(list[0]._id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [course._id]);

  useEffect(() => {
    if (!selectedAssignId) return;
    api.get(`/assignments/${selectedAssignId}/submissions`)
      .then((res) => setSubmissions(res.data.data || []))
      .catch(() => {});
  }, [selectedAssignId]);

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSub) return;

    setSavingGrade(true);
    try {
      const studentId = typeof gradingSub.studentId === "object" ? gradingSub.studentId._id : gradingSub.studentId;
      await api.patch(`/assignments/submissions/${gradingSub._id}/grade`, {
        marks: Number(marksInput),
        feedback: feedbackInput.trim(),
        assignmentId: selectedAssignId,
        studentId
      });

      alert("Submission graded and recorded in official Gradebook!");
      setGradingSub(null);
      // Reload submissions roster
      const res = await api.get(`/assignments/${selectedAssignId}/submissions`);
      setSubmissions(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      alert("Failed to save grade.");
    } finally {
      setSavingGrade(false);
    }
  };
  const handleOpenSubmissionFile = async (fileParam: string, subId: string, filename: string) => {
    try {
      const url = `/assignments/submission-files/download?file=${encodeURIComponent(fileParam)}&submissionId=${subId}&inline=true`;
      const res = await api.get(url, { responseType: "blob" });
      const ext = filename.split(".").pop()?.toLowerCase() || "";
      let mimeType = "application/octet-stream";
      if (ext === "pdf") mimeType = "application/pdf";
      else if (ext === "docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else if (ext === "pptx") mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      else if (ext === "zip") mimeType = "application/zip";

      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: mimeType }));
      if (ext === "pdf") {
        window.open(blobUrl, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      alert("Failed to open submission file.");
    }
  };

  const handleDownloadSubmissionFile = async (fileParam: string, subId: string, filename: string) => {
    try {
      const url = `/assignments/submission-files/download?file=${encodeURIComponent(fileParam)}&submissionId=${subId}`;
      const res = await api.get(url, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert("Failed to download submission file.");
    }
  };

  const currentAssignment = assignments.find((a) => a._id === selectedAssignId);

  const filteredRoster = submissions.filter((sub) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return sub.status === "pending" || !sub.isSubmitted;
    if (filterStatus === "submitted") return sub.status === "submitted";
    if (filterStatus === "late") return sub.status === "late";
    if (filterStatus === "graded") return sub.status === "graded";
    return true;
  });

  const submittedCount = submissions.filter((s) => s.isSubmitted).length;
  const gradedCount = submissions.filter((s) => s.status === "graded").length;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-sm">
        <h2 className="text-base font-bold text-ink mb-1">Class Roster & Grade Submissions</h2>
        <p className="text-xs text-ink-muted mb-4">Select an assignment to view complete enrolled student roster and award official grades</p>

        {assignments.length > 0 ? (
          <select
            value={selectedAssignId}
            onChange={(e) => setSelectedAssignId(e.target.value)}
            className="w-full p-3 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white font-semibold"
          >
            {assignments.map((a) => (
              <option key={a._id} value={a._id}>
                {a.title} ({a.totalMarks} marks) — Due {new Date(a.dueDate).toLocaleDateString()}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-ink-faint py-4">No assignments found to grade.</p>
        )}
      </div>

      {/* Submissions Roster */}
      {selectedAssignId && (
        <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-4">
            <div>
              <h3 className="text-sm font-bold text-ink">
                Enrolled Class Roster ({submissions.length} Students)
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                {submittedCount} submitted • {gradedCount} graded • {submissions.length - submittedCount} pending
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {[
                { key: "all", label: `All (${submissions.length})` },
                { key: "pending", label: `Pending (${submissions.length - submittedCount})` },
                { key: "submitted", label: `Submitted (${submissions.filter(s => s.status === "submitted").length})` },
                { key: "late", label: `Late (${submissions.filter(s => s.status === "late").length})` },
                { key: "graded", label: `Graded (${gradedCount})` },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    filterStatus === f.key
                      ? "bg-neutral-900 text-white font-semibold shadow-xs"
                      : "bg-surface text-ink-muted hover:text-ink border border-surface-border"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredRoster.length === 0 ? (
            <p className="text-xs text-ink-faint text-center py-8">No student submissions match this filter.</p>
          ) : (
            <div className="space-y-3">
              {filteredRoster.map((sub) => {
                const studentName = typeof sub.studentId === "object" ? sub.studentId.name : "Student";
                const studentEmail = typeof sub.studentId === "object" ? sub.studentId.email : "";
                const rollNumber = typeof sub.studentId === "object" ? sub.studentId.rollNumber : "";

                return (
                  <div key={sub._id} className="p-4 bg-surface rounded-xl border border-surface-border flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-ink">{studentName}</p>
                        {rollNumber && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-surface-panel text-ink-muted border border-surface-border">
                            {rollNumber}
                          </span>
                        )}
                        {sub.status === "graded" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            ✓ Graded
                          </span>
                        )}
                        {sub.status === "submitted" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800">
                            Submitted
                          </span>
                        )}
                        {sub.status === "late" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Late Submission
                          </span>
                        )}
                        {sub.status === "pending" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
                            Pending Submission
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5">{studentEmail}</p>

                      {sub.notes && (
                        <div className="mt-2 p-2.5 bg-white rounded-lg border border-surface-border text-xs text-ink">
                          <p className="font-semibold text-ink-faint text-[10px] uppercase">Student Notes / Solution:</p>
                          <p className="mt-0.5">{sub.notes}</p>
                        </div>
                      )}

                      {/* Display Submitted Solution Files */}
                      {sub.files && sub.files.length > 0 && (
                        <div className="mt-2.5 p-2.5 bg-white rounded-lg border border-surface-border space-y-1.5">
                          <p className="font-semibold text-ink-faint text-[10px] uppercase">Submitted Solution Files ({sub.files.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {sub.files.map((sf: any, fIdx: number) => {
                              const sfName = typeof sf === "string" ? sf.split("-").pop() || "Solution File" : sf.name || "Solution File";
                              const sfFileParam = typeof sf === "string" ? sf.split("=").pop() || sf : sf.filename || sf.name;
                              return (
                                <div key={fIdx} className="flex items-center gap-2 bg-surface px-2.5 py-1 rounded-md border border-surface-border text-xs">
                                  <span className="font-semibold text-ink truncate max-w-xs">{sfName}</span>
                                  <button
                                    onClick={() => handleOpenSubmissionFile(sfFileParam, sub._id, sfName)}
                                    className="text-neutral-900 hover:underline font-semibold text-[11px]"
                                  >
                                    Open / View
                                  </button>
                                  <button
                                    onClick={() => handleDownloadSubmissionFile(sfFileParam, sub._id, sfName)}
                                    className="text-emerald-600 hover:text-emerald-800 font-semibold text-[11px]"
                                  >
                                    Download
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {sub.submittedAt ? (
                        <p className="text-[10px] text-ink-faint mt-2">
                          Submitted on {new Date(sub.submittedAt).toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-[10px] text-ink-faint mt-2 italic">Student has not submitted work yet</p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      {sub.status === "graded" ? (
                        <div className="text-right">
                          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 block">
                            Grade: {sub.marks} / {currentAssignment?.totalMarks || 100}
                          </span>
                          {sub.feedback && <p className="text-[11px] text-ink-muted mt-1 italic max-w-xs">"{sub.feedback}"</p>}
                          <button
                            onClick={() => {
                              setGradingSub(sub);
                              setMarksInput(sub.marks ? String(sub.marks) : "");
                              setFeedbackInput(sub.feedback || "");
                            }}
                            className="mt-2 text-xs font-medium text-neutral-900 hover:underline transition-colors"
                          >
                            Edit Grade
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setGradingSub(sub);
                            setMarksInput(sub.marks ? String(sub.marks) : "");
                            setFeedbackInput(sub.feedback || "");
                          }}
                          className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                        >
                          Grade Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Grade Modal */}
      {gradingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-slide-up">
            <h3 className="text-lg font-bold text-ink">Award Assignment Grade</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Student: {typeof gradingSub.studentId === "object" ? gradingSub.studentId.name : ""}
            </p>
            <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 mt-2">
              Note: Awarding marks here updates both the Submission record and the Student's official Academic Gradebook.
            </p>
            <form onSubmit={handleSaveGrade} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-faint uppercase mb-1">
                  Marks Obtained (Out of {currentAssignment?.totalMarks || 100})
                </label>
                <input
                  required
                  type="number"
                  max={currentAssignment?.totalMarks || 100}
                  value={marksInput}
                  onChange={(e) => setMarksInput(e.target.value)}
                  placeholder={`0 - ${currentAssignment?.totalMarks || 100}`}
                  className="w-full p-3 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-faint uppercase mb-1">Feedback / Faculty Remarks</label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="e.g. Good analysis of DSP filters. Minor error in Q3 calculations."
                  className="w-full p-3 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingSub(null)}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGrade}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {savingGrade ? "Saving…" : "Save & Sync to Gradebook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FacultyAttendanceTab({ course }: { course: any }) {
  const [students, setStudents] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessionType, setSessionType] = useState("lecture");
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [existingRecordsFound, setExistingRecordsFound] = useState(false);
  const [correctionReason, setCorrectionReason] = useState("");
  const [fetchingRecords, setFetchingRecords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Fetch enrolled course students
  useEffect(() => {
    api.get(`/courses/${course._id}/students`)
      .then((res) => {
        const list = res.data.data || [];
        setStudents(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [course._id]);

  // 2. Automatically query authoritative attendance for selected date
  useEffect(() => {
    if (!course._id || !date || students.length === 0) return;
    setFetchingRecords(true);
    api.get(`/attendance?courseId=${course._id}&date=${date}`)
      .then((res) => {
        const records = res.data.data || [];
        if (records.length > 0) {
          setExistingRecordsFound(true);
          const map: Record<string, string> = {};
          records.forEach((r: any) => {
            const sid = r.studentId?._id ? r.studentId._id.toString() : r.studentId?.toString();
            if (sid) map[sid] = r.status;
          });
          // Ensure all current students have a status
          students.forEach((st: any) => {
            if (!map[st._id]) map[st._id] = "present";
          });
          setStatusMap(map);
          if (records[0]?.sessionType) setSessionType(records[0].sessionType);
        } else {
          setExistingRecordsFound(false);
          const map: Record<string, string> = {};
          students.forEach((st: any) => { map[st._id] = "present"; });
          setStatusMap(map);
        }
      })
      .catch((err) => console.error("Error fetching attendance for date", err))
      .finally(() => setFetchingRecords(false));
  }, [course._id, date, students]);

  const setAllStatus = (newStatus: string) => {
    const map: Record<string, string> = {};
    students.forEach((st) => { map[st._id] = newStatus; });
    setStatusMap(map);
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) return;

    setSaving(true);
    try {
      const records = students.map((st) => ({
        studentId: st._id,
        status: statusMap[st._id] || "present",
      }));

      await api.post("/attendance/bulk", {
        courseId: course._id,
        date,
        sessionType,
        records,
        reason: correctionReason.trim() || undefined
      });

      alert(existingRecordsFound
        ? `Authoritative attendance corrected for ${students.length} students on ${date}!`
        : `Attendance recorded for ${students.length} students on ${date}!`
      );
      setExistingRecordsFound(true);
      setCorrectionReason("");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter(st => (statusMap[st._id] || "present") === "present").length;
  const absentCount = students.filter(st => statusMap[st._id] === "absent").length;
  const odCount = students.filter(st => statusMap[st._id] === "od").length;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-ink">
                {existingRecordsFound ? "Edit Submitted Attendance" : "Mark Session Attendance"}
              </h2>
              {existingRecordsFound ? (
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-amber-100 text-amber-800">
                  Existing Record · Editable
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800">
                  New Session
                </span>
              )}
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              {existingRecordsFound
                ? "Select a student to edit status (Present, Absent, On Duty). Changes update the canonical record and create an audit log."
                : "Record session attendance for enrolled students. All dependent views update automatically."}
            </p>
          </div>
          <button
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0}
            className={`px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50 ${
              existingRecordsFound ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {saving ? "Saving…" : existingRecordsFound ? "Save Corrections" : "Save Attendance"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-ink-faint uppercase mb-1">Session Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-faint uppercase mb-1">Session Type</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full p-2.5 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white font-semibold"
            >
              <option value="lecture">Lecture Session</option>
              <option value="lab">Lab Session</option>
              <option value="tutorial">Tutorial Session</option>
            </select>
          </div>
        </div>

        {existingRecordsFound && (
          <div className="mt-4 pt-4 border-t border-surface-border">
            <label className="block text-xs font-bold text-ink-faint uppercase mb-1">Correction Note / Reason (Optional)</label>
            <input
              type="text"
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="e.g., Student submitted approved medical OD certificate / accidental absent mark"
              className="w-full p-2.5 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white"
            />
          </div>
        )}

        {/* Live Status Summary & Quick Actions */}
        <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present: {presentCount}
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Absent: {absentCount}
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
              <span className="w-2 h-2 rounded-full bg-sky-500" /> On Duty: {odCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAllStatus("present")}
              className="text-2xs font-semibold px-2.5 py-1 rounded-lg border border-surface-border bg-surface hover:bg-surface-panel text-ink-muted transition-colors"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => setAllStatus("absent")}
              className="text-2xs font-semibold px-2.5 py-1 rounded-lg border border-surface-border bg-surface hover:bg-surface-panel text-ink-muted transition-colors"
            >
              Mark All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Roster Attendance Table */}
      <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink">
            Student Roster ({students.length})
          </h3>
          {fetchingRecords && (
            <span className="text-xs text-ink-faint flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
              Checking records…
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><span className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" /></div>
        ) : students.length === 0 ? (
          <p className="text-xs text-ink-faint text-center py-6">No enrolled students to mark attendance for.</p>
        ) : (
          <div className="space-y-2">
            {students.map((st) => {
              const currentStatus = statusMap[st._id] || "present";
              return (
                <div key={st._id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-surface-border">
                  <div>
                    <p className="text-xs font-semibold text-ink">{st.name}</p>
                    <p className="text-[10px] text-ink-faint">{st.rollNumber || "ID: " + st._id.slice(-6)} • {st.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[
                      { status: "present", label: "Present", color: "bg-emerald-600 text-white" },
                      { status: "absent", label: "Absent", color: "bg-red-600 text-white" },
                      { status: "od", label: "On Duty", color: "bg-sky-600 text-white" },
                    ].map((btn) => (
                      <button
                        key={btn.status}
                        onClick={() => setStatusMap((prev) => ({ ...prev, [st._id]: btn.status }))}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${currentStatus === btn.status ? btn.color : "bg-white border border-surface-border text-ink-muted"}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FacultyInternalMarksTab({ course }: { course: any }) {
  const [students, setStudents] = useState<any[]>([]);
  const [existingAssessments, setExistingAssessments] = useState<{ title: string; maxMarks: number; count: number }[]>([]);
  const [allGrades, setAllGrades] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<string>("__NEW__");
  const [examTitle, setExamTitle] = useState("CIA-1 Assessment");
  const [maxMarks, setMaxMarks] = useState("50");
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const [correctionReason, setCorrectionReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchGradesAndAssessments = async () => {
    try {
      const res = await api.get(`/gradebook?courseId=${course._id}`);
      const grades = res.data.data || [];
      setAllGrades(grades);

      // Group by assessment title
      const assessmentMap = new Map<string, { title: string; maxMarks: number; count: number }>();
      grades.forEach((g: any) => {
        if (!g.title) return;
        if (!assessmentMap.has(g.title)) {
          assessmentMap.set(g.title, {
            title: g.title,
            maxMarks: g.maxMarks || 50,
            count: 1
          });
        } else {
          assessmentMap.get(g.title)!.count += 1;
        }
      });

      setExistingAssessments(Array.from(assessmentMap.values()));
    } catch (err) {
      console.error("Error fetching gradebook assessments", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/courses/${course._id}/students`).then((res) => setStudents(res.data.data || [])),
      fetchGradesAndAssessments()
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [course._id]);

  const handleAssessmentSelect = (assessmentTitle: string) => {
    setSelectedAssessment(assessmentTitle);
    if (assessmentTitle === "__NEW__") {
      setExamTitle("CIA-2 Assessment");
      setMaxMarks("50");
      setMarksMap({});
      setCorrectionReason("");
    } else {
      const found = existingAssessments.find((a) => a.title === assessmentTitle);
      if (found) {
        setExamTitle(found.title);
        setMaxMarks(String(found.maxMarks));
        // Pre-populate student marks for this assessment
        const map: Record<string, string> = {};
        allGrades.forEach((g: any) => {
          if (g.title === assessmentTitle) {
            const sid = g.studentId?._id ? g.studentId._id.toString() : g.studentId?.toString();
            if (sid) map[sid] = String(g.marksObtained);
          }
        });
        setMarksMap(map);
        setCorrectionReason("");
      }
    }
  };

  const handleSaveMarks = async () => {
    if (students.length === 0) return;
    if (!examTitle.trim()) {
      alert("Please specify an assessment title.");
      return;
    }

    const numMax = Number(maxMarks);
    if (isNaN(numMax) || numMax <= 0) {
      alert("Please enter a valid maximum marks value greater than 0.");
      return;
    }

    // Validate range for all entered marks
    for (const st of students) {
      const markStr = marksMap[st._id];
      if (markStr !== undefined && markStr !== "") {
        const val = Number(markStr);
        if (isNaN(val) || val < 0 || val > numMax) {
          alert(`Invalid mark "${markStr}" for student ${st.name}. Marks must be between 0 and ${numMax}.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const marksPayload = students
        .filter((st) => marksMap[st._id] !== undefined && marksMap[st._id] !== "")
        .map((st) => ({
          studentId: st._id,
          marksObtained: Number(marksMap[st._id])
        }));

      await api.post("/gradebook/bulk", {
        courseId: course._id,
        assessmentTitle: examTitle.trim(),
        maxMarks: numMax,
        marks: marksPayload,
        reason: correctionReason.trim() || undefined
      });

      alert(selectedAssessment !== "__NEW__"
        ? `Marks updated successfully for assessment "${examTitle}"! Audit trail recorded.`
        : `Assessment "${examTitle}" recorded in gradebook for ${marksPayload.length} students!`
      );

      await fetchGradesAndAssessments();
      setSelectedAssessment(examTitle.trim());
      setCorrectionReason("");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save marks.");
    } finally {
      setSaving(false);
    }
  };

  const isEditing = selectedAssessment !== "__NEW__";

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-ink">
                {isEditing ? "Edit Internal Assessment Marks" : "Enter Internal Assessment Marks"}
              </h2>
              {isEditing ? (
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-amber-100 text-amber-800">
                  Editing Assessment · Correctable
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800">
                  New Assessment
                </span>
              )}
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              {isEditing
                ? `Editing existing marks for "${examTitle}". Changes update canonical grades and record audit trails.`
                : "Record CIA, Midterm, and Assignment marks into the authoritative gradebook."}
            </p>
          </div>
          <button
            onClick={handleSaveMarks}
            disabled={saving || students.length === 0}
            className={`px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 ${
              isEditing ? "bg-amber-600 hover:bg-amber-700" : "bg-neutral-900 hover:bg-neutral-800"
            }`}
          >
            {saving ? "Saving…" : isEditing ? "Save Corrections" : "Save Marks"}
          </button>
        </div>

        {/* Existing Assessment Selector */}
        {existingAssessments.length > 0 && (
          <div className="mb-4 pb-4 border-b border-surface-border">
            <label className="block text-xs font-bold text-ink-faint uppercase mb-1">
              Select Assessment to Manage or Edit
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleAssessmentSelect("__NEW__")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedAssessment === "__NEW__"
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "bg-surface text-ink-muted hover:text-ink border border-surface-border"
                }`}
              >
                + Enter New Assessment
              </button>
              {existingAssessments.map((a) => (
                <button
                  key={a.title}
                  type="button"
                  onClick={() => handleAssessmentSelect(a.title)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedAssessment === a.title
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-surface text-ink-muted hover:text-ink border border-surface-border"
                  }`}
                >
                  <span>✏️ {a.title}</span>
                  <span className={`text-2xs px-1.5 py-0.2 rounded-full ${
                    selectedAssessment === a.title ? "bg-white/20 text-white" : "bg-surface-panel text-ink-faint"
                  }`}>
                    {a.count} graded · max {a.maxMarks}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-ink-faint uppercase mb-1">Assessment Title</label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="e.g. CIA-1 Internal Test"
              className="w-full p-2.5 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-faint uppercase mb-1">Maximum Marks</label>
            <input
              type="number"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              className="w-full p-2.5 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white font-semibold"
            />
          </div>
        </div>

        {isEditing && (
          <div className="mt-4 pt-4 border-t border-surface-border">
            <label className="block text-xs font-bold text-ink-faint uppercase mb-1">
              Correction Reason (Optional)
            </label>
            <input
              type="text"
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="e.g. Re-evaluation of Question 3 / entry correction"
              className="w-full p-2.5 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white"
            />
          </div>
        )}
      </div>

      {/* Roster Marks Table */}
      <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink">Student Marks Input ({students.length})</h3>
          <span className="text-xs text-ink-faint">
            Entering marks out of {maxMarks || 50}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><span className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" /></div>
        ) : students.length === 0 ? (
          <p className="text-xs text-ink-faint text-center py-6">No enrolled students found.</p>
        ) : (
          <div className="space-y-2">
            {students.map((st) => {
              const currentMark = marksMap[st._id] ?? "";
              return (
                <div key={st._id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-surface-border">
                  <div>
                    <p className="text-xs font-semibold text-ink">{st.name}</p>
                    <p className="text-[10px] text-ink-faint">{st.rollNumber || "ID: " + st._id.slice(-6)} • {st.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={maxMarks}
                      value={currentMark}
                      onChange={(e) => setMarksMap((prev) => ({ ...prev, [st._id]: e.target.value }))}
                      placeholder="--"
                      className={`w-24 p-2 text-xs border rounded-xl text-center font-bold focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 ${
                        currentMark !== "" ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-white border-surface-border"
                      }`}
                    />
                    <span className="text-xs text-ink-faint font-semibold">/ {maxMarks}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FacultyAnnouncementsTab({ course }: { course: any }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("normal");
  const [posting, setPosting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get(`/announcements?courseId=${course._id}`);
      setAnnouncements(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [course._id]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setPosting(true);
    try {
      await api.post("/announcements", {
        title: title.trim(),
        body: body.trim(),
        priority,
        courseId: course._id,
        notebookId: course.notebookId,
      });

      alert("Announcement posted for this subject!");
      setTitle("");
      setBody("");
      fetchAnnouncements();
    } catch (err: any) {
      console.error(err);
      alert("Failed to post announcement.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white rounded-2xl border border-surface-border p-6 shadow-sm">
        <h2 className="text-base font-bold text-ink mb-1">Post Course Announcement</h2>
        <p className="text-xs text-ink-muted mb-4">Broadcast an announcement to all students enrolled in {course.name}</p>
        <form onSubmit={handlePost} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-faint uppercase mb-1">Announcement Title</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lab Experiment 3 Guidelines & Extra Class Notice"
              className="w-full p-3 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-faint uppercase mb-1">Body Text</label>
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write announcement details here…"
              className="w-full p-3 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10 bg-white"
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={posting}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {posting ? "Posting…" : "Post Announcement"}
            </button>
          </div>
        </form>
      </div>

      {/* Announcements List */}
      <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-ink mb-4">Posted Course Announcements ({announcements.length})</h3>
        {loading ? (
          <div className="flex justify-center py-8"><span className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" /></div>
        ) : announcements.length === 0 ? (
          <p className="text-xs text-ink-faint text-center py-6">No announcements posted for this course yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a._id} className="p-4 bg-surface rounded-xl border border-surface-border">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-bold text-ink">{a.title}</p>
                </div>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">{a.body}</p>
                <p className="text-[10px] text-ink-faint mt-2">{new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


