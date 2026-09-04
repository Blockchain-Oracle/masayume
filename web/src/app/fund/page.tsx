import type { Metadata } from "next";
import { FundPage } from "@/features/funding";

export const metadata: Metadata = { title: "Add money" };

/** Reached only from the Add-money modal, as in the reference (`Header.tsx` L65–67 removed its nav slot). */
export default function Page() {
  return <FundPage />;
}
