import React from "react";
import { Link } from "react-router-dom";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: React.ReactNode;
  badges?: Array<{ label: string; variant?: string } | React.ReactNode>;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  badge,
  badges,
  actions,
  className = "",
}) => {
  const getBadgeClass = (variant?: string) => {
    switch (variant) {
      case "success":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20";
      case "warning":
        return "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/20";
      case "danger":
        return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20";
      case "info":
        return "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 border border-sky-200/60 dark:border-sky-500/20";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.04]";
    }
  };

  return (
    <div className={`flex flex-col gap-3 pb-6 border-b border-slate-200/70 dark:border-white/[0.06] ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
                {crumb.href && !isLast ? (
                  <Link
                    to={crumb.href}
                    className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? "text-slate-700 dark:text-slate-200 font-semibold" : ""}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {badge && <div className="flex-shrink-0">{badge}</div>}
            {badges &&
              badges.map((b, idx) => {
                if (React.isValidElement(b)) {
                  return <div key={idx} className="flex-shrink-0">{b}</div>;
                }
                const badgeObj = b as { label: string; variant?: string };
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-semibold ${getBadgeClass(badgeObj.variant)}`}
                  >
                    {badgeObj.label}
                  </span>
                );
              })}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
