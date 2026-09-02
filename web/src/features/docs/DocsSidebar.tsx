import Link from "next/link";
import { DOCS, NAV } from "./copy";

interface DocsSidebarProps {
  active: string;
  /** Percent of the spine read so far, for the hairline under the nav. */
  progress: number;
}

/** The grouped nav, the progress hairline and the "Ship something" links (reference L70–121). */
export function DocsSidebar({ active, progress }: DocsSidebarProps) {
  return (
    <aside className="docs-aside">
      <div className="docs-aside-sticky">
        <div className="docs-aside-label">{DOCS.sidebarLabel}</div>

        <nav className="docs-nav" aria-label={DOCS.navLabel}>
          {NAV.map((group) => (
            <div key={group.group}>
              <div className="docs-nav-group-head">
                <span className="docs-nav-group-index">{group.index}</span>
                <span className="docs-nav-group-name">{group.group}</span>
              </div>
              <ul className="docs-nav-list">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} data-cursor="hover" data-on={active === item.id} className="docs-nav-link">
                      <span className="docs-nav-dot" aria-hidden />
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="docs-ship">
          <div className="docs-progress" aria-hidden>
            <div className="docs-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="docs-ship-label">{DOCS.ship.title}</div>
          <div className="docs-ship-links">
            {DOCS.ship.links.map((link) =>
              link.external ? (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer" data-cursor="hover" className="docs-ship-link">
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href} data-cursor="hover" className="docs-ship-link">
                  {link.label}
                </Link>
              ),
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
