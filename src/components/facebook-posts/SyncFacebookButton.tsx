// components/facebook-posts/SyncFacebookButton.tsx
"use client";

import { useActionState } from "react";
import { syncFacebookToSupabase } from "@/app/actions/news";
import Alert from "@/components/ui/alert/Alert";

interface SyncState {
  success: boolean;
  message: string | null;
}

const initialState: SyncState = { success: false, message: null };

export default function SyncFacebookButton() {
  const [state, formAction, isPending] = useActionState<SyncState>(async () => {
    const res = await syncFacebookToSupabase();
    if (!res.success) {
      return { success: false, message: res.error ?? "Failed to sync posts from Facebook." };
    }
    return {
      success: true,
      message: `Synced ${res.count ?? 0} post${res.count === 1 ? "" : "s"} from Facebook.`,
    };
  }, initialState);

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction}>
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="rounded-lg px-4 py-2.5 text-sm font-medium bg-brand-500 text-white hover:bg-brand-600  disabled:cursor-not-allowed disabled:opacity-50 disabled:blur-[1px]"
        >
          {isPending ? "Syncing..." : "Sync from Facebook"}
        </button>
      </form>

      {isPending && (
        <p className="text-theme-xs text-gray-500 dark:text-gray-400" role="status">
          Fetching latest posts from Facebook…
        </p>
      )}

      {!isPending && state.message && (
        <Alert
          variant={state.success ? "success" : "error"}
          title={state.success ? "Synced" : "Sync failed"}
          message={state.message}
        />
      )}
    </div>
  );
}
