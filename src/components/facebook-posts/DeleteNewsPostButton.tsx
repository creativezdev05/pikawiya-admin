// components/facebook-posts/DeleteNewsPostButton.tsx
"use client";

import { useState, useTransition } from "react";
import { deleteNewsPost } from "@/app/actions/news";

interface DeleteNewsPostButtonProps {
  id: string;
  facebookPostId?: string | null;
  onDeleted?: () => void;
  triggerClassName?: string;
  confirmClassName?: string;
}

export default function DeleteNewsPostButton({
  id,
  facebookPostId,
  onDeleted,
  triggerClassName = "text-xs font-medium text-error-500 hover:underline",
  confirmClassName = "rounded-lg bg-error-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-error-600 disabled:opacity-50",
}: DeleteNewsPostButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteNewsPost(id, facebookPostId ?? undefined);
      if (!res.success) {
        setError(res.error ?? "Failed to delete post.");
        return;
      }
      setConfirming(false);
      onDeleted?.();
    });
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={triggerClassName}>
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-theme-xs text-error-500">{error}</span>}
      <span className="text-theme-xs text-gray-500 dark:text-gray-400">Delete this post?</span>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/5"
      >
        Cancel
      </button>
      <button type="button" onClick={handleDelete} disabled={isPending} className={confirmClassName}>
        {isPending ? "Deleting..." : "Confirm"}
      </button>
    </div>
  );
}
