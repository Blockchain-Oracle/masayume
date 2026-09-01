"use client";

import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
import MasayumeMark from "../MasayumeMark";
import ThemeToggle from "../ThemeToggle";
import { HeaderAccount } from "./HeaderAccount";
import { MobileBottomNav } from "./MobileBottomNav";
import { isActiveHref, PRIMARY_NAV, SECONDARY_NAV } from "./nav-items";
import { useFloatingMenus } from "./useFloatingMenus";

export default function Header() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const mobileMoreRef = useRef<HTMLDivElement>(null);
  const refs = useRef<ReadonlyArray<RefObject<HTMLElement | null>>>([moreMenuRef, mobileMoreRef]);
  useFloatingMenus(refs.current, () => setShowMore(false));

  // Navigating away closes anything floating, so a menu never survives a route change.
  useEffect(() => {
    setShowMore(false);
  }, [pathname]);

  const secondaryActive = SECONDARY_NAV.some((link) => isActiveHref(pathname, link.href));

  return (
    <>
      <header className="header">
        <a className="logo" href="/markets" aria-label="Masayume markets" data-cursor="hover">
          <span className="logo-mark">
            <MasayumeMark />
          </span>
          <span>MASAYUME</span>
        </a>

        <nav className="nav" aria-label="Primary navigation">
          <div className="nav-links">
            {PRIMARY_NAV.map((link) => {
              const active = isActiveHref(pathname, link.href);
              return (
                <a
                  key={link.name}
                  href={link.href}
                  className={`nav-link ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  data-cursor="hover"
                >
                  {link.name}
                  {link.beta && <sup className="nav-beta">beta</sup>}
                </a>
              );
            })}

            <div className="nav-more" ref={moreMenuRef}>
              <button
                type="button"
                className={`nav-link nav-more-button ${secondaryActive ? "active" : ""} ${showMore ? "open" : ""}`}
                onClick={() => setShowMore((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={showMore}
                aria-controls="secondary-nav-menu"
                data-cursor="hover"
              >
                More
                <ChevronDown aria-hidden="true" />
              </button>
              {showMore && (
                <div className="nav-more-menu" id="secondary-nav-menu" role="menu">
                  {SECONDARY_NAV.map((link) => {
                    const active = isActiveHref(pathname, link.href);
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.name}
                        href={link.href}
                        className={`nav-more-link ${active ? "active" : ""}`}
                        role="menuitem"
                        aria-current={active ? "page" : undefined}
                        data-cursor="hover"
                      >
                        {Icon && <Icon aria-hidden="true" />}
                        <span>{link.name}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="header-right">
            <ThemeToggle />
            <HeaderAccount onOpenMenu={() => setShowMore(false)} />
          </div>
        </nav>
      </header>

      <MobileBottomNav ref={mobileMoreRef} showMore={showMore} onToggleMore={() => setShowMore((prev) => !prev)} />
    </>
  );
}
