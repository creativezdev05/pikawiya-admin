// components/facebook-posts/EditPostButton.tsx
"use client";

import { useState } from "react";
import EditPostModal from "./EditPostModal";

interface PostToEdit {
  id: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
}

export default function EditPostButton({ post }: { post: PostToEdit }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-blue-600 hover:underline"
      >
        Edit
      </button>
      {open && (
        <EditPostModal post={post} isOpen={open} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
