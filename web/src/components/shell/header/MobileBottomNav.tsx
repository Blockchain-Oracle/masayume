"use client";

import { MoreHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Ref } from "react";
import { isActiveHref, MOBILE_NAV, MOBILE_OVERFLOW } from "./nav-items";

interface MobileBottomNavProps {
  showMore: boolean;
  onToggleMore: () => void;
  ref?: Ref<HTMLDivElement>;
}

/**
 * The phone's persistent floating pill nav. `More` lights up for everything behind it —
 * overflow included — so a user is never on a page whose own tab shows no sign of where
 * they are.
 */
export function MobileBottomNav({ showMore, onToggleMore, ref }: MobileBottomNavProps) {
  const pathname = usePathname();
  const moreActive = MOBILE_OVERFLOW.some((link) => isActiveHref(pathname, link.href));

  return (
    <div ref={ref}>
      <nav className="mobile-bottom-nav" aria-label="Mobile primary navigation">
        {MOBILE_NAV.map((link) => {
          const active = isActiveHref(pathname, link.href);
          const Icon = link.icon;
          return (
            <a key={link.name} href={link.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
              {Icon && <Icon aria-hidden="true" />}
              <span>{link.name}</span>
            </a>
          );
        })}
        <button
          type="button"
          className={moreActive || showMore ? "active" : ""}
          aria-haspopup="menu"
          aria-expanded={showMore}
          aria-controls="mobile-more-menu"
          onClick={onToggleMore}
        >
          <MoreHorizontal aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      {showMore && (
        <div className="mobile-more-menu" id="mobile-more-menu" role="menu">
          {MOBILE_OVERFLOW.map((link) => {
            const active = isActiveHref(pathname, link.href);
            const Icon = link.icon;
            return (
              <a
                key={link.name}
                href={link.href}
                className={active ? "active" : ""}
                role="menuitem"
                aria-current={active ? "page" : undefined}
              >
                {Icon && <Icon aria-hidden="true" />}
                <span>{link.name}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
