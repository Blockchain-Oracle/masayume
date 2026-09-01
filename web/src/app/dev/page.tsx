import Link from "next/link";
import { SectionHeader } from "@/components/chrome";
import { DEV } from "@/lib/copy";

const FIXTURES = [
  { href: "/dev/states", label: "States", note: "honest-state primitives, data, chrome, receipt, ui" },
  { href: "/dev/boot", label: "Boot check", note: "zero-env round-trip to the Shannon indexer" },
] as const;

export default function DevIndexPage() {
  return (
    <div className="mx-auto flex w-full max-w-(--content-reading) flex-col gap-6 px-gutter py-8">
      <SectionHeader index="00" title={DEV.title} />
      <p className="type-body text-ink-secondary">{DEV.intro}</p>
      <ul className="flex flex-col gap-3">
        {FIXTURES.map(({ href, label, note }) => (
          <li key={href} className="flex flex-col gap-1 rounded-lg border border-hairline bg-surface-1 p-4">
            <Link href={href} className="type-body-strong text-ink hover:text-gold">
              {label} →
            </Link>
            <span className="type-caption text-ink-secondary">{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
