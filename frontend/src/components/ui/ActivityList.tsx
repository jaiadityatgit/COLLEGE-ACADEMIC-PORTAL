import React from "react";

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string | Date;
  type?: "exam" | "attendance" | "grade" | "announcement" | "assignment" | "system";
  badge?: string;
  avatarText?: string;
}

export interface ActivityListProps {
  items: ActivityItem[];
  emptyText?: string;
  maxItems?: number;
  className?: string;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  items,
  emptyText = "No recent activity to show",
  maxItems = 10,
  className = "",
}) => {
  const dotColors = {
    exam: "bg-sky-500 ring-sky-100 dark:ring-sky-500/20",
    attendance: "bg-emerald-500 ring-emerald-100 dark:ring-emerald-500/20",
    grade: "bg-amber-500 ring-amber-100 dark:ring-amber-500/20",
    announcement: "bg-neutral-900 dark:bg-white ring-slate-100 dark:ring-white/20",
    assignment: "bg-rose-500 ring-rose-100 dark:ring-rose-500/20",
    system: "bg-slate-400 ring-slate-100 dark:ring-slate-500/20",
  };

  const displayed = items.slice(0, maxItems);

  if (displayed.length === 0) {
    return (
      <div className={`py-8 text-center text-xs text-slate-400 dark:text-slate-500 ${className}`}>
        {emptyText}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {displayed.map((item) => {
        const timeStr = typeof item.timestamp === "string" ? item.timestamp : item.timestamp.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] hover:bg-slate-100/70 dark:hover:bg-white/[0.04] transition-colors"
          >
            <div className="mt-1 flex-shrink-0">
              <span className={`w-2 h-2 rounded-full inline-block ring-4 ${dotColors[item.type || "system"]}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {item.title}
                </p>
                <span className="text-2xs font-mono text-slate-400 dark:text-slate-500 flex-shrink-0">
                  {timeStr}
                </span>
              </div>
              {item.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>

            {item.badge && (
              <span className="px-2 py-0.5 rounded-full text-2xs font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 flex-shrink-0">
                {item.badge}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
