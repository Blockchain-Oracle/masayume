import Link from "next/link";
import type { ReactNode } from "react";
import type { ContractRow } from "./contracts";
import { DOCS } from "./copy";

/** The reference prints the first ten characters of an id (L250). */
const ADDR_LEAD = 10;

interface SectionMeta {
  num: string;
  eyebrow: string;
  title: string;
}

/** Number · rule · eyebrow, then the title (reference `SectionHead`, L290–300). */
export function SectionHead({ num, eyebrow, title }: SectionMeta) {
  return (
    <div className="docs-section-head">
      <div className="docs-section-eyebrow">
        <span className="docs-section-num">{num}</span>
        <span className="docs-section-rule" aria-hidden />
        <span className="docs-section-kicker">{eyebrow}</span>
      </div>
      <h2 className="docs-section-title">{title}</h2>
    </div>
  );
}

/** One numbered section, the scroll-spy's unit (reference `Section`, L303–309). */
export function Section({ id, meta, children }: { id: string; meta: SectionMeta; children: ReactNode }) {
  return (
    <section id={id} className="docs-section">
      <SectionHead {...meta} />
      <div className="docs-body">{children}</div>
    </section>
  );
}

/** Key · value rows in a ruled plate (reference `KeyVals`, L312–322). */
export function KeyVals({ items }: { items: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div className="docs-kv">
      {items.map(([key, value]) => (
        <div key={key} className="docs-kv-row">
          <span className="docs-kv-key">{key}</span>
          <span className="docs-kv-val">{value}</span>
        </div>
      ))}
    </div>
  );
}

export interface CardItem {
  name: string;
  href: string;
  body: string;
}

/** The numbered link cards (reference `Cards`, L325–337). */
export function Cards({ items }: { items: ReadonlyArray<CardItem> }) {
  return (
    <div className="docs-cards">
      {items.map((card, i) => (
        <Link key={card.name} href={card.href} data-cursor="hover" className="docs-card">
          <span className="docs-card-index">0{i + 1}</span>
          <div className="docs-card-name">{card.name}</div>
          <div className="docs-card-body">{card.body}</div>
          <span className="docs-card-arrow" aria-hidden>
            →
          </span>
        </Link>
      ))}
    </div>
  );
}

/** External reference links under a section (reference `Links`, L403–411). */
export function Links({ items }: { items: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div className="docs-links">
      {items.map(([label, href]) => (
        <a key={href} href={href} target="_blank" rel="noreferrer" data-cursor="hover" className="docs-link">
          {label} ↗
        </a>
      ))}
    </div>
  );
}

/**
 * The verify table (reference L238–253). The reference distinguishes packages from a proof tx;
 * every row here is a deployed contract address, so the chip says so and the link opens the
 * Somnia explorer on that address.
 */
export function ContractsTable({ rows }: { rows: ReadonlyArray<ContractRow> }) {
  return (
    <div className="docs-contracts">
      {rows.map((row) => (
        <a key={row.address} href={row.href} target="_blank" rel="noreferrer" data-cursor="hover" className="docs-contract">
          <span className="docs-contract-left">
            <span className="docs-contract-chip">{DOCS.addrChip}</span>
            <span className="docs-contract-label">{row.label}</span>
          </span>
          <span className="docs-contract-id">{row.address.slice(0, ADDR_LEAD)}… ↗</span>
        </a>
      ))}
    </div>
  );
}
