import React, { useEffect, useState } from "react";
import { hodService } from "../../services/hodService";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";

interface FacultyMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  qualification: string;
  specialization: string[];
  experience: number;
  employeeId: string;
  officeHours: string;
  subjectsHandled: { _id: string; name: string; courseCode: string }[];
  teachingHours: number;
  attendanceSessionsMarked: number;
  assignmentsCreated: number;
  pendingGrading: number;
  lastActivity: { action: string; timestamp: string } | null;
  lastLogin: string | null;
}

export default function HODFacultyPage() {
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "workload" | "attendance">("name");

  useEffect(() => {
    hodService.getFacultyDirectory()
      .then(setFaculty)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = faculty
    .filter(f => {
      const q = search.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || f.designation.toLowerCase().includes(q) || f.specialization.some(s => s.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "workload": return b.teachingHours - a.teachingHours;
        case "attendance": return b.attendanceSessionsMarked - a.attendanceSessionsMarked;
        default: return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Faculty Directory</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{faculty.length} faculty members in department</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search faculty…"
              className="input w-full sm:w-64"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input w-36"
            >
              <option value="name">Sort: Name</option>
              <option value="workload">Sort: Workload</option>
              <option value="attendance">Sort: Attendance</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card padding="md">
            <p className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total Faculty</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{faculty.length}</p>
          </Card>
          <Card padding="md">
            <p className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Avg Workload</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {faculty.length > 0 ? Math.round(faculty.reduce((a, f) => a + (f.teachingHours || 0), 0) / faculty.length) : 0} hrs/wk
            </p>
          </Card>
          <Card padding="md">
            <p className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sessions Marked</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {faculty.reduce((a, f) => a + (f.attendanceSessionsMarked || 0), 0)}
            </p>
          </Card>
          <Card padding="md">
            <p className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Assignments Created</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {faculty.reduce((a, f) => a + (f.assignmentsCreated || 0), 0)}
            </p>
          </Card>
        </div>

        {/* Faculty Grid */}
        {filtered.length === 0 ? (
          <EmptyState
            title={`No faculty matching "${search}"`}
            description="Try a different search query."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((f) => (
              <Card key={f._id} padding="md" className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-sm font-bold text-white shadow-xs flex-shrink-0">
                    {f.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{f.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{f.designation || "Assistant Professor"}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span>Email:</span>
                    <span className="font-mono text-2xs text-gray-900 dark:text-gray-100">{f.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span>Department:</span>
                    <span className="text-gray-900 dark:text-gray-100">Electronics Engineering</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span>Teaching Hours:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{f.teachingHours || 0} hrs/wk</span>
                  </div>
                </div>

                {f.subjectsHandled && f.subjectsHandled.length > 0 && (
                  <div className="pt-3 border-t border-gray-100 dark:border-white/[0.04] flex items-center gap-1.5 flex-wrap">
                    {f.subjectsHandled.map((s) => (
                      <Badge key={s._id} variant="info" size="sm">
                        {s.courseCode || s.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
