// app/news/NewsAdminClient.tsx
"use client";

import { useState } from "react";
import CreatePostModal from "@/components/facebook-posts/CreatePostModal";

export default function NewsAdminClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
      >
        + Create & Post to Facebook
      </button>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}