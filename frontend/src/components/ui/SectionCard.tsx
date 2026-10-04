import React from "react";

export interface SectionCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerAction?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  icon,
  headerAction,
  action,
  footer,
  padding = "md",
  className = "",
  children,
}) => {
  const paddingStyles = {
    none: "p-0",
    sm: "p-4",
    md: "p-5 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  const finalAction = action || headerAction;
  const hasHeader = title || subtitle || icon || finalAction;

  return (
    <div
      className={`bg-white dark:bg-[#1c202c] border border-slate-200/80 dark:border-white/[0.06] rounded-2xl shadow-xs transition-all duration-180 flex flex-col justify-between overflow-hidden ${className}`}
    >
      <div>
        {hasHeader && (
          <>
            <div className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {icon && (
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {icon}
                  </div>
                )}
                <div className="min-w-0">
                  {title && (
                    <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white tracking-tight truncate">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-2xs sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              {finalAction && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {finalAction}
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 dark:border-white/[0.04]" />
          </>
        )}

        <div className={paddingStyles[padding]}>{children}</div>
      </div>

      {footer && (
        <div className="px-5 sm:px-6 py-3 bg-slate-50/70 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.04]">
          {footer}
        </div>
      )}
    </div>
  );
};
