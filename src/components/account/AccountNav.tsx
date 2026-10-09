import Link from "next/link";
import { logout } from "@/app/(shop)/compte/actions";
import { localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

export function AccountNav({
  active,
  locale = "fr",
}: {
  active: "compte" | "commandes" | "favoris";
  locale?: Locale;
}) {
  const copy = t(locale);
  const items = [
    { key: "compte", label: copy.account.metaTitle, href: "/compte" },
    { key: "commandes", label: copy.account.orders, href: "/compte/commandes" },
    { key: "favoris", label: copy.account.favorites, href: "/compte/favoris" },
  ] as const;

  return (
    <nav className="flex flex-col gap-1">
      {items.map((i) => (
        <Link
          key={i.key}
          href={localizedPath(i.href, locale)}
          className={[
            "font-sans text-[14px] py-2.5 px-3 rounded-xs transition-colors",
            active === i.key
              ? "bg-ink text-ivory-light"
              : "text-warm-700 hover:bg-mineral",
          ].join(" ")}
        >
          {i.label}
        </Link>
      ))}
      <form action={logout}>
        <button
          type="submit"
          className="w-full text-left font-sans text-[14px] py-2.5 px-3 rounded-xs text-warm-500 hover:text-champagne transition-colors cursor-pointer"
        >
          {copy.account.logout}
        </button>
      </form>
    </nav>
  );
}
