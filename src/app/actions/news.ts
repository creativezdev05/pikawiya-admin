// app/actions/news.ts
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
export async function syncFacebookToSupabase(formData?: FormData): Promise<void> {
  const { success, data: fbPosts, error } = await fetchFacebookPosts();
  if (!success) return;

  const supabase = await createClient();

  const formattedPosts = fbPosts.map((post: FacebookPost) => ({
    facebook_post_id: post.id,
    title: post.message ? post.message.substring(0, 60) + "..." : "Facebook Post",
    content: post.message || "",
    image_url: post.full_picture || null,
    link_url: post.permalink_url || null,
    published_at: post.created_time,
    is_active: true,
  }));

  const { error: upsertError } = await supabase
    .from("news_posts")
    .upsert(formattedPosts, { onConflict: "facebook_post_id" });

  if (upsertError) return;

  revalidatePath("/news");
  return;
}

// 3. Publish a new post directly to Facebook Page + Supabase
export async function createNewsPost(formData: FormData) {
  const supabase = await createClient();
  const message = formData.get("content") as string;
  const title = formData.get("title") as string;
  const linkUrl = formData.get("linkUrl") as string;

  // Option A: Publish directly to Facebook Page API
  let fbPostId = null;
  try {
    const fbRes = await fetch(
      `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${title}\n\n${message}`,
          link: linkUrl || undefined,
          access_token: FB_ACCESS_TOKEN,
        }),
      }
    );
    const fbData = await fbRes.json();
    fbPostId = fbData.id;
  } catch (err) {
    console.error("Failed to push to Facebook API:", err);
  }

  // Option B: Save record in Supabase
  const { error } = await supabase.from("news_posts").insert({
    facebook_post_id: fbPostId,
    title,
    content: message,
    link_url: linkUrl,
    is_active: true,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/news");
  return { success: true };
}

// 4. Delete Post
export async function deleteNewsPost(id: string, facebookPostId?: string) {
  const supabase = await createClient();

  // If connected to FB, delete from FB API
  if (facebookPostId) {
    await fetch(
      `https://graph.facebook.com/v19.0/${facebookPostId}?access_token=${FB_ACCESS_TOKEN}`,
      { method: "DELETE" }
    );
  }

  const { error } = await supabase.from("news_posts").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/news");
  return { success: true };
}

export async function createAndPublishPost(formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const linkUrl = formData.get("linkUrl") as string;
  const imageUrl = formData.get("imageUrl") as string; // Optional image URL (e.g. uploaded to Supabase Storage)

  if (!content) {
    return { success: false, error: "Post content is required" };
  }

  const fullMessage = title ? `${title}\n\n${content}` : content;
  let facebookPostId = null;
  const finalImageUrl = imageUrl || null;

  try {
    // 1. Post to Facebook
    if (imageUrl) {
      // If an image is provided, upload photo to Facebook Page photos endpoint
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
      // Standard Text/Link Post to Facebook Page feed
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

  // 2. Insert record into Supabase Database
  const { error: dbError } = await supabase.from("news_posts").insert({
    facebook_post_id: facebookPostId,
    title: title || "New Facebook Post",
    content,
    image_url: finalImageUrl,
    link_url: linkUrl || null,
    is_active: true,
    published_at: new Date().toISOString(),
  });

  if (dbError) {
    return { success: false, error: `Database Save Failed: ${dbError.message}` };
  }

  revalidatePath("/news");
  return { success: true };
}