import React from "react";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text,
  className = "",
}) => {
  const sizeStyles = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 p-6 ${className}`}>
      <span
        className={`${sizeStyles[size]} border-neutral-300 border-t-neutral-900 dark:border-white/20 dark:border-t-white rounded-full animate-spin`}
      />
      {text && (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};
