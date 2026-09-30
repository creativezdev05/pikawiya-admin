// components/facebook-posts/EditPostModal.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { updateNewsPost } from "@/app/actions/news";

interface PostToEdit {
  id: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
}

interface ModalProps {
  isOpen: boolean;
  post: PostToEdit;
  onClose: () => void;
}

export default function EditPostModal({ isOpen, post, onClose }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const titleValue = (formData.get("title") as string)?.trim();
    const willHaveImage = !removeImage && (!!file || !!post.image_url);

    if (!willHaveImage && !titleValue) {
      setError("Title is required when no image is uploaded.");
      return;
    }

    setLoading(true);
    let imageUrl = removeImage ? "" : post.image_url || "";

    try {
      if (file) {
        const supabase = createClient();
        const fileExt = file.name.split(".").pop();
        const fileName = `news-${Date.now()}.${fileExt}`;
        const filePath = `news/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      formData.set("imageUrl", imageUrl);

      const res = await updateNewsPost(post.id, formData);
      if (!res.success) throw new Error(res.error);

      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to update post.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
          Edit Website Post
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">Title</label>
            <input
              type="text"
              name="title"
              defaultValue={post.title ?? ""}
              placeholder="Post Heading"
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">Content (Optional)</label>
            <textarea
              name="content"
              defaultValue={post.content ?? ""}
              rows={4}
              placeholder="What would you like to announce?"
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">
              Image (Optional — a title is required if no image is uploaded)
            </label>

            {post.image_url && !removeImage && !file && (
              <div className="mt-2 flex items-center gap-3">
                <Image
                  src={post.image_url}
                  alt="current"
                  width={48}
                  height={48}
                  className="size-12 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => setRemoveImage(true)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remove image
                </button>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setRemoveImage(false);
              }}
              className="mt-2 w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">Target URL Link (Optional)</label>
            <input
              type="url"
              name="linkUrl"
              defaultValue={post.link_url ?? ""}
              placeholder="https://example.com"
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
