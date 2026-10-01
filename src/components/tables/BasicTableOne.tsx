"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "./Pagination";

// 1. Types for Form Data & Props
export interface FormRecord {
  id: string | number;
  form_type: string;
  status: "Active" | "Pending" | "Completed" | "Cancelled" | string;
  min_role_required: string;
  decryptedData: Record<string, unknown> | Array<Record<string, unknown>>;
  created_at: string;
}

interface DynamicTableProps {
  data: FormRecord[];
}

type SortKey = "form_type" | "created_at";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 10;

// Extracts the inner payload object out of a decrypted record, mirroring the
// shape used by the "View Details" modal, so search can match the same data.
function extractPayload(
  raw: FormRecord["decryptedData"],
): Record<string, unknown> {
  let targetObj: Record<string, unknown> = {};

  if (typeof raw === "object" && raw !== null) {
    if ("Payload" in raw && typeof (raw as any).Payload === "object") {
      targetObj = (raw as any).Payload;
    } else if ("payload" in raw && typeof (raw as any).payload === "object") {
      targetObj = (raw as any).payload;
    } else {
      targetObj = raw as Record<string, unknown>;
    }
  }

  if (typeof targetObj === "string") {
    try {
      targetObj = JSON.parse(targetObj);
    } catch {
      targetObj = {};
    }
  }

  return targetObj;
}

function formatFieldLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

function formatFieldValue(value: unknown) {
  if (value == null || value === "") return "—";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function getSearchableText(item: FormRecord): string {
  const payload = extractPayload(item.decryptedData);
  const payloadValues = Object.values(payload).map((value) =>
    typeof value === "object" && value !== null
      ? JSON.stringify(value)
      : String(value ?? ""),
  );

  return [
    String(item.id),
    item.form_type,
    item.status,
    item.min_role_required,
    item.created_at,
    ...payloadValues,
  ]
    .join(" ")
    .toLowerCase();
}

function SortIcon({ direction }: { direction: SortDirection | null }) {
  return (
    <span className="flex flex-col">
      <svg
        className={`h-2 w-2.5 ${direction === "asc" ? "text-white" : "text-gray-500"}`}
        viewBox="0 0 10 6"
        fill="none"
      >
        <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg
        className={`h-2 w-2.5 ${direction === "desc" ? "text-white" : "text-gray-500"}`}
        viewBox="0 0 10 6"
        fill="none"
      >
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function BasicTableOne({ data }: DynamicTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<FormRecord | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const formTypes = useMemo(
    () => Array.from(new Set(data.map((item) => item.form_type))).sort(),
    [data],
  );

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.filter((item) => {
      if (typeFilter && item.form_type !== typeFilter) return false;
      if (!query) return true;
      return getSearchableText(item).includes(query);
    });
  }, [data, search, typeFilter]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const dir = sortDir === "asc" ? 1 : -1;

    return [...filteredData].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      if (sortKey === "created_at") {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      } else {
        aVal = String(a[sortKey] ?? "").toLowerCase();
        bVal = String(b[sortKey] ?? "").toLowerCase();
      }

      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });
  }, [filteredData, sortKey, sortDir]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = sortedData.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: "form_type", label: "Form Type" },
  ];

  return (
    <>
      {/* Toolbar: Search + Type Filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ">
        <div className="relative w-full sm:max-w-xs">
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-gray-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, ICN, status..."
            className="h-10 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 ps-9 pe-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden sm:w-56 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
        >
          <option value="">All Form Types</option>
          {formTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/5 dark:bg-white/3">
        <div className="max-w-full overflow-x-auto">
          <Table>
            {/* Table Header — intentionally always dark (#1B2433), regardless of site theme */}
            <TableHeader className="border-b border-gray-700 bg-gray-900">
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    isHeader
                    className="p-3 text-start text-theme-xs font-medium text-white"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1.5 hover:text-gray-200"
                    >
                      {column.label}
                      <SortIcon direction={sortKey === column.key ? sortDir : null} />
                    </button>
                  </TableCell>
                ))}
                <TableCell isHeader className="p-3 text-start text-theme-xs font-medium text-white">
                  Decrypted Data
                </TableCell>
                <TableCell isHeader className="p-3 text-start text-theme-xs font-medium text-white">
                  <button
                    type="button"
                    onClick={() => handleSort("created_at")}
                    className="flex items-center gap-1.5 hover:text-gray-200"
                  >
                    Created At
                    <SortIcon direction={sortKey === "created_at" ? sortDir : null} />
                  </button>
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginatedData.length === 0 ? (
                <TableRow>
                  <td
                    colSpan={columns.length + 2}
                    className="p-6 text-center text-theme-sm text-gray-500 dark:text-gray-400"
                  >
                    No submissions match your search or filter.
                  </td>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow
                    key={item.id}
                    onClick={() => setSelectedRecord(item)}
                    className="cursor-pointer transition-colors hover:bg-gray-50/80 dark:hover:bg-white/5"
                  >
                    <TableCell className="p-3 text-theme-sm text-gray-700 dark:text-gray-300">
                      {item.form_type}
                    </TableCell>
                    <TableCell className="p-3 text-theme-sm text-brand-500 hover:underline dark:text-brand-400">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </span>
                    </TableCell>
                    <TableCell className="p-3 text-theme-sm text-gray-500 dark:text-gray-400">
                      {item.created_at}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {sortedData.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Showing {(safePage - 1) * PAGE_SIZE + 1}-
            {Math.min(safePage * PAGE_SIZE, sortedData.length)} of {sortedData.length}
          </p>
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(Math.min(Math.max(page, 1), totalPages))}
          />
        </div>
      )}

      {/* Decrypted Data Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {selectedRecord.form_type} Submission
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Submitted {selectedRecord.created_at}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - each field is its own row (label | value), not a single wide row */}
            <div className="overflow-y-auto p-6">
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                {(() => {
                  const targetObj = extractPayload(selectedRecord.decryptedData);
                  const keys = Object.keys(targetObj);

                  if (keys.length === 0) {
                    return (
                      <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                        No decrypted data available for this submission.
                      </p>
                    );
                  }

                  return (
                    <table className="w-full text-start text-sm">
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {keys.map((key) => (
                          <tr key={key} className="even:bg-gray-50/60 dark:even:bg-white/2">
                            <th
                              scope="row"
                              className="w-2/5 whitespace-nowrap px-4 py-3 text-start text-xs font-semibold text-gray-500 dark:text-gray-400"
                            >
                              {formatFieldLabel(key)}
                            </th>
                            <td className="px-4 py-3 whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                              {formatFieldValue(targetObj[key])}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-gray-100 px-6 py-3 dark:border-gray-800">
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
