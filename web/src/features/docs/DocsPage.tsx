"use client";

import { useEffect, useState } from "react";
import { ALL_IDS } from "./copy";
import { DocsContent } from "./DocsContent";
import { DocsMasthead } from "./DocsMasthead";
import { DocsSidebar } from "./DocsSidebar";

/**
 * The documentation page — ported from `reference/yosuku/app/docs/page.tsx`.
 *
 * The shell (marquee, header, cursor, grain, footer) is the root layout's; the page
 * brings the two-column body, the scroll-spy and the progress hairline. Every value the
 * reference wrote as an inline utility lives in `styles/docs.css`.
 */
export function DocsPage() {
  const [active, setActive] = useState<string>(ALL_IDS[0] ?? "");

  // Scroll-spy: highlight the section currently in view (reference L45–55). The top
  // inset is read off the first section's own scroll margin, so the spy and the anchor
  // offset agree by construction — the app strip included.
  useEffect(() => {
    const sections = ALL_IDS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const first = sections[0];
    if (!first) return;
    const top = getComputedStyle(first).scrollMarginTop;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: `-${top} 0% -65% 0%`, threshold: 0 },
    );
    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const progress = ((ALL_IDS.indexOf(active) + 1) / ALL_IDS.length) * 100;

  return (
    <div className="container docs-page">
      <div className="docs-layout">
        <DocsSidebar active={active} progress={progress} />
        <div className="docs-content">
          <DocsMasthead />
          <DocsContent />
        </div>
      </div>
    </div>
  );
}
