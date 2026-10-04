import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";

export default function FacultySubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSem, setSelectedSem] = useState<string>("all");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/courses")
      .then((res) => setSubjects(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const availableYears = useMemo(() => {
    const set = new Set<string>();
    subjects.forEach((s) => {
      if (s.academicYear) set.add(s.academicYear);
    });
    return Array.from(set);
  }, [subjects]);

  const availableSemesters = useMemo(() => {
    const set = new Set<string>();
    subjects.forEach((s) => {
      if (s.semester) set.add(s.semester);
    });
    return Array.from(set);
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (selectedYear !== "all" && s.academicYear !== selectedYear) return false;
      if (selectedSem !== "all" && s.semester !== selectedSem) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!s.name?.toLowerCase().includes(q) && !s.courseCode?.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [subjects, selectedYear, selectedSem, searchQuery]);

  if (loading) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const isContextFiltered = selectedYear !== "all" || selectedSem !== "all";

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Teaching Subjects</h1>
              {isContextFiltered && (
                <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-100 text-amber-800">
                  Filtered Context
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Active Teaching Assignments · {filteredSubjects.length} of {subjects.length} courses in scope
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {availableYears.length > 0 && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="input py-1.5 px-3 text-xs w-auto font-medium"
              >
                <option value="all">All Academic Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            )}

            {availableSemesters.length > 0 && (
              <select
                value={selectedSem}
                onChange={(e) => setSelectedSem(e.target.value)}
                className="input py-1.5 px-3 text-xs w-auto font-medium"
              >
                <option value="all">All Semesters</option>
                {availableSemesters.map((sem) => (
                  <option key={sem} value={sem}>{sem.toLowerCase().includes("sem") ? sem : `Semester ${sem}`}</option>
                ))}
              </select>
            )}

            <input
              type="text"
              placeholder="Search subjects…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full sm:w-48 py-1.5 text-xs"
            />
          </div>
        </div>

        {filteredSubjects.length === 0 ? (
          <EmptyState
            title={`No subjects found matching "${searchQuery}"`}
            description="Try clearing your search query."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubjects.map((s) => (
              <Card
                key={s._id}
                variant="interactive"
                padding="md"
                className="group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white ${s.courseType === "lab" ? "bg-emerald-600" : "bg-neutral-900"}`}>
                      {s.courseCode?.slice(-2) || "??"}
                    </div>
                    <Badge variant={s.courseType === "lab" ? "success" : "info"} size="sm">
                      {s.credits || 3} cr
                    </Badge>
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.courseCode} · {s.courseType === "lab" ? "Laboratory" : "Theory"}</p>

                  <p className="text-2xs text-gray-400 dark:text-gray-500 mt-3 pt-2 border-t border-gray-100 dark:border-white/[0.04]">
                    {s.studentIds?.length || s.studentCount || 0} enrolled students
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-white/[0.04]">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); navigate(`/faculty/subjects/${s._id}/attendance`); }}
                  >
                    Attendance
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); navigate(`/faculty/subjects/${s._id}`); }}
                  >
                    Manage Workspace
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
