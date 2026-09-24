// app/news/NewsAdminClient.tsx
"use client";

import { useState } from "react";
import CreatePostModal from "@/components/facebook-posts/CreatePostModal";
export type PublishTarget = "BOTH" | "WEBSITE_ONLY" | "FACEBOOK_ONLY";

export default function NewsAdminClient() {
  const [publishTarget, setPublishTarget] = useState<PublishTarget | null>(null);
  

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => setPublishTarget("BOTH")}
        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        + Create & Post to Facebook & Website
      </button>

      <button
        onClick={() => setPublishTarget("WEBSITE_ONLY")}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        + Create & Post to Website Only
      </button>

      <button
        onClick={() => setPublishTarget("FACEBOOK_ONLY")}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        + Create & Post to Facebook Only
      </button>

      {publishTarget && (
        <CreatePostModal
          isOpen={!!publishTarget}
          target={publishTarget}
          onClose={() => setPublishTarget(null)}
        />
      )}
    </div>
  );
}