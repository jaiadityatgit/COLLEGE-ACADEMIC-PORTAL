import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { academicStructureService, AcademicHierarchyNode } from "../../services/academicStructure";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { LoadingSpinner } from "../ui/LoadingSpinner";

export const AcademicStructureTab: React.FC = () => {
  const [hierarchy, setHierarchy] = useState<AcademicHierarchyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded nodes state: key is node identifier
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Modals state
  const [showYearModal, setShowYearModal] = useState(false);
  const [yearData, setYearData] = useState({ year: "", name: "", isCurrent: true });
  const [savingYear, setSavingYear] = useState(false);

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchData, setBatchData] = useState({
    name: "",
    code: "",
    departmentId: "",
    startYear: 2026,
    endYear: 2030,
    section: "A",
    academicYear: "2026-27"
  });
  const [savingBatch, setSavingBatch] = useState(false);

  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [transitionData, setTransitionData] = useState({
    targetSemester: 2,
    academicYear: "",
    departmentId: "",
    batchId: ""
  });
  const [transitioning, setTransitioning] = useState(false);

  const fetchHierarchy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await academicStructureService.getHierarchy();
      const raw: any = res.data.data;
      const rawList: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.hierarchy)
        ? raw.hierarchy
        : [];

      const normalizedData: AcademicHierarchyNode[] = rawList.map((y: any, yIdx: number) => ({
        year: y.year || y.academicYear || `Year-${yIdx + 1}`,
        isCurrent: y.isCurrent ?? (y.academicYear === "2026-27" || yIdx === 0),
        departments: (y.departments || []).map((d: any) => ({
          departmentId: d.departmentId || d._id?.toString() || `dept-${Math.random()}`,
          departmentCode: d.departmentCode || "DEPT",
          departmentName: d.departmentName || "Department",
          batches: (d.batches || []).map((b: any) => {
            if (Array.isArray(b.sections) && b.sections.length > 0) {
              return {
                batchId: b.batchId || b._id?.toString() || `batch-${Math.random()}`,
                batchName: b.batchName || b.name || "Batch",
                currentSemester: b.currentSemester || 1,
                sections: b.sections
              };
            }
            const sections = [
              {
                section: b.section || "A",
                studentCount: b.studentCount || 0,
                courses: (b.semesters || []).flatMap((sem: any) =>
                  (sem.courses || []).map((c: any) => ({
                    courseId: c.courseId || c._id?.toString() || "",
                    courseCode: c.courseCode || "EC",
                    courseName: c.courseName || c.name || "Course",
                    semester: sem.number || 1,
                    faculty: (c.facultyAssignments || []).map((fa: any) => ({
                      facultyId: fa.facultyId?._id || fa.facultyId || "",
                      name: fa.facultyName || "Faculty",
                      email: fa.facultyEmail || ""
                    }))
                  }))
                )
              }
            ];
            return {
              batchId: b.batchId || b._id?.toString() || `batch-${Math.random()}`,
              batchName: b.batchName || b.name || "Batch",
              currentSemester: b.currentSemester || (b.semesters?.[0]?.number) || 1,
              sections
            };
          })
        }))
      }));

      setHierarchy(normalizedData);

      // Auto-expand first year and first department by default
      const initialExpanded: Record<string, boolean> = {};
      normalizedData.forEach((node, yIdx) => {
        const yKey = `year-${node.year}`;
        if (yIdx === 0 || node.isCurrent) initialExpanded[yKey] = true;
        (node.departments || []).forEach((dept) => {
          const dKey = `${yKey}-dept-${dept.departmentId}`;
          if (yIdx === 0) initialExpanded[dKey] = true;
          (dept.batches || []).forEach((b) => {
            const bKey = `${dKey}-batch-${b.batchId}`;
            if (yIdx === 0) initialExpanded[bKey] = true;
          });
        });
      });
      setExpandedNodes(initialExpanded);
    } catch (err: any) {
      console.error("Failed to load academic hierarchy:", err);
      setError(err.response?.data?.error || "Failed to load academic structure.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const toggleNode = (key: string) => {
    setExpandedNodes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    (hierarchy || []).forEach((y) => {
      const yKey = `year-${y.year}`;
      all[yKey] = true;
      (y.departments || []).forEach((d) => {
        const dKey = `${yKey}-dept-${d.departmentId}`;
        all[dKey] = true;
        (d.batches || []).forEach((b) => {
          const bKey = `${dKey}-batch-${b.batchId}`;
          all[bKey] = true;
          (b.sections || []).forEach((s) => {
            all[`${bKey}-sec-${s.section}`] = true;
          });
        });
      });
    });
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearData.year.trim()) return;
    setSavingYear(true);
    try {
      await academicStructureService.createAcademicYear({
        year: yearData.year.trim(),
        name: yearData.name.trim() || undefined,
        isCurrent: yearData.isCurrent
      });
      setShowYearModal(false);
      setYearData({ year: "", name: "", isCurrent: true });
      fetchHierarchy();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to register academic year");
    } finally {
      setSavingYear(false);
    }
  };

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transitionData.targetSemester < 1) return;
    if (!window.confirm(`Are you sure you want to transition students to Semester ${transitionData.targetSemester}? This non-destructively updates the active semester.`)) {
      return;
    }
    setTransitioning(true);
    try {
      const res = await academicStructureService.transitionSemester({
        targetSemester: Number(transitionData.targetSemester),
        academicYear: transitionData.academicYear || undefined,
        departmentId: transitionData.departmentId || undefined,
        batchId: transitionData.batchId || undefined
      });
      alert(`Semester transition completed successfully! ${res.data.data.studentsPromoted} students and ${res.data.data.batchesPromoted} batches advanced.`);
      setShowTransitionModal(false);
      fetchHierarchy();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to transition semester");
    } finally {
      setTransitioning(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchData.name.trim() || !batchData.code.trim()) return;
    setSavingBatch(true);
    try {
      // Find first department if not selected
      const firstDeptId = safeHierarchy[0]?.departments?.[0]?.departmentId;
      await api.post("/batches", {
        name: batchData.name.trim(),
        code: batchData.code.trim().toUpperCase(),
        departmentId: batchData.departmentId || firstDeptId,
        startYear: Number(batchData.startYear) || 2026,
        endYear: Number(batchData.endYear) || 2030,
        section: batchData.section.trim().toUpperCase() || "A",
        academicYear: batchData.academicYear.trim() || "2026-27"
      });
      alert("Batch / Cohort registered successfully!");
      setShowBatchModal(false);
      setBatchData({
        name: "",
        code: "",
        departmentId: "",
        startYear: 2026,
        endYear: 2030,
        section: "A",
        academicYear: "2026-27"
      });
      fetchHierarchy();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create batch");
    } finally {
      setSavingBatch(false);
    }
  };

  // Safe Stats calculation
  const safeHierarchy = Array.isArray(hierarchy) ? hierarchy : [];
  const totalYears = safeHierarchy.length;
  const totalDepts = new Set(safeHierarchy.flatMap((y) => (y.departments || []).map((d) => d.departmentId))).size;
  const totalSections = safeHierarchy.reduce((acc, y) => {
    return acc + (y.departments || []).reduce((dAcc, d) => {
      return dAcc + (d.batches || []).reduce((bAcc, b) => bAcc + (b.sections || []).length, 0);
    }, 0);
  }, 0);
  const totalStudents = safeHierarchy.reduce((acc, y) => {
    return acc + (y.departments || []).reduce((dAcc, d) => {
      return dAcc + (d.batches || []).reduce((bAcc, b) => {
        return bAcc + (b.sections || []).reduce((sAcc, s) => sAcc + (s.studentCount || 0), 0);
      }, 0);
    }, 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>🏛️</span> Academic Institutional Hierarchy
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authoritative institutional structure: Academic Year → Department → Batch → Section → Semester → Courses
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="secondary" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowTransitionModal(true)}>
            🚀 Semester Transition
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowBatchModal(true)}>
            + Add Batch / Cohort
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowYearModal(true)}>
            + Register Academic Year
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#1c202c] border border-slate-200/80 dark:border-white/[0.06] shadow-xs">
          <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Academic Years</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{totalYears}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#1c202c] border border-slate-200/80 dark:border-white/[0.06] shadow-xs">
          <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Departments</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{totalDepts}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#1c202c] border border-slate-200/80 dark:border-white/[0.06] shadow-xs">
          <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Active Sections</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{totalSections}</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#1c202c] border border-slate-200/80 dark:border-white/[0.06] shadow-xs">
          <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">Enrolled Students</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{totalStudents}</p>
        </div>
      </div>

      {/* Hierarchy Visual Tree */}
      {loading ? (
        <Card padding="lg" className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
        </Card>
      ) : error ? (
        <Card padding="md" className="border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-300 text-sm">
          {error}
        </Card>
      ) : safeHierarchy.length === 0 ? (
        <EmptyState
          title="No Academic Structure Found"
          description="Register your first Academic Year to begin organizing departments, sections, and courses."
          action={
            <Button variant="primary" size="sm" onClick={() => setShowYearModal(true)}>
              + Register Academic Year
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {safeHierarchy.map((yearNode) => {
            const yearKey = `year-${yearNode.year}`;
            const isYearExpanded = !!expandedNodes[yearKey];

            return (
              <div
                key={yearNode.year}
                className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1c202c] overflow-hidden shadow-xs transition-all"
              >
                {/* Academic Year Header Node */}
                <div
                  onClick={() => toggleNode(yearKey)}
                  className="px-5 py-4 bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200/60 dark:border-white/[0.04] flex items-center justify-between cursor-pointer hover:bg-slate-100/70 dark:hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs font-mono font-bold">
                      {isYearExpanded ? "▼" : "▶"}
                    </span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      📅 {yearNode.year}
                    </span>
                    {yearNode.isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Active Year
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>{(yearNode.departments || []).length} Departments</span>
                  </div>
                </div>

                {/* Departments Branch */}
                {isYearExpanded && (
                  <div className="p-4 sm:p-5 space-y-4">
                    {(yearNode.departments || []).length === 0 ? (
                      <p className="text-xs text-slate-400 italic pl-6">No departments configured for this academic year.</p>
                    ) : (
                      yearNode.departments.map((dept) => {
                        const deptKey = `${yearKey}-dept-${dept.departmentId}`;
                        const isDeptExpanded = !!expandedNodes[deptKey];

                        return (
                          <div
                            key={dept.departmentId}
                            className="rounded-xl border border-slate-200/60 dark:border-white/[0.05] bg-slate-50/40 dark:bg-white/[0.01] overflow-hidden"
                          >
                            {/* Department Node */}
                            <div
                              onClick={() => toggleNode(deptKey)}
                              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-slate-400 text-2xs font-mono">
                                  {isDeptExpanded ? "▼" : "▶"}
                                </span>
                                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                                  🏢 {dept.departmentCode} — {dept.departmentName}
                                </span>
                              </div>
                              <span className="text-2xs text-slate-400 font-medium">
                                {(dept.batches || []).length} Batches
                              </span>
                            </div>

                            {/* Batches Branch */}
                            {isDeptExpanded && (
                              <div className="px-4 pb-4 pt-1 space-y-3 pl-8 border-t border-slate-200/40 dark:border-white/[0.03]">
                                {(dept.batches || []).length === 0 ? (
                                  <p className="text-2xs text-slate-400 italic py-2">No batches in this department.</p>
                                ) : (
                                  dept.batches.map((batch) => {
                                    const batchKey = `${deptKey}-batch-${batch.batchId}`;
                                    const isBatchExpanded = !!expandedNodes[batchKey];

                                    return (
                                      <div
                                        key={batch.batchId}
                                        className="rounded-lg border border-slate-200/50 dark:border-white/[0.04] bg-white dark:bg-[#161922] p-3"
                                      >
                                        {/* Batch Node */}
                                        <div
                                          onClick={() => toggleNode(batchKey)}
                                          className="flex items-center justify-between cursor-pointer"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="text-slate-400 text-2xs font-mono">
                                              {isBatchExpanded ? "▼" : "▶"}
                                            </span>
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                              🎓 Cohort / Batch: {batch.batchName}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded text-2xs font-medium bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                              Sem {batch.currentSemester}
                                            </span>
                                          </div>
                                          <span className="text-2xs text-slate-400">
                                            {(batch.sections || []).length} Sections
                                          </span>
                                        </div>

                                        {/* Sections Branch */}
                                        {isBatchExpanded && (
                                          <div className="mt-3 space-y-2 pl-4 border-l-2 border-slate-200 dark:border-neutral-800 ml-1">
                                            {(batch.sections || []).map((sec) => (
                                              <div
                                                key={sec.section}
                                                className="p-3 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.03] space-y-2"
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                                                      Section {sec.section}
                                                    </span>
                                                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                                                      👥 {sec.studentCount} Students
                                                    </span>
                                                  </div>
                                                  <span className="text-2xs text-slate-400">
                                                    {(sec.courses || []).length} Assigned Courses
                                                  </span>
                                                </div>

                                                {/* Courses under Section */}
                                                {(sec.courses || []).length > 0 ? (
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                    {sec.courses.map((crs) => (
                                                      <div
                                                        key={crs.courseId}
                                                        className="p-2 rounded-md bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-white/[0.04] text-xs space-y-1"
                                                      >
                                                        <div className="flex items-center justify-between">
                                                          <span className="font-semibold text-slate-900 dark:text-white">
                                                            📖 {crs.courseCode} — {crs.courseName}
                                                          </span>
                                                          <span className="text-2xs text-slate-400 font-mono">
                                                            Sem {crs.semester}
                                                          </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-wrap text-2xs">
                                                          <span className="text-slate-400 font-medium">Faculty:</span>
                                                          {crs.faculty && crs.faculty.length > 0 ? (
                                                            crs.faculty.map((f) => (
                                                              <span
                                                                key={f.facultyId}
                                                                className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium"
                                                                title={f.email}
                                                              >
                                                                {f.name}
                                                              </span>
                                                            ))
                                                          ) : (
                                                            <span className="text-amber-600 dark:text-amber-400 italic">
                                                              Unassigned
                                                            </span>
                                                          )}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <p className="text-2xs text-slate-400 italic">No courses linked yet for this section.</p>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Register Academic Year Modal */}
      {showYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#1c202c] rounded-2xl p-6 shadow-float border border-slate-200 dark:border-white/10 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Register Academic Year
              </h3>
              <button
                onClick={() => setShowYearModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateYear} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Year Code (e.g. 2026–27) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="2026-27"
                  value={yearData.year}
                  onChange={(e) => setYearData({ ...yearData, year: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Display Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Academic Session 2026–2027"
                  value={yearData.name}
                  onChange={(e) => setYearData({ ...yearData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isCurrent"
                  checked={yearData.isCurrent}
                  onChange={(e) => setYearData({ ...yearData, isCurrent: e.target.checked })}
                  className="rounded text-neutral-900 focus:ring-0"
                />
                <label htmlFor="isCurrent" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Set as current authoritative academic year
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowYearModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={savingYear}>
                  {savingYear ? "Registering..." : "Save Academic Year"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Semester Transition Modal */}
      {showTransitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#1c202c] rounded-2xl p-6 shadow-float border border-slate-200 dark:border-white/10 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🚀</span> Semester Transition
              </h3>
              <button
                onClick={() => setShowTransitionModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Non-destructively advances students & cohorts to the next semester. Permanent user accounts, historical grades, and past attendance remain untouched.
            </p>

            <form onSubmit={handleTransition} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Semester *
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  required
                  value={transitionData.targetSemester}
                  onChange={(e) => setTransitionData({ ...transitionData, targetSemester: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Academic Year (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2026-27"
                  value={transitionData.academicYear}
                  onChange={(e) => setTransitionData({ ...transitionData, academicYear: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
                ⚠️ <strong>Safety Principle:</strong> No student records will be deleted or recreated. The active academic context will be updated cleanly.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowTransitionModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={transitioning}>
                  {transitioning ? "Advancing..." : "Confirm & Advance Semester"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Creation Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#1c202c] rounded-2xl p-6 shadow-float border border-slate-200 dark:border-white/10 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🎓</span> Register Batch / Cohort
              </h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create an authoritative student cohort linked to an academic year, department, and section.
            </p>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Batch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-2030 I ECE A"
                  value={batchData.name}
                  onChange={(e) => setBatchData({ ...batchData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batch Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ECE-I-2026"
                    value={batchData.code}
                    onChange={(e) => setBatchData({ ...batchData, code: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder="A"
                    value={batchData.section}
                    onChange={(e) => setBatchData({ ...batchData, section: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Year
                  </label>
                  <input
                    type="number"
                    value={batchData.startYear}
                    onChange={(e) => setBatchData({ ...batchData, startYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Year
                  </label>
                  <input
                    type="number"
                    value={batchData.endYear}
                    onChange={(e) => setBatchData({ ...batchData, endYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    placeholder="2026-27"
                    value={batchData.academicYear}
                    onChange={(e) => setBatchData({ ...batchData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowBatchModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={savingBatch}>
                  {savingBatch ? "Saving..." : "Create Batch"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
