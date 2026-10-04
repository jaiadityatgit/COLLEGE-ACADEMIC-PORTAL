import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/exams")
      .then((res) => setExams(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-8 w-40 rounded-lg" />
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  const upcoming = exams.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = exams.filter(e => new Date(e.date) < new Date());

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Examinations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upcoming and past exam schedule</p>
        </div>

        {upcoming.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Upcoming Exams ({upcoming.length})
            </h2>
            <div className="space-y-3">
              {upcoming.map((e) => (
                <Card key={e._id} padding="md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{e.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">{e.type} Examination · {e.totalMarks} Marks</p>
                    </div>
                    <Badge variant={e.status === "scheduled" ? "warning" : "success"} size="sm">
                      {e.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.04] text-xs text-slate-500 dark:text-slate-400">
                    <span>Date: {new Date(e.date).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</span>
                    <span>Time: {e.startTime} — {e.endTime}</span>
                    <span>Max Marks: {e.totalMarks}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Past Exams ({past.length})
            </h2>
            <div className="space-y-2">
              {past.map((e) => (
                <Card key={e._id} padding="sm">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{e.title}</p>
                  <p className="text-2xs text-slate-400 dark:text-slate-500 mt-0.5">{new Date(e.date).toLocaleDateString()} · {e.totalMarks} Marks</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {exams.length === 0 && (
          <EmptyState
            title="No examinations scheduled"
            description="Upcoming exams will be displayed here when announced."
          />
        )}
      </div>
    </div>
  );
}
