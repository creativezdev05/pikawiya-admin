'use server';
// app/news/page.tsx
import { createClient } from "@/utils/supabase/server";
import NewsAdminClient from "./NewsAdminClient";
import NewsTable from "./NewsTable";
import SyncFacebookButton from "@/components/facebook-posts/SyncFacebookButton";

export default async function NewsAdminPage() {
  const supabase = await createClient();

  // Fetch posts saved in Supabase
  const { data: posts } = await supabase
    .from("news_posts")
    .select("*")
    .order("published_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            News & Facebook Posts Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage posts displayed on website popups.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <SyncFacebookButton />
          <NewsAdminClient/>
        </div>
      </div>

      {/* Posts Table */}
      <NewsTable posts={posts ?? []} />
    </div>
  );
}
