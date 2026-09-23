'use server';
// app/news/page.tsx
import { createClient } from "@/utils/supabase/server";
import { syncFacebookToSupabase, deleteNewsPost } from "@/app/actions/news";
import Image from "next/image";
import NewsAdminClient from "./NewsAdminClient";

export default async function NewsAdminPage() {
  const supabase = await createClient();
  
  // Fetch posts saved in Supabase
  const { data: posts } = await supabase
    .from("news_posts")
    .select("*")
    .order("published_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            News & Facebook Posts Management
          </h1>
          <p className="text-sm text-gray-500">
            Manage posts displayed on website popups.
          </p>
        </div>
        <form action={syncFacebookToSupabase}>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Sync from Facebook
          </button>
        </form>
        <NewsAdminClient/>
      </div>

      {/* Posts Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
            <tr>
              <th className="p-4">Post</th>
              <th className="p-4">Link</th>
              <th className="p-4">Status</th>
              <th className="p-4">Published Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts && posts.length > 0 ? (
              posts.map((post) => (
                <tr key={post.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {post.image_url && (
                        <Image
                          src={post.image_url}
                          alt="thumbnail"
                          width={48}
                          height={48}
                          className="size-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {post.title}
                        </p>
                        <p className="line-clamp-1 text-xs text-gray-500">
                          {post.content}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {post.link_url ? (
                      <a
                        href={post.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        View Link
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        post.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {post.is_active ? "Active Popup" : "Hidden"}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-500">
                    {new Date(post.published_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <form
                      action={async () => {
                        "use server";
                        await deleteNewsPost(post.id, post.facebook_post_id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No posts found. Click &quot;Sync from Facebook&quot; to import your latest Facebook page posts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}