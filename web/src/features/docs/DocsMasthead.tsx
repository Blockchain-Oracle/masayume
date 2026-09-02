import { SDK_VERSION } from "./contracts";
import { DOCS } from "./copy";

/** The editorial masthead: corner ticks, the pulsing eyebrow line, the title, the intro and the chips (reference L126–157). */
export function DocsMasthead() {
  return (
    <header className="docs-masthead">
      <span aria-hidden className="docs-tick tl" />
      <span aria-hidden className="docs-tick tr" />

      <div className="docs-eyebrow">
        <span className="docs-eyebrow-dot" aria-hidden />
        {DOCS.eyebrow.a}
        <span className="docs-eyebrow-rule" aria-hidden />
        {DOCS.eyebrow.b}
        <span className="docs-eyebrow-rule sm" aria-hidden />
        <span className="docs-eyebrow-net">{DOCS.eyebrow.c}</span>
      </div>

      <h1 className="docs-h1">
        {DOCS.h1.lead}
        <span className="vermilion">{DOCS.h1.accent}</span>
        {DOCS.h1.tail}
      </h1>

      <p className="docs-intro">{DOCS.intro}</p>

      <div className="docs-chips">
        <span className="docs-chip">
          <span className="docs-chip-dot" aria-hidden />
          {DOCS.chips.pkg}
        </span>
        <span className="docs-chip dim">v{SDK_VERSION}</span>
        <a href="#verify" data-cursor="hover" className="docs-chip verify">
          {DOCS.chips.verify}
        </a>
      </div>
    </header>
  );
}
