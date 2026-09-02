"use client";

import { useState } from "react";
import { DOCS } from "./copy";

interface Token {
  kind: "comment" | "string" | "keyword" | "num" | "plain";
  value: string;
}

/** Lightweight syntax tinting — comments, strings, keywords, numbers (reference L341–355). */
function tokenize(line: string): Token[] {
  const re = /(\/\/.*$)|('[^']*'|"[^"]*"|`[^`]*`)|\b(import|from|const|let|await|new|return|export|function)\b|(\d[\d_]*)/g;
  const out: Token[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line))) {
    if (match.index > last) out.push({ kind: "plain", value: line.slice(last, match.index) });
    if (match[1]) out.push({ kind: "comment", value: match[1] });
    else if (match[2]) out.push({ kind: "string", value: match[2] });
    else if (match[3]) out.push({ kind: "keyword", value: match[3] });
    else if (match[4]) out.push({ kind: "num", value: match[4] });
    last = re.lastIndex;
  }
  if (last < line.length) out.push({ kind: "plain", value: line.slice(last) });
  return out;
}

/** The reference's TOK_CLASS, as classes in docs.css — the block is a dark island in both themes. */
const TOKEN_CLASS: Record<Token["kind"], string> = {
  comment: "tk-comment",
  string: "tk-string",
  keyword: "tk-keyword",
  num: "tk-num",
  plain: "tk-plain",
};

const COPIED_MS = 1_400;

/** A code block with the three dots, its file label and a copy button (reference `Code`, L365–401). */
export function Code({ label, children }: { label: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard
      ?.writeText(children)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), COPIED_MS);
      })
      .catch(() => {});
  };
  return (
    <div className="docs-code">
      <div className="docs-code-bar">
        <div className="docs-code-bar-left">
          <span className="docs-code-dots" aria-hidden>
            <span />
            <span />
            <span />
          </span>
          <span className="docs-code-label">{label}</span>
        </div>
        <button type="button" onClick={copy} data-cursor="hover" className="docs-code-copy">
          {copied ? DOCS.copy.done : DOCS.copy.idle}
        </button>
      </div>
      <pre className="docs-code-pre">
        <code>
          {children.split("\n").map((line, i) => (
            <div key={i}>
              {line === ""
                ? " "
                : tokenize(line).map((token, j) => (
                    <span key={j} className={TOKEN_CLASS[token.kind]}>
                      {token.value}
                    </span>
                  ))}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
