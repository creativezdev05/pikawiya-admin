"use client";

import { useState } from "react";
import BasicTableOne, { FormRecord } from "./BasicTableOne";

interface SubmittedFormsCardProps {
  data: FormRecord[];
}

export default function SubmittedFormsCard({ data }: SubmittedFormsCardProps) {
  const [typeFilter, setTypeFilter] = useState("");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xl dark:border-gray-800 dark:bg-white/3 sm:p-6">
      <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
         {typeFilter ? ` ${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}` : "All"} Forms
      </h3>
      <BasicTableOne data={data} onTypeFilterChange={setTypeFilter} />
    </div>
  );
}
