import Image from "next/image";
import { Link } from "@/i18n/navigation";
import TrLogo from "@/components/common/TrLogo";
import CulturalPattern from "@/components/common/CulturalPattern";
import { getTranslations } from "next-intl/server";

export default async function AuthFooter() {
  const t = await getTranslations("authLayout.footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full overflow-hidden border-t border-gray-800 bg-gray-900">
      <TrLogo />
      <CulturalPattern
        variant="footer"
        fit="fill"
        className="z-3"
        dotsConfig={[{ x: "100%", y: "0%", rings: 5, startR: 14, gap: 12, speed: 60 }]}
      />
      <CulturalPattern
        variant="footer"
        fit="fill"
        uShapeConfig={[{ x: "-13%", y: "90%" }]}
        cornerTLConfig={{ x: "12%", y: "-15%", scale: 0.9 }}
        cornerBRConfig={{ x: "88%", y: "112%", scale: 0.9 }}
      />
      <div className="absolute inset-0 bg-gray-900/78" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="space-y-3 sm:col-span-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white dark:text-white/90">
              {t("brandName")}
            </h3>
            <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
              {t("about")}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              {t("quickLinks")}
            </h3>
            <ul className="space-y-2 text-sm  text-gray-400">
              <li>
                <Link href="/" className="transition hover:text-brand-500">
                  {t("home")}
                </Link>
              </li>
              <li>
                <Link
                  href="https://pikawiya-redesign.vercel.app/privacy-policy" target="_blank"
                  className="transition hover:text-brand-500"
                >
                  {t("privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link
                  href="https://pikawiya-redesign.vercel.app/terms-of-use" target="_blank"
                  className="transition hover:text-brand-500"
                >
                  {t("termsOfUse")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">
                {t("contactTitle")}
              </h3>
              <div className="flex shrink-0 items-center gap-2">
                <Image
                  src="/assets/flag1.webp"
                  alt={t("aboriginalFlagAlt")}
                  width={50}
                  height={38}
                  className="h-auto w-7 object-contain"
                />
                <Image
                  src="/assets/flag2.webp"
                  alt={t("torresStraitFlagAlt")}
                  width={50}
                  height={38}
                  className="h-auto w-7 object-contain"
                />
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>{t("address")}</li>
              <li>
                <a
                  href="tel:0886429900"
                  className="transition hover:text-brand-500"
                >
                  {t("phone")}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <a
                  href={`mailto:${t("email")}`}
                  className="truncate transition hover:text-brand-500"
                >
                  {t("email")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-6 text-center text-xs text-gray-400 sm:text-start">
          <p>
            © {currentYear} {t("rightsReserved")}
          </p>
        </div>

        <div className="mt-6 rounded-md bg-black px-4 py-3 text-center">
          <p className="text-xs font-bold tracking-wide text-white">
            {t("builtBy")}
          </p>
        </div>
      </div>
    </footer>
  );
}
