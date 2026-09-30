"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FB_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

interface FacebookPost {
  id: string;
  message?: string;
  full_picture?: string;
  permalink_url?: string;
  created_time: string;
}

// Only one post is shown as the website popup at a time.
async function deactivateAllPosts(supabase: Awaited<ReturnType<typeof createClient>>) {
  await supabase.from("news_posts").update({ is_active: false }).eq("is_active", true);
}

// 1. Fetch Posts directly from Facebook Page API
export async function fetchFacebookPosts() {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/published_posts?fields=id,message,full_picture,permalink_url,created_time&access_token=${FB_ACCESS_TOKEN}`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    return { success: true, data: data.data || [] };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: String(err) };
  }
}

// 2. Sync Facebook Posts into Supabase
export async function syncFacebookToSupabase(): Promise<{
  success: boolean;
  error?: string;
  count?: number;
}> {
  const { success, data: fbPosts, error: fetchError } = await fetchFacebookPosts();
  if (!success) {
    return { success: false, error: fetchError ?? "Failed to fetch posts from Facebook." };
  }

  const supabase = await createClient();

  const sortedPosts = [...fbPosts].sort(
    (a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime()
  );

  const formattedPosts = sortedPosts.map((post: FacebookPost, index: number) => ({
    facebook_post_id: post.id,
    title: post.message ? post.message.substring(0, 60) + "..." : "Facebook Post",
    content: post.message || "",
    image_url: post.full_picture || null,
    link_url: post.permalink_url || null,
    published_at: post.created_time,
    is_active: index === 0, // latest post is the default active popup
  }));

  if (formattedPosts.length > 0) {
    await deactivateAllPosts(supabase);
  }

  const { error: upsertError } = await supabase
    .from("news_posts")
    .upsert(formattedPosts, { onConflict: "facebook_post_id" });

  if (upsertError) return { success: false, error: upsertError.message };

  revalidatePath("/news");
  return { success: true, count: formattedPosts.length };
}

// 3. Create and Publish Post (Handles BOTH, WEBSITE_ONLY, FACEBOOK_ONLY)
export async function createAndPublishPost(formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const linkUrl = formData.get("linkUrl") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const target = (formData.get("target") as "BOTH" | "WEBSITE_ONLY" | "FACEBOOK_ONLY") || "BOTH";

  if (!imageUrl && !title) {
    return { success: false, error: "Title is required when no image is uploaded" };
  }

  const fullMessage = [title, content].filter(Boolean).join("\n\n");
  let facebookPostId: string | null = null;
  const finalImageUrl = imageUrl || null;

  // --- Step A: Publish to Facebook (If target is BOTH or FACEBOOK_ONLY) ---
  if (target === "BOTH" || target === "FACEBOOK_ONLY") {
    try {
      if (imageUrl) {
        // Upload photo to Facebook Page photos endpoint
        const fbRes = await fetch(
          `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/photos`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: imageUrl,
              caption: fullMessage,
              access_token: FB_ACCESS_TOKEN,
            }),
          }
        );
        const fbData = await fbRes.json();
        if (fbData.error) throw new Error(fbData.error.message);
        facebookPostId = fbData.post_id || fbData.id;
      } else {
        // Post text/link feed to Facebook Page
        const fbRes = await fetch(
          `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/feed`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: fullMessage,
              link: linkUrl || undefined,
              access_token: FB_ACCESS_TOKEN,
            }),
          }
        );
        const fbData = await fbRes.json();
        if (fbData.error) throw new Error(fbData.error.message);
        facebookPostId = fbData.id;
      }
    } catch (err: unknown) {
      console.error("Facebook API Error:", err);
      if (err instanceof Error) {
        return { success: false, error: `Facebook Publish Failed: ${err.message}` };
      }
      return { success: false, error: String(err) };
    }
  }

  // --- Step B: Save to Supabase (If target is BOTH or WEBSITE_ONLY) ---
  if (target === "BOTH" || target === "WEBSITE_ONLY") {
    await deactivateAllPosts(supabase);

    const { error: dbError } = await supabase.from("news_posts").insert({
      facebook_post_id: facebookPostId, // null if WEBSITE_ONLY
      title: title || "Community Update",
      content,
      image_url: finalImageUrl,
      link_url: linkUrl || null,
      is_active: true,
      published_at: new Date().toISOString(),
    });

    if (dbError) {
      return { success: false, error: `Database Save Failed: ${dbError.message}` };
    }
  }

  revalidatePath("/news");
  return { success: true };
}

// 4. Update Post (website-only posts — not synced with a Facebook post)
export async function updateNewsPost(id: string, formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const linkUrl = formData.get("linkUrl") as string;
  const imageUrl = formData.get("imageUrl") as string;

  if (!imageUrl && !title) {
    return { success: false, error: "Title is required when no image is uploaded" };
  }

  const { error } = await supabase
    .from("news_posts")
    .update({
      title: title || "Community Update",
      content: content || "",
      image_url: imageUrl || null,
      link_url: linkUrl || null,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/news");
  return { success: true };
}

// 5. Delete Post
export async function deleteNewsPost(id: string, facebookPostId?: string) {
  const supabase = await createClient();

  // Delete from Facebook API if connected
  if (facebookPostId) {
    try {
      await fetch(
        `https://graph.facebook.com/v19.0/${facebookPostId}?access_token=${FB_ACCESS_TOKEN}`,
        { method: "DELETE" }
      );
    } catch (err) {
      console.error("Failed to delete from Facebook:", err);
    }
  }

  // Delete from Supabase
  const { error } = await supabase.from("news_posts").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/news");
  return { success: true };
}

// 6. Set which post is shown as the active website popup (only one at a time)
export async function setNewsPostActive(id: string, isActive: boolean) {
  const supabase = await createClient();

  if (isActive) {
    await deactivateAllPosts(supabase);
  }

  const { error } = await supabase
    .from("news_posts")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/news");
  return { success: true };
}