import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { departmentService } from "../../services/department";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { EmptyState } from "../ui/EmptyState";

interface StudentRow {
  name: string;
  email: string;
  registerNumber: string;
  department: string;
  batch?: string;
  section?: string;
  semester?: number;
  phone?: string;
}

interface ValidationRowResult {
  row: number;
  data: StudentRow;
  valid: boolean;
  errors: string[];
}

export const StudentOnboardingTab: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");
  const [selectedSecFilter, setSelectedSecFilter] = useState("all");

  // Single Student Modal
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [singleData, setSingleData] = useState({
    name: "",
    email: "",
    registerNumber: "",
    departmentId: "",
    batchId: "",
    section: "A",
    semester: 1,
    phone: "",
    password: ""
  });
  const [savingSingle, setSavingSingle] = useState(false);

  // Bulk Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<"input" | "preview" | "done">("input");
  const [csvText, setCsvText] = useState("");
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    total: number;
    validCount: number;
    errorCount: number;
    results: ValidationRowResult[];
  } | null>(null);
  const [importSummary, setImportSummary] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, dRes, bRes] = await Promise.all([
        api.get("/users?role=student"),
        departmentService.getDepartments(),
        api.get("/batches")
      ]);
      setStudents(uRes.data.data || []);
      setDepartments(dRes.data.data || []);
      setBatches(bRes.data.data || []);
      if (dRes.data.data?.length > 0 && !singleData.departmentId) {
        setSingleData((prev) => ({
          ...prev,
          departmentId: dRes.data.data[0]._id,
          batchId: bRes.data.data?.[0]?._id || ""
        }));
      }
    } catch (err) {
      console.error("Failed to load students/departments/batches", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleData.name.trim() || !singleData.email.trim() || !singleData.registerNumber.trim()) {
      alert("Name, institutional email, and register number are required.");
      return;
    }

    setSavingSingle(true);
    try {
      await api.post("/users/students", {
        name: singleData.name.trim(),
        email: singleData.email.trim(),
        rollNumber: singleData.registerNumber.trim(),
        registerNumber: singleData.registerNumber.trim(),
        departmentId: singleData.departmentId || undefined,
        batchId: singleData.batchId || undefined,
        section: singleData.section.trim() || undefined,
        semester: Number(singleData.semester) || 1,
        phone: singleData.phone.trim() || undefined,
        password: singleData.password.trim() || undefined
      });
      alert("Student account and institutional profile provisioned successfully!");
      setShowSingleModal(false);
      setSingleData({
        name: "",
        email: "",
        registerNumber: "",
        departmentId: departments[0]?._id || "",
        batchId: "",
        section: "A",
        semester: 1,
        phone: "",
        password: ""
      });
      fetchData();
    } catch (err: any) {
      console.error("Single student provision error:", err);
      alert(err.response?.data?.error || "Failed to create student");
    } finally {
      setSavingSingle(false);
    }
  };

  // Parse CSV string to objects
  const parseCsv = (text: string): StudentRow[] => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = headers.findIndex((h) => h.includes("name"));
    const emailIdx = headers.findIndex((h) => h.includes("email"));
    const regIdx = headers.findIndex((h) => h.includes("reg") || h.includes("roll"));
    const deptIdx = headers.findIndex((h) => h.includes("dept") || h.includes("department"));
    const batchIdx = headers.findIndex((h) => h.includes("batch") || h.includes("cohort"));
    const secIdx = headers.findIndex((h) => h.includes("sec") || h.includes("section"));
    const semIdx = headers.findIndex((h) => h.includes("sem") || h.includes("semester"));
    const phoneIdx = headers.findIndex((h) => h.includes("phone") || h.includes("mobile"));

    const rows: StudentRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim());
      if (parts.length <= 1 && !parts[0]) continue;
      rows.push({
        name: nameIdx !== -1 ? parts[nameIdx] || "" : parts[0] || "",
        email: emailIdx !== -1 ? parts[emailIdx] || "" : parts[1] || "",
        registerNumber: regIdx !== -1 ? parts[regIdx] || "" : parts[2] || "",
        department: deptIdx !== -1 ? parts[deptIdx] || "" : parts[3] || "",
        batch: batchIdx !== -1 ? parts[batchIdx] : undefined,
        section: secIdx !== -1 ? parts[secIdx] : undefined,
        semester: semIdx !== -1 ? Number(parts[semIdx]) || undefined : undefined,
        phone: phoneIdx !== -1 ? parts[phoneIdx] : undefined
      });
    }
    return rows;
  };

  const handleValidateCsv = async () => {
    const parsedRows = parseCsv(csvText);
    if (parsedRows.length === 0) {
      alert("No valid rows detected. Please check CSV format.");
      return;
    }

    setValidating(true);
    try {
      const res = await api.post("/users/students/bulk-validate", { rows: parsedRows });
      setValidationResults(res.data.data);
      setBulkStep("preview");
    } catch (err: any) {
      alert(err.response?.data?.error || "Validation failed");
    } finally {
      setValidating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!validationResults) return;
    if (validationResults.errorCount > 0) {
      if (!window.confirm(`There are ${validationResults.errorCount} row errors. Only the ${validationResults.validCount} valid rows will be imported. Proceed?`)) {
        return;
      }
    }

    setImporting(true);
    try {
      // Filter out invalid rows or send all confirmed
      const validRows = validationResults.results.filter((r) => r.valid).map((r) => r.data);
      const res = await api.post("/users/students/bulk-import", {
        rows: validRows,
        confirmed: true
      });
      setImportSummary(res.data.data);
      setBulkStep("done");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Bulk import failed");
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const sample = `Name,Email,RegisterNumber,Department,Batch,Section,Semester,Phone\nJohn Doe,john.doe@college.edu,REG2026001,ECE,2023-2027,A,1,9876543210\nJane Smith,jane.smith@college.edu,REG2026002,ECE,2023-2027,B,1,9876543211`;
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_onboarding_sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Distinct sections for filter
  const distinctSections = Array.from(
    new Set(students.map((s) => s.studentProfile?.section).filter(Boolean))
  );

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.studentProfile?.registerNumber?.toLowerCase().includes(search.toLowerCase());
    const matchDept =
      selectedDeptFilter === "all" ||
      s.studentProfile?.departmentId?._id === selectedDeptFilter ||
      s.studentProfile?.departmentId === selectedDeptFilter;
    const matchSec =
      selectedSecFilter === "all" || s.studentProfile?.section === selectedSecFilter;
    return matchSearch && matchDept && matchSec;
  });

  return (
    <div className="space-y-6">
      {/* Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>🎓</span> Student Onboarding & Profiles
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Permanent institutional student accounts with department, cohort, section, and semester binding.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => {
            setBulkStep("input");
            setCsvText("");
            setValidationResults(null);
            setShowBulkModal(true);
          }}>
            📁 Bulk CSV Import
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowSingleModal(true)}>
            + Provision Student
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="text"
          placeholder="Search by name, institutional email, or register number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1c202c] text-slate-900 dark:text-white focus:outline-none"
        />

        <select
          value={selectedDeptFilter}
          onChange={(e) => setSelectedDeptFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1c202c] text-slate-800 dark:text-slate-200 focus:outline-none"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.departmentCode} - {d.departmentName}</option>
          ))}
        </select>

        {distinctSections.length > 0 && (
          <select
            value={selectedSecFilter}
            onChange={(e) => setSelectedSecFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1c202c] text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Sections</option>
            {distinctSections.map((sec) => (
              <option key={sec} value={sec}>Section {sec}</option>
            ))}
          </select>
        )}
      </div>

      {/* Students Table */}
      {loading ? (
        <Card padding="lg" className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
        </Card>
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          title="No Students Found"
          description="Provision a student or use Bulk CSV Import to register student cohorts."
          action={
            <Button variant="primary" size="sm" onClick={() => setShowSingleModal(true)}>
              + Provision Student
            </Button>
          }
        />
      ) : (
        <div className="card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Institutional Email</th>
                  <th>Register Number</th>
                  <th>Department</th>
                  <th>Section</th>
                  <th>Semester</th>
                  <th>Account Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => {
                  const prof = st.studentProfile;
                  const dept = prof?.departmentId;
                  const deptDisplay = dept?.departmentCode || dept?.departmentName || "—";
                  return (
                    <tr key={st._id}>
                      <td className="font-semibold text-slate-900 dark:text-white">
                        {st.name}
                      </td>
                      <td className="text-slate-600 dark:text-slate-300 font-mono text-xs">
                        {st.email}
                      </td>
                      <td className="text-slate-800 dark:text-slate-200 font-mono font-medium text-xs">
                        {prof?.registerNumber || "—"}
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded-md text-2xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
                          {deptDisplay}
                        </span>
                      </td>
                      <td>
                        {prof?.section ? (
                          <span className="px-2 py-0.5 rounded-md text-2xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                            Sec {prof.section}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Sem {prof?.currentSemester || 1}
                        </span>
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Permanent Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Single Student Provision Modal */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#1c202c] rounded-2xl p-6 shadow-float border border-slate-200 dark:border-white/10 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>👤</span> Provision Student Account
              </h3>
              <button
                onClick={() => setShowSingleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Creates a permanent institutional account with authoritative department, cohort, and section linkage.
            </p>

            <form onSubmit={handleCreateSingleStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={singleData.name}
                  onChange={(e) => setSingleData({ ...singleData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Institutional Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="john.doe@college.edu"
                    value={singleData.email}
                    onChange={(e) => setSingleData({ ...singleData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Register Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="REG2026001"
                    value={singleData.registerNumber}
                    onChange={(e) => setSingleData({ ...singleData, registerNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department *
                  </label>
                  <select
                    value={singleData.departmentId}
                    onChange={(e) => setSingleData({ ...singleData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.departmentCode} - {d.departmentName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batch / Cohort *
                  </label>
                  <select
                    value={singleData.batchId}
                    onChange={(e) => {
                      const b = batches.find((item) => item._id === e.target.value);
                      setSingleData({
                        ...singleData,
                        batchId: e.target.value,
                        section: b?.section || singleData.section
                      });
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none font-medium"
                  >
                    <option value="">Auto-resolve cohort</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name || b.code} ({b.academicYear || `${b.startYear}-${b.endYear}`})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder="A"
                    value={singleData.section}
                    onChange={(e) => setSingleData({ ...singleData, section: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={singleData.semester}
                    onChange={(e) => setSingleData({ ...singleData, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Password (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Defaults to Student@123"
                    value={singleData.password}
                    onChange={(e) => setSingleData({ ...singleData, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={singleData.phone}
                    onChange={(e) => setSingleData({ ...singleData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowSingleModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={savingSingle}>
                  {savingSingle ? "Provisioning..." : "Provision Student"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white dark:bg-[#1c202c] rounded-2xl p-6 shadow-float border border-slate-200 dark:border-white/10 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📁</span> Bulk Student Onboarding
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Two-stage safe onboarding: Validate all rows → inspect errors/duplicates → explicit confirm → atomic import
                </p>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-2 text-xs font-semibold py-1">
              <span className={`px-2.5 py-1 rounded-lg ${bulkStep === "input" ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "bg-slate-100 text-slate-600 dark:bg-white/[0.04] dark:text-slate-400"}`}>
                1. Upload / Paste CSV
              </span>
              <span>→</span>
              <span className={`px-2.5 py-1 rounded-lg ${bulkStep === "preview" ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "bg-slate-100 text-slate-600 dark:bg-white/[0.04] dark:text-slate-400"}`}>
                2. Validate & Inspect
              </span>
              <span>→</span>
              <span className={`px-2.5 py-1 rounded-lg ${bulkStep === "done" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/[0.04] dark:text-slate-400"}`}>
                3. Import Completed
              </span>
            </div>

            {/* Step 1: Input */}
            {bulkStep === "input" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-white/[0.08] file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200"
                  />
                  <Button variant="secondary" size="sm" onClick={downloadSampleCsv}>
                    ⬇️ Download Sample CSV
                  </Button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Or Paste CSV Data Directly:
                  </label>
                  <textarea
                    rows={8}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="Name,Email,RegisterNumber,Department,Batch,Section,Semester,Phone&#10;John Doe,john.doe@college.edu,REG2026001,ECE,2023-2027,A,1,9876543210"
                    className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowBulkModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleValidateCsv}
                    disabled={validating || !csvText.trim()}
                  >
                    {validating ? "Validating Every Row..." : "Validate All Rows →"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Preview & Validation Inspection */}
            {bulkStep === "preview" && validationResults && (
              <div className="space-y-4">
                {/* Stats */}
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200">
                    Total Rows: {validationResults.total}
                  </span>
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    ✓ Valid: {validationResults.validCount}
                  </span>
                  {validationResults.errorCount > 0 ? (
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">
                      ⚠️ Errors: {validationResults.errorCount}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700">
                      No errors detected! Safe to import.
                    </span>
                  )}
                </div>

                {/* Table Preview */}
                <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200/80 dark:border-white/[0.08]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06] sticky top-0">
                      <tr>
                        <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">Row</th>
                        <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                        <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">Email</th>
                        <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">Reg No</th>
                        <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">Dept</th>
                        <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">Sec</th>
                        <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {validationResults.results.map((r) => (
                        <tr key={r.row} className={r.valid ? "hover:bg-slate-50/50" : "bg-red-50/40 dark:bg-red-950/20"}>
                          <td className="p-2.5 font-mono text-slate-400">{r.row}</td>
                          <td className="p-2.5 font-medium text-slate-900 dark:text-white">{r.data.name || "—"}</td>
                          <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">{r.data.email || "—"}</td>
                          <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">{r.data.registerNumber || "—"}</td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-300">{r.data.department || "—"}</td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-300">{r.data.section || "—"}</td>
                          <td className="p-2.5">
                            {r.valid ? (
                              <span className="px-1.5 py-0.5 rounded text-2xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                Valid
                              </span>
                            ) : (
                              <div className="text-2xs text-red-600 dark:text-red-400 font-semibold space-y-0.5">
                                {r.errors.map((e, idx) => (
                                  <div key={idx}>• {e}</div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="secondary" size="sm" onClick={() => setBulkStep("input")}>
                    ← Back & Edit CSV
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmImport}
                    disabled={importing || validationResults.validCount === 0}
                  >
                    {importing
                      ? "Importing..."
                      : `Confirm & Import (${validationResults.validCount} Students)`}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Done */}
            {bulkStep === "done" && importSummary && (
              <div className="space-y-4 py-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mx-auto">
                  ✓
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Bulk Onboarding Completed Successfully
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Imported <strong>{importSummary.importedCount}</strong> student accounts with permanent institutional profiles and course authorizations.
                </p>

                <div className="pt-2">
                  <Button variant="primary" size="sm" onClick={() => setShowBulkModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
