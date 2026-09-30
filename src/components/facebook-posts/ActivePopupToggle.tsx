// components/facebook-posts/ActivePopupToggle.tsx
"use client";

import { useState, useTransition } from "react";
import Switch from "@/components/form/switch/Switch";
import { setNewsPostActive } from "@/app/actions/news";

interface ActivePopupToggleProps {
  id: string;
  isActive: boolean;
}

export default function ActivePopupToggle({ id, isActive }: ActivePopupToggleProps) {
  const [checked, setChecked] = useState(isActive);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setError(null);
    setChecked(next);

    startTransition(async () => {
      const res = await setNewsPostActive(id, next);
      if (!res.success) {
        setChecked(!next);
        setError(res.error ?? "Failed to update status.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Switch
        label={checked ? "Active Popup" : "Hidden"}
        defaultChecked={checked}
        disabled={isPending}
        onChange={handleChange}
      />
      {error && <span className="text-theme-xs text-error-500">{error}</span>}
    </div>
  );
}
