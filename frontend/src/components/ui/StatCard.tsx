import React from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: "slate" | "sky" | "emerald" | "amber" | "rose" | "dark";
  badge?: {
    text?: string;
    label?: string;
    variant?: "success" | "warning" | "danger" | "info" | "neutral";
  };
  linkText?: string;
  onLinkClick?: () => void;
  onClick?: () => void;
  ringProgress?: number;
  ringColor?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  iconBg = "slate",
  badge,
  linkText,
  onLinkClick,
  onClick,
  ringProgress,
  ringColor,
  className = "",
}) => {
  const iconBgClasses = {
    slate: "bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300",
    sky: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-500/20",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-500/20",
    rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-500/20",
    dark: "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs",
  };

  const badgeVariants = {
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/20",
    warning: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-200/50 dark:border-amber-500/20",
    danger: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 border border-rose-200/50 dark:border-rose-500/20",
    info: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 border border-sky-200/50 dark:border-sky-500/20",
    neutral: "bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.04]",
  };

  const handleClick = onClick || onLinkClick;
  const isClickable = !!handleClick;
  const badgeText = badge ? (badge.label || badge.text || "") : "";

  return (
    <div
      onClick={handleClick}
      className={`bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-xs transition-all duration-200 flex flex-col justify-between ${
        isClickable ? "hover:shadow-card hover:-translate-y-0.5 cursor-pointer hover:border-slate-300 dark:hover:border-white/10 group" : ""
      } ${className}`}
    >
      <div>
        {/* Row 1: Icon on left, Badge on right */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          {icon ? (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-semibold ${iconBgClasses[iconBg]}`}>
              {icon}
            </div>
          ) : (
            <div className="w-1 h-1" />
          )}

          {badge && badgeText ? (
            <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold flex-shrink-0 ${badgeVariants[badge.variant || "neutral"]}`}>
              {badgeText}
            </span>
          ) : null}
        </div>

        {/* Row 2: Label (Full width, no truncation squeeze) */}
        <p className="text-2xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider line-clamp-1">
          {label}
        </p>

        {/* Row 3: Value & Progress Ring */}
        <div className="flex items-baseline justify-between gap-2 mt-1">
          <div className="min-w-0">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {value}
            </p>
            {subtitle && (
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>

          {typeof ringProgress === "number" && (
            <div className="relative w-11 h-11 flex-shrink-0">
              <svg className="-rotate-90 w-11 h-11" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  className="text-slate-100 dark:text-white/[0.06]"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke={ringColor || "#059669"}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${(ringProgress / 100) * (2 * Math.PI * 20)} ${2 * Math.PI * 20}`}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-200">
                {Math.round(ringProgress)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optional bottom link */}
      {linkText && (
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.04] text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-black dark:group-hover:text-white transition-colors">
          <span>{linkText}</span>
          <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
        </div>
      )}
    </div>
  );
};
