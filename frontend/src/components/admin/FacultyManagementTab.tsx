import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { departmentService } from "../../services/department";
import { courseService } from "../../services/course";
import { teachingAssignmentService } from "../../services/teachingAssignment";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { EmptyState } from "../ui/EmptyState";

export const FacultyManagementTab: React.FC = () => {
  const [subView, setSubView] = useState<"assignments" | "faculty">("assignments");
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchFaculty, setSearchFaculty] = useState("");
  const [selectedYearFilter, setSelectedYearFilter] = useState("all");
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState("all");

  // Create Faculty Modal
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [facultyData, setFacultyData] = useState({
    name: "",
    email: "",
    employeeId: "",
    designation: "Assistant Professor",
    qualification: "M.Tech",
    departmentId: "",
    password: ""
  });
  const [savingFaculty, setSavingFaculty] = useState(false);

  // Create Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState({
    facultyId: "",
    courseId: "",
    academicYear: "2026-27",
    semester: 1,
    batchId: "",
    section: "A"
  });
  const [savingAssign, setSavingAssign] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, dRes, cRes, aRes] = await Promise.all([
        api.get("/users?role=faculty"),
        departmentService.getDepartments(),
        courseService.getCourses(),
        teachingAssignmentService.getAssignments()
      ]);
      const facs = fRes.data.data || [];
      const depts = dRes.data.data || [];
      const crss = cRes.data.data || [];
      setFacultyList(facs);
      setDepartments(depts);
      setCourses(crss);
      setAssignments(aRes.data.data || []);

      if (facs.length > 0 && !assignData.facultyId) {
        setAssignData((prev) => ({ ...prev, facultyId: facs[0]._id }));
      }
      if (crss.length > 0 && !assignData.courseId) {
        setAssignData((prev) => ({ ...prev, courseId: crss[0]._id }));
      }
      if (depts.length > 0 && !facultyData.departmentId) {
        setFacultyData((prev) => ({ ...prev, departmentId: depts[0]._id }));
      }
    } catch (err) {
      console.error("Failed to load faculty data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyData.name.trim() || !facultyData.email.trim() || !facultyData.employeeId.trim()) {
      alert("Name, email, and employee ID are required.");
      return;
    }
    setSavingFaculty(true);
    try {
      await api.post("/users/faculty", {
        name: facultyData.name.trim(),
        email: facultyData.email.trim(),
        employeeId: facultyData.employeeId.trim(),
        designation: facultyData.designation.trim() || undefined,
        qualification: facultyData.qualification.trim() || undefined,
        departmentId: facultyData.departmentId || undefined,
        password: facultyData.password.trim() || undefined
      });
      alert("Faculty account and permanent profile provisioned successfully!");
      setShowFacultyModal(false);
      setFacultyData({
        name: "",
        email: "",
        employeeId: "",
        designation: "Assistant Professor",
        qualification: "M.Tech",
        departmentId: departments[0]?._id || "",
        password: ""
      });
      fetchData();
    } catch (err: any) {
      console.error("Faculty provision error:", err);
      alert(err.response?.data?.error || "Failed to create faculty");
    } finally {
      setSavingFaculty(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignData.facultyId || !assignData.courseId || !assignData.academicYear.trim()) {
      alert("Faculty, Course, and Academic Year are required.");
      return;
    }
    setSavingAssign(true);
    try {
      await teachingAssignmentService.createAssignment({
        facultyId: assignData.facultyId,
        courseId: assignData.courseId,
        academicYear: assignData.academicYear.trim(),
        semester: Number(assignData.semester) || 1,
        batchId: assignData.batchId || undefined,
        section: assignData.section.trim() || undefined
      });
      alert("Teaching assignment created successfully!");
      setShowAssignModal(false);
      fetchData();
    } catch (err: any) {
      console.error("Create assignment error:", err);
      alert(err.response?.data?.error || "Failed to create teaching assignment");
    } finally {
      setSavingAssign(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!window.confirm("Are you sure you want to remove this teaching assignment?")) return;
    try {
      await teachingAssignmentService.removeAssignment(assignmentId);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to remove assignment");
    }
  };

  // Distinct academic years in assignments
  const distinctYears = Array.from(
    new Set(assignments.map((a) => a.academicYear).filter(Boolean))
  );

  const filteredAssignments = assignments.filter((a) => {
    const matchYear = selectedYearFilter === "all" || a.academicYear === selectedYearFilter;
    const matchFac =
      selectedFacultyFilter === "all" ||
      a.facultyId?._id === selectedFacultyFilter ||
      a.facultyId === selectedFacultyFilter;
    return matchYear && matchFac;
  });

  const filteredFaculty = facultyList.filter(
    (f) =>
      f.name?.toLowerCase().includes(searchFaculty.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchFaculty.toLowerCase()) ||
      f.facultyProfile?.employeeId?.toLowerCase().includes(searchFaculty.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>👨‍🏫</span> Faculty & Authoritative Teaching Assignments
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Permanent faculty accounts and dynamic multi-context teaching assignments (Course × Year × Section).
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => setShowFacultyModal(true)}>
            + Provision Faculty
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAssignModal(true)}>
            + Assign Course / Section
          </Button>
        </div>
      </div>

      {/* View Switcher: Assignments vs Faculty Roster */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
        <button
          onClick={() => setSubView("assignments")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            subView === "assignments"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Teaching Assignments ({assignments.length})
        </button>
        <button
          onClick={() => setSubView("faculty")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            subView === "faculty"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Faculty Profiles ({facultyList.length})
        </button>
      </div>

      {/* SubView 1: Teaching Assignments */}
      {subView === "assignments" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1c202c] text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Academic Years</option>
              {distinctYears.map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>

            <select
              value={selectedFacultyFilter}
              onChange={(e) => setSelectedFacultyFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1c202c] text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Faculty</option>
              {facultyList.map((f) => (
                <option key={f._id} value={f._id}>{f.name} ({f.email})</option>
              ))}
            </select>
          </div>

          {loading ? (
            <Card padding="lg" className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" />
            </Card>
          ) : filteredAssignments.length === 0 ? (
            <EmptyState
              title="No Teaching Assignments Found"
              description="Assign faculty to specific courses, academic years, and sections."
              action={
                <Button variant="primary" size="sm" onClick={() => setShowAssignModal(true)}>
                  + Assign Course / Section
                </Button>
              }
            />
          ) : (
            <div className="card shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Faculty Member</th>
                      <th>Course Assigned</th>
                      <th>Academic Year</th>
                      <th>Section</th>
                      <th>Semester</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((a) => {
                      const fac = a.facultyId;
                      const crs = a.courseId;
                      return (
                        <tr key={a._id}>
                          <td className="font-semibold text-slate-900 dark:text-white">
                            <div>{fac?.name || "Unknown Faculty"}</div>
                            <div className="text-2xs text-slate-400 font-mono">{fac?.email}</div>
                          </td>
                          <td>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {crs?.courseName || crs?.name || "—"}
                            </div>
                            <div className="text-2xs text-slate-400 font-mono">
                              {crs?.courseCode || crs?.code}
                            </div>
                          </td>
                          <td className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {a.academicYear}
                          </td>
                          <td>
                            {a.section ? (
                              <span className="px-2 py-0.5 rounded-md text-2xs font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                                Section {a.section}
                              </span>
                            ) : (
                              <span className="text-2xs text-slate-400 italic">All Sections</span>
                            )}
                          </td>
                          <td>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              Sem {a.semester}
                            </span>
                          </td>
                          <td>
                            <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              Active
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleRemoveAssignment(a._id)}
                              className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 font-medium"
                            >
                              Unassign
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SubView 2: Faculty Profiles */}
      {subView === "faculty" && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search faculty by name, institutional email, or employee ID..."
            value={searchFaculty}
            onChange={(e) => setSearchFaculty(e.target.value)}
            className="w-full sm:w-96 px-4 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#1c202c] text-slate-900 dark:text-white focus:outline-none"
          />

          <div className="card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Faculty Name</th>
                    <th>Institutional Email</th>
                    <th>Employee ID</th>
                    <th>Designation</th>
                    <th>Qualification</th>
                    <th>Department</th>
                    <th>Account</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculty.map((f) => {
                    const prof = f.facultyProfile;
                    const dept = prof?.departmentId;
                    const deptDisplay = dept?.departmentCode || dept?.departmentName || "—";
                    return (
                      <tr key={f._id}>
                        <td className="font-semibold text-slate-900 dark:text-white">
                          {f.name}
                        </td>
                        <td className="text-slate-600 dark:text-slate-300 font-mono text-xs">
                          {f.email}
                        </td>
                        <td className="text-slate-800 dark:text-slate-200 font-mono font-medium text-xs">
                          {prof?.employeeId || "—"}
                        </td>
                        <td className="text-xs text-slate-700 dark:text-slate-300">
                          {prof?.designation || "Faculty"}
                        </td>
                        <td className="text-xs text-slate-700 dark:text-slate-300">
                          {prof?.qualification || "—"}
                        </td>
                        <td>
                          <span className="px-2 py-0.5 rounded-md text-2xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
                            {deptDisplay}
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
        </div>
      )}

      {/* Provision Faculty Modal */}
      {showFacultyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#1c202c] rounded-2xl p-6 shadow-float border border-slate-200 dark:border-white/10 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>👨‍🏫</span> Provision Faculty Account
              </h3>
              <button
                onClick={() => setShowFacultyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Creates a permanent institutional account with employee profile. Faculty can be assigned to multiple courses across academic years.
            </p>

            <form onSubmit={handleCreateFaculty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Smith"
                  value={facultyData.name}
                  onChange={(e) => setFacultyData({ ...facultyData, name: e.target.value })}
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
                    placeholder="jane.smith@college.edu"
                    value={facultyData.email}
                    onChange={(e) => setFacultyData({ ...facultyData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="FAC202601"
                    value={facultyData.employeeId}
                    onChange={(e) => setFacultyData({ ...facultyData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="Associate Professor"
                    value={facultyData.designation}
                    onChange={(e) => setFacultyData({ ...facultyData, designation: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    placeholder="Ph.D. / M.Tech"
                    value={facultyData.qualification}
                    onChange={(e) => setFacultyData({ ...facultyData, qualification: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={facultyData.departmentId}
                  onChange={(e) => setFacultyData({ ...facultyData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.departmentCode} - {d.departmentName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Defaults to Faculty@123"
                  value={facultyData.password}
                  onChange={(e) => setFacultyData({ ...facultyData, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowFacultyModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={savingFaculty}>
                  {savingFaculty ? "Provisioning..." : "Provision Faculty"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teaching Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#1c202c] rounded-2xl p-6 shadow-float border border-slate-200 dark:border-white/10 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🔗</span> Authoritative Teaching Assignment
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Links a faculty member to a specific course, academic session, semester, and section cohort.
            </p>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Faculty Member *
                </label>
                <select
                  required
                  value={assignData.facultyId}
                  onChange={(e) => setAssignData({ ...assignData, facultyId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                >
                  {facultyList.map((f) => (
                    <option key={f._id} value={f._id}>{f.name} ({f.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Course *
                </label>
                <select
                  required
                  value={assignData.courseId}
                  onChange={(e) => setAssignData({ ...assignData, courseId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.courseCode || c.code} - {c.courseName || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="2026-27"
                    value={assignData.academicYear}
                    onChange={(e) => setAssignData({ ...assignData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semester *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={assignData.semester}
                    onChange={(e) => setAssignData({ ...assignData, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder="A"
                    value={assignData.section}
                    onChange={(e) => setAssignData({ ...assignData, section: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="secondary" size="sm" type="button" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={savingAssign}>
                  {savingAssign ? "Assigning..." : "Create Assignment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
