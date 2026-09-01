import Link from "next/link";
import { BRAND } from "@/lib/copy";

const LINKS = [
  { href: "/dev/boot", label: "Boot check" },
  { href: "/dev/states", label: "Fixtures" },
] as const;

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-(--content-reading) flex-1 flex-col justify-center gap-8 px-gutter py-section">
      <div className="flex flex-col gap-3">
        <span lang="ja" className="type-stamp text-gold">
          {BRAND.kanji}
        </span>
        <h1 className="type-display text-ink">{BRAND.name}</h1>
        <p className="type-body text-ink-secondary">
          {BRAND.tagline}. Live price windows, one-tap calls, and settlement receipts you can click.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {LINKS.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} className="type-body-strong text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink">
              {label} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
