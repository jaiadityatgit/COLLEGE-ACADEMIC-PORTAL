import React from "react";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";

export interface ColumnDef<T> {
  key: string;
  header: string | React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  onRowClick?: (item: T) => void;
  stickyHeader?: boolean;
  className?: string;
  footerContent?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are no entries available to display.",
  emptyAction,
  keyExtractor,
  onRowClick,
  stickyHeader = false,
  className = "",
  footerContent,
}: DataTableProps<T>) {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div className={`w-full overflow-hidden flex flex-col bg-white dark:bg-[#1c202c] border border-slate-200/80 dark:border-white/[0.06] rounded-2xl shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className={`bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-200/70 dark:border-white/[0.06] ${stickyHeader ? "sticky top-0 z-10 backdrop-blur-xs" : ""}`}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-4 sm:px-6 py-3 font-semibold text-2xs uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none ${alignClasses[col.align || "left"]}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 sm:px-6 py-4">
                      <Skeleton variant="text" width="70%" height={14} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const key = keyExtractor ? keyExtractor(row, index) : row._id || row.id || index;
                const isClickable = !!onRowClick;
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors duration-120 ${
                      isClickable ? "cursor-pointer hover:bg-slate-50/80 dark:hover:bg-white/[0.03]" : "hover:bg-slate-50/40 dark:hover:bg-white/[0.01]"
                    }`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 sm:px-6 py-3.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 ${alignClasses[col.align || "left"]}`}
                      >
                        {col.render ? col.render(row, index) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {footerContent && (
        <div className="px-4 sm:px-6 py-3 bg-slate-50/60 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.04] text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          {footerContent}
        </div>
      )}
    </div>
  );
}
