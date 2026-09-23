"use client";

import { useState } from "react";
import Badge from "../ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

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

export default function BasicTableOne({ data }: DynamicTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<FormRecord | null>(null);

  // Helper function to map badge colors based on status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "completed":
        return "success";
      case "pending":
        return "warning";
      default:
        return "error";
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
        <div className="max-w-full overflow-x-auto">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/5">
              <TableRow>
                <TableCell isHeader className="p-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  ID
                </TableCell>
                <TableCell isHeader className="p-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Form Type
                </TableCell>
                <TableCell isHeader className="p-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="p-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Min Role
                </TableCell>
                <TableCell isHeader className="p-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Decrypted Data
                </TableCell>
                <TableCell isHeader className="p-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Created At
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {data.map((item) => (
                <TableRow
                  key={item.id}
                  onClick={() => setSelectedRecord(item)}
                  className="cursor-pointer transition-colors hover:bg-gray-50/80 dark:hover:bg-white/5"
                >
                  <TableCell className="p-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    #{item.id}
                  </TableCell>
                  <TableCell className="p-3 text-theme-sm text-gray-700 dark:text-gray-300">
                    {item.form_type}
                  </TableCell>
                  <TableCell className="p-3 text-theme-sm">
                    <Badge size="sm" color={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-3 text-theme-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {item.min_role_required}
                    </span>
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
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Decrypted Data Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Decrypted Data -  {selectedRecord.form_type} Form
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedRecord.form_type} &bull; Min Role: {selectedRecord.min_role_required}
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

            {/* Modal Content - Dynamic Decrypted Table */}
            <div className="max-h-[60vh] overflow-x-auto overflow-y-auto p-6">
              <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-800">
                {(() => {
                  // 1. Get raw data
                  const rawData = selectedRecord.decryptedData;

                  // 2. Extract inner Payload if present, otherwise use rawData
                  let targetObj: Record<string, unknown> = {};
                  
                  if (typeof rawData === "object" && rawData !== null) {
                    if ("Payload" in rawData && typeof (rawData as any).Payload === "object") {
                      targetObj = (rawData as any).Payload;
                    } else if ("payload" in rawData && typeof (rawData as any).payload === "object") {
                      targetObj = (rawData as any).payload;
                    } else {
                      targetObj = rawData as Record<string, unknown>;
                    }
                  }

                  // If payload was stringified JSON, parse it safely
                  if (typeof targetObj === "string") {
                    try {
                      targetObj = JSON.parse(targetObj);
                    } catch {
                      targetObj = {};
                    }
                  }

                  const keys = Object.keys(targetObj);

                  return (
                    <table className="w-full text-left text-sm">
                      {/* Header Row: Inner Payload keys mapped as <th> */}
                      <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        <tr>
                          {keys.map((key) => (
                            <th key={key} className="px-4 py-3 font-semibold whitespace-nowrap">
                              {key
                                .replace(/_/g, " ")
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      {/* Body Row: Inner Payload values mapped directly into <td> */}
                      <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                        <tr>
                          {keys.map((key) => (
                            <td key={key} className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                              {typeof targetObj[key] === "object" && targetObj[key] !== null
                                ? JSON.stringify(targetObj[key])
                                : String(targetObj[key] ?? "")}
                            </td>
                          ))}
                        </tr>
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