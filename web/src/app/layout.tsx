import type { Metadata } from "next";
import { AppStrip, CustomCursor, Footer, GrainOverlay, Header, Marquee } from "@/components/shell";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BRAND } from "@/lib/copy";
import { fontVariables } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { AppProviders } from "@/providers";
import "@/styles/index.css";

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
  description: `${BRAND.name} — ${BRAND.tagline}. Live price windows, one-tap calls, and settlement receipts you can click.`,
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: BRAND.name },
  other: { "mobile-web-app-capable": "yes" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("antialiased cursor-custom", fontVariables)} suppressHydrationWarning>
        {/* Paint the resolved theme on the FIRST frame (no flash of dark). Runs
            synchronously before the app renders; mirrors lib/theme resolveTheme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <AppStrip />
        <AppProviders>
          <TooltipProvider>
            <Toaster limit={1}>
              <Marquee />
              <Header />
              <GrainOverlay />
              <CustomCursor />
              <main className="page-shell">{children}</main>
              <Footer />
            </Toaster>
          </TooltipProvider>
        </AppProviders>
      </body>
    </html>
  );
}
