// components/facebook-posts/PostDetailModal.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import ActivePopupToggle from "./ActivePopupToggle";
import DeleteNewsPostButton from "./DeleteNewsPostButton";
import EditPostModal from "./EditPostModal";

export interface NewsPostDetail {
  id: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  published_at: string;
  is_active: boolean;
  facebook_post_id: string | null;
}

interface PostDetailModalProps {
  post: NewsPostDetail;
  onClose: () => void;
}

export default function PostDetailModal({ post, onClose }: PostDetailModalProps) {
  const [showEdit, setShowEdit] = useState(false);
  const isEditable = !post.facebook_post_id;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Post Details</h3>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Published {new Date(post.published_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-6">
            {post.image_url && (
              <Image
                src={post.image_url}
                alt="post"
                width={640}
                height={360}
                className="mb-4 h-auto w-full rounded-lg object-cover"
              />
            )}

            <h4 className="mb-2 text-base font-semibold text-gray-800 dark:text-white">
              {post.title || "Untitled Post"}
            </h4>
            <p className="whitespace-pre-wrap text-theme-sm text-gray-600 dark:text-gray-300">
              {post.content || "No description provided."}
            </p>

            {post.link_url && (
              <a
                href={post.link_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-theme-sm text-brand-500 hover:underline"
              >
                View Link
              </a>
            )}

            <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
              <ActivePopupToggle key={`${post.id}-${post.is_active}`} id={post.id} isActive={post.is_active} />
              {post.facebook_post_id && (
                <p className="mt-2 text-theme-xs text-gray-400">
                  Synced from Facebook — editing is disabled for this post.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-3 dark:border-gray-800">
            {isEditable && (
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
              >
                Edit
              </button>
            )}
            <DeleteNewsPostButton
              id={post.id}
              facebookPostId={post.facebook_post_id}
              onDeleted={onClose}
              triggerClassName="rounded-lg bg-error-500 px-4 py-2 text-xs font-medium text-white hover:bg-error-600"
              confirmClassName="rounded-lg bg-error-500 px-4 py-2 text-xs font-medium text-white hover:bg-error-600 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {showEdit && (
        <EditPostModal
          post={{
            id: post.id,
            title: post.title,
            content: post.content,
            image_url: post.image_url,
            link_url: post.link_url,
          }}
          isOpen={showEdit}
          onClose={() => {
            setShowEdit(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
