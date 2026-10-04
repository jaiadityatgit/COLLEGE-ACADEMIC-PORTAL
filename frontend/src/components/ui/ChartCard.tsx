import React from "react";
import { SectionCard } from "./SectionCard";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface BarItem {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
  secondaryLabel?: string;
}

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  donutData?: DonutSegment[];
  centerLabel?: string;
  centerValue?: string | number;
  barsData?: BarItem[];
  barsOrientation?: "horizontal" | "vertical";
  className?: string;
  children?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  headerAction,
  donutData,
  centerLabel,
  centerValue,
  barsData,
  barsOrientation = "horizontal",
  className = "",
  children,
}) => {
  // Donut chart calculations
  const total = donutData ? donutData.reduce((acc, s) => acc + s.value, 0) : 0;
  let accumulatedAngle = 0;

  return (
    <SectionCard
      title={title}
      subtitle={subtitle}
      headerAction={headerAction}
      padding="md"
      className={className}
    >
      {/* ── Donut Chart Mode ── */}
      {donutData && (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
          {/* SVG Donut */}
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg className="-rotate-90 w-36 h-36" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-slate-100 dark:text-white/[0.06]"
              />
              {total > 0 &&
                donutData.map((seg, idx) => {
                  const pct = (seg.value / total) * 100;
                  const c = 2 * Math.PI * 38;
                  const dashLength = (pct / 100) * c;
                  const offset = -(accumulatedAngle / 100) * c;
                  accumulatedAngle += pct;
                  return (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="10"
                      strokeDasharray={`${dashLength} ${c - dashLength}`}
                      strokeDashoffset={offset}
                      className="transition-all duration-700 ease-out"
                    />
                  );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              {centerValue !== undefined && (
                <span className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  {centerValue}
                </span>
              )}
              {centerLabel && (
                <span className="text-2xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                  {centerLabel}
                </span>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2.5 flex-1 max-w-[200px] w-full">
            {donutData.map((seg, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-slate-600 dark:text-slate-400 truncate">
                    {seg.label}
                  </span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white pl-2">
                  {seg.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Horizontal Bars Mode ── */}
      {barsData && barsOrientation === "horizontal" && (
        <div className="space-y-3.5 py-1">
          {barsData.map((b, idx) => {
            const max = b.maxValue || Math.max(...barsData.map((i) => i.value), 1);
            const pct = Math.min(Math.round((b.value / max) * 100), 100);
            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                    {b.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {b.secondaryLabel && (
                      <span className="text-2xs text-slate-400 dark:text-slate-500">
                        {b.secondaryLabel}
                      </span>
                    )}
                    <span className="font-semibold text-slate-900 dark:text-white min-w-[36px] text-right">
                      {b.value}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: b.color || "#059669",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Vertical Bars Mode ── */}
      {barsData && barsOrientation === "vertical" && (
        <div className="pt-4 pb-2">
          <div className="flex items-end gap-2 h-36 px-2 justify-between">
            {barsData.map((b, idx) => {
              const max = b.maxValue || Math.max(...barsData.map((i) => i.value), 1);
              const heightPct = Math.max(Math.round((b.value / max) * 100), 6);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-2xs font-semibold text-slate-600 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {b.value}
                  </span>
                  <div className="w-full max-w-[36px] h-full flex items-end">
                    <div
                      className="w-full rounded-t-lg transition-all duration-500 ease-out group-hover:brightness-110"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: b.color || "#18181b",
                      }}
                    />
                  </div>
                  <span className="text-2xs text-slate-400 dark:text-slate-500 truncate w-full text-center mt-1">
                    {b.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {children}
    </SectionCard>
  );
};
