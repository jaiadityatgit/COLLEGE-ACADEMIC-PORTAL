import React from "react";

export interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rounded",
  width,
  height,
  lines,
}) => {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  const shapeClass = {
    text: "h-3.5 rounded",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-xl",
  }[variant];

  if (lines && lines > 1) {
    return (
      <div className={`space-y-2.5 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`skeleton ${shapeClass}`}
            style={{
              ...style,
              width: i === lines - 1 ? "66%" : style.width || "100%",
              height: style.height || "14px",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton ${shapeClass} ${className}`}
      style={{
        ...style,
        width: style.width || "100%",
        height: style.height || variant === "text" ? "14px" : style.height || "40px",
      }}
    />
  );
};

// Pre-built skeleton compositions
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`surface-card rounded-2xl p-5 space-y-4 ${className}`}>
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <Skeleton variant="rounded" height={80} />
    <Skeleton variant="text" lines={2} />
  </div>
);

export const SkeletonStat: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`surface-card rounded-2xl p-5 space-y-3 ${className}`}>
    <Skeleton variant="text" width="50%" />
    <Skeleton variant="text" width="30%" height={28} />
    <Skeleton variant="rounded" height={6} />
  </div>
);

export const SkeletonRow: React.FC<{ cols?: number; className?: string }> = ({ cols = 4, className = "" }) => (
  <div className={`flex items-center gap-4 py-3 ${className}`}>
    {Array.from({ length: cols }).map((_, i) => (
      <Skeleton key={i} variant="text" width={`${100 / cols}%`} />
    ))}
  </div>
);
