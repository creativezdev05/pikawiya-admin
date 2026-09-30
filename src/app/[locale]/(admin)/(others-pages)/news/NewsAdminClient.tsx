// app/news/NewsAdminClient.tsx
"use client";

import { useState } from "react";
import CreatePostModal from "@/components/facebook-posts/CreatePostModal";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { PlusIcon, ChevronDownIcon } from "@/icons";

export type PublishTarget = "BOTH" | "WEBSITE_ONLY" | "FACEBOOK_ONLY";

const OPTIONS: {
  target: PublishTarget;
  label: string;
  description: string;
  dotClassName: string;
}[] = [
  {
    target: "BOTH",
    label: "Facebook & Website",
    description: "Post to both destinations at once",
    dotClassName: "bg-emerald-500",
  },
  {
    target: "WEBSITE_ONLY",
    label: "Website Only",
    description: "Publish to the website only",
    dotClassName: "bg-blue-500",
  },
  {
    target: "FACEBOOK_ONLY",
    label: "Facebook Only",
    description: "Publish to Facebook only",
    dotClassName: "bg-indigo-500",
  },
];

export default function NewsAdminClient() {
  const [publishTarget, setPublishTarget] = useState<PublishTarget | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className="dropdown-toggle inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
      >
        <PlusIcon className="size-4" />
        Create Post
        <ChevronDownIcon
          className={`size-4 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
        />
      </button>

      <Dropdown
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        className="w-64 p-2"
      >
        {OPTIONS.map((option) => (
          <DropdownItem
            key={option.target}
            onItemClick={() => {
              setPublishTarget(option.target);
              setIsMenuOpen(false);
            }}
            baseClassName="flex items-start gap-2.5 w-full rounded-lg px-3 py-2 text-start hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${option.dotClassName}`} />
            <span className="flex flex-col">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {option.label}
              </span>
              <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                {option.description}
              </span>
            </span>
          </DropdownItem>
        ))}
      </Dropdown>

      {publishTarget && (
        <CreatePostModal
          isOpen={!!publishTarget}
          target={publishTarget}
          onClose={() => setPublishTarget(null)}
        />
      )}
    </div>
  );
}