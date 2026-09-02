import Link from "next/link";
import { DOCS } from "./copy";

/** The closing link row (reference L277–281) — the call, the source, and the health page. No handle: there is none to print. */
export function DocsFoot() {
  return (
    <div className="docs-foot">
      <Link href={DOCS.foot.call.href} data-cursor="hover" className="docs-foot-call">
        {DOCS.foot.call.label}
      </Link>
      {DOCS.foot.links.map((link) =>
        link.external ? (
          <a key={link.href} href={link.href} target="_blank" rel="noreferrer" data-cursor="hover" className="docs-foot-link">
            {link.label}
          </a>
        ) : (
          <Link key={link.href} href={link.href} data-cursor="hover" className="docs-foot-link">
            {link.label}
          </Link>
        ),
      )}
    </div>
  );
}
