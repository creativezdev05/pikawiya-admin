// app/[locale]/(admin)/(others-pages)/news/NewsTable.tsx
"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Pagination from "@/components/tables/Pagination";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import ActivePopupToggle from "@/components/facebook-posts/ActivePopupToggle";
import DeleteNewsPostButton from "@/components/facebook-posts/DeleteNewsPostButton";
import EditPostButton from "@/components/facebook-posts/EditPostButton";
import PostDetailModal, { NewsPostDetail } from "@/components/facebook-posts/PostDetailModal";

const PAGE_SIZE = 10;

type SourceFilter = "both" | "facebook" | "website";

const SOURCE_OPTIONS: { value: SourceFilter; label: string }[] = [
  { value: "both", label: "Facebook & Website" },
  { value: "facebook", label: "Facebook" },
  { value: "website", label: "Website" },
];

export default function NewsTable({ posts }: { posts: NewsPostDetail[] }) {
  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<NewsPostDetail | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("both");

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posts.filter((post) => {
      if (sourceFilter === "facebook" && !post.facebook_post_id) return false;
      if (sourceFilter === "website" && post.facebook_post_id) return false;
      if (!query) return true;
      return (
        (post.title ?? "").toLowerCase().includes(query) ||
        (post.content ?? "").toLowerCase().includes(query)
      );
    });
  }, [posts, search, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedPosts = filteredPosts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div>
      {/* Toolbar: Source Filter + Search */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Label>Search</Label>
          <Input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title or description"
          />
        </div>
        <div className="w-full sm:w-56">
          <Label>Filter by</Label>
          <Select
            options={SOURCE_OPTIONS}
            defaultValue="both"
            onChange={(value) => {
              setSourceFilter(value as SourceFilter);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-400 bg-white shadow-theme-xl dark:border-gray-700 dark:bg-white/3">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-gray-700 bg-gray-900">
              <tr>
                <th className="p-4 text-white">Post</th>
                <th className="p-4 text-white">Link</th>
                <th className="p-4 text-white">Status</th>
                <th className="p-4 text-white">Published Date</th>
                <th className="p-4 text-end text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPosts.length > 0 ? (
                paginatedPosts.map((post) => (
                  <tr key={post.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td
                      className="max-w-xs cursor-pointer p-4"
                      onClick={() => setSelectedPost(post)}
                    >
                      <div className="flex items-center gap-3">
                        {post.image_url && (
                          <Image
                            src={post.image_url}
                            alt="thumbnail"
                            width={48}
                            height={48}
                            className="size-12 shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-800 dark:text-white">
                            {post.title}
                          </p>
                          <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">{post.content}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {post.facebook_post_id ? (
                        <a
                          href={`https://www.facebook.com/${post.facebook_post_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-brand-500 hover:underline"
                        >
                          View Link
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-4">
                      <ActivePopupToggle
                        key={post.id}
                        id={post.id}
                        isActive={post.is_active}
                      />
                    </td>
                    <td className="p-4 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(post.published_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-end">
                      <div className="flex items-center justify-end gap-3">
                        {!post.facebook_post_id && (
                          <EditPostButton
                            post={{
                              id: post.id,
                              title: post.title,
                              content: post.content,
                              image_url: post.image_url,
                              link_url: post.link_url,
                            }}
                          />
                        )}
                        <DeleteNewsPostButton id={post.id} facebookPostId={post.facebook_post_id} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500 dark:text-gray-400">
                    {posts.length === 0
                      ? 'No posts found. Click "Sync from Facebook" to import your latest Facebook page posts.'
                      : "No posts match your search or filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredPosts.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              Showing {(safePage - 1) * PAGE_SIZE + 1}-
              {Math.min(safePage * PAGE_SIZE, filteredPosts.length)} of {filteredPosts.length}
            </p>
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={(p) => setPage(Math.min(Math.max(p, 1), totalPages))}
            />
          </div>
        )}
      </div>

      {selectedPost && (
        <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
