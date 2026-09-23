import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en"], // expand when multilang is needed
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
