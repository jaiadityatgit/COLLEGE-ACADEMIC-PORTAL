import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";

export default function AnnouncementsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/announcements")
      .then((res) => setItems(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[900px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-8 w-40 rounded-lg" />
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[900px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Official Academic Notices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Authoritative announcements from your college, department, section, and enrolled courses</p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="No announcements"
            description="Official announcements from college, department, section, and courses will appear here."
          />
        ) : (
          <div className="space-y-4">
            {items.map((a: any) => {
              const categoryBadges: Record<string, { label: string; bg: string }> = {
                holiday: { label: "🏖️ Holiday", bg: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" },
                exam: { label: "📝 Examination", bg: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300" },
                deadline: { label: "⏰ Deadline", bg: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300" },
                schedule: { label: "📅 Schedule", bg: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300" },
                instruction: { label: "📋 Instruction", bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" },
                general: { label: "📢 General", bg: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" },
              };
              const catInfo = categoryBadges[a.category] || categoryBadges.general;

              const scopeLabels: Record<string, string> = {
                college: "College Notice",
                department: "Department Notice",
                batch: "Cohort / Batch Notice",
                section: `Section ${a.section || ""} Notice`,
                course: "Course Notice"
              };

              return (
                <Card
                  key={a._id}
                  padding="md"
                  className={a.priority === "urgent" || a.priority === "high" ? "border-rose-300 dark:border-rose-500/30" : ""}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${a.priority === "urgent" || a.priority === "high" ? "bg-rose-500 animate-pulse" : "bg-neutral-900 dark:bg-neutral-100"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${catInfo.bg}`}>
                              {catInfo.label}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-2xs font-medium bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300">
                              {scopeLabels[a.audience] || a.audience}
                            </span>
                            {(a.priority === "urgent" || a.priority === "high") && (
                              <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-red-100 text-red-800">
                                URGENT
                              </span>
                            )}
                          </div>
                          <p className="text-base font-semibold text-slate-900 dark:text-white">{a.title}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">{a.body}</p>
                      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-white/[0.04] text-2xs text-slate-400 dark:text-slate-500 font-mono">
                        <span>{a.authorId?.name ? `Published by ${a.authorId.name}` : "Official Notice"}</span>
                        <span>{new Date(a.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
