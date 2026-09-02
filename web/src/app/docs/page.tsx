import type { Metadata } from "next";
import { DOCS, DocsPage } from "@/features/docs";

export const metadata: Metadata = { title: DOCS.title };

export default function Page() {
  return <DocsPage />;
}
