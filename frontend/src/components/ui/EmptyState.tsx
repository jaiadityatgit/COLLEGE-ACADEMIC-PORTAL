import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-10 text-center ${className}`}>
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
          {typeof icon === "string" ? (
            <span className="text-xl">{icon}</span>
          ) : (
            icon
          )}
        </div>
      )}
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</p>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};
