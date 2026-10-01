// components/facebook-posts/ActivePopupToggle.tsx
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Switch from "@/components/form/switch/Switch";
import { setNewsPostActive } from "@/app/actions/news";

interface ActivePopupToggleProps {
  id: string;
  isActive: boolean;
}

type StatusType = "info" | "success" | "error";

interface StatusMessage {
  type: StatusType;
  text: string;
}

const statusStyles: Record<StatusType, string> = {
  info: "border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-400",
  success:
    "border-success-200 bg-success-50 text-success-600 dark:border-success-500/30 dark:bg-success-500/15 dark:text-success-400",
  error:
    "border-error-200 bg-error-50 text-error-600 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-400",
};

export default function ActivePopupToggle({ id, isActive }: ActivePopupToggleProps) {
  const [checked, setChecked] = useState(isActive);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [isPending, startTransition] = useTransition();
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setChecked(isActive);
  }, [isActive]);

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  function showStatus(message: StatusMessage, autoDismissMs?: number) {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setStatus(message);
    dismissTimer.current = autoDismissMs
      ? setTimeout(() => setStatus(null), autoDismissMs)
      : null;
  }

  function handleChange(next: boolean) {
    setChecked(next);
    showStatus({
      type: "info",
      text: next ? "Activating post…" : "Hiding post…",
    });

    startTransition(async () => {
      const res = await setNewsPostActive(id, next);
      if (!res.success) {
        setChecked(!next);
        showStatus({
          type: "error",
          text: res.error ?? "Failed to update status.",
        });
        return;
      }

      showStatus(
        {
          type: "success",
          text: next ? "Post is now active." : "Post is now hidden.",
        },
        3000
      );
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Switch
        key={String(checked)}
        label={checked ? "Active Popup" : "Hidden"}
        defaultChecked={checked}
        disabled={isPending}
        onChange={handleChange}
      />
      {status && (
        <span
          className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-theme-xs font-medium ${statusStyles[status.type]}`}
        >
          {status.text}
        </span>
      )}
    </div>
  );
}
