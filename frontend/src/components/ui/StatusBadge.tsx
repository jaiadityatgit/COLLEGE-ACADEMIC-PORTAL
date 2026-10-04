import React from "react";

export type StatusType =
  | "present"
  | "absent"
  | "late"
  | "od"
  | "active"
  | "inactive"
  | "pending"
  | "approved"
  | "rejected"
  | "draft"
  | "published"
  | "urgent"
  | "normal"
  | "low"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  size?: "sm" | "md";
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = "md",
  showDot = true,
  className = "",
}) => {
  const norm = String(status || "").toLowerCase().trim();

  let styles = "bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-slate-300 border-slate-200/60 dark:border-white/[0.06]";
  let dotColor = "bg-slate-400";
  let displayLabel = label || status;

  if (["present", "active", "approved", "success", "published"].includes(norm)) {
    styles = "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-500/20";
    dotColor = "bg-emerald-500";
    if (!label) displayLabel = norm === "present" ? "Present" : norm === "active" ? "Active" : norm === "approved" ? "Approved" : "Success";
  } else if (["absent", "danger", "rejected", "critical", "inactive"].includes(norm)) {
    styles = "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border-rose-200/50 dark:border-rose-500/20";
    dotColor = "bg-rose-500";
    if (!label) displayLabel = norm === "absent" ? "Absent" : norm === "inactive" ? "Inactive" : norm === "rejected" ? "Rejected" : "Critical";
  } else if (["late", "warning", "pending", "urgent"].includes(norm)) {
    styles = "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200/50 dark:border-amber-500/20";
    dotColor = "bg-amber-500";
    if (!label) displayLabel = norm === "late" ? "Late" : norm === "pending" ? "Pending" : norm === "urgent" ? "Urgent" : "Warning";
  } else if (["od", "info", "scheduled"].includes(norm)) {
    styles = "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 border-sky-200/50 dark:border-sky-500/20";
    dotColor = "bg-sky-500";
    if (!label) displayLabel = norm === "od" ? "On Duty" : norm === "scheduled" ? "Scheduled" : "Info";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-2xs gap-1",
    md: "px-2.5 py-0.5 text-xs gap-1.5",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${styles} ${sizeClasses[size]} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />}
      <span className="capitalize">{displayLabel}</span>
    </span>
  );
};
