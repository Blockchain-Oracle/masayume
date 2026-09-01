import type { Metadata } from "next";
import { AppShell, LiveTicker } from "@/components/chrome";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BRAND } from "@/lib/copy";
import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/providers";
import "@/styles/index.css";

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description: `${BRAND.name} — ${BRAND.tagline}. Live price windows, one-tap calls, and settlement receipts you can click.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("dark h-full antialiased", fontVariables)}>
      <body className="flex min-h-full flex-col bg-ground text-ink">
        <AppProviders>
          <TooltipProvider>
            <Toaster limit={1}>
              <AppShell ticker={<LiveTicker />}>{children}</AppShell>
            </Toaster>
          </TooltipProvider>
        </AppProviders>
      </body>
    </html>
  );
}
