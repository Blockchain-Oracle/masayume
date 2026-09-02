import type { Metadata } from "next";
import { DEMO, DemoPage } from "@/features/demo";

export const metadata: Metadata = { title: DEMO.title };

export default function Page() {
  return <DemoPage />;
}
