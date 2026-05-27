"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// DESIGN.md §8.8 — Data Table.
// Thin native-<table> wrapper. Not TanStack Table (too heavy for v1).
// Provides: sortable headers (caller-controlled), row hover bg-tint via
// .hover-tint utility (added in A13), row click, configurable density,
// right-aligned money columns via column.align.
//
// Sorting model: caller passes `sortKey` + `sortOrder` (current state) and
// `onSort(key)`. Onclick of a sortable header invokes onSort; caller is
// responsible for updating URL/state and refetching.

export type SortOrder = "asc" | "desc";

export type Column<Row, Key extends string = string> = {
  key: Key;
  header: ReactNode;
  sortable?: boolean;
  align?: "left" | "right";
  className?: string;
  render: (row: Row) => ReactNode;
};

type Props<Row, Key extends string> = {
  columns: Column<Row, Key>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  sortKey?: Key;
  sortOrder?: SortOrder;
  onSort?: (key: Key) => void;
  density?: "comfortable" | "compact";
  onRowClick?: (row: Row) => void;
  emptyState?: ReactNode;
  className?: string;
};

export function DataTable<Row, Key extends string>({
  columns,
  rows,
  rowKey,
  sortKey,
  sortOrder,
  onSort,
  density = "comfortable",
  onRowClick,
  emptyState,
  className,
}: Props<Row, Key>) {
  const rowHeight = density === "comfortable" ? "h-[52px]" : "h-10";

  if (rows.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border", className)}>
      <table className="w-full border-collapse text-sm">
        <thead className="border-border border-b bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
          <tr>
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              const Icon = !col.sortable
                ? null
                : !isSorted
                  ? ChevronsUpDown
                  : sortOrder === "asc"
                    ? ChevronUp
                    : ChevronDown;
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 font-medium",
                    col.align === "right" ? "text-right" : "text-left",
                    col.className,
                  )}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      {col.header}
                      {Icon ? (
                        <Icon
                          aria-hidden
                          className={cn("size-3.5", isSorted ? "text-foreground" : "opacity-50")}
                          strokeWidth={2}
                        />
                      ) : null}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "hover-tint border-border border-b last:border-b-0 transition-colors",
                rowHeight,
                onRowClick && "cursor-pointer",
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-3 align-middle",
                    col.align === "right" && "text-right",
                    col.className,
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
