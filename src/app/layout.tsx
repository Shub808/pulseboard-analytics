import type { Metadata, Viewport } from "next";

/**
 * Fonts are self-hosted from npm (Fontsource) rather than fetched from Google
 * Fonts at build time. The app therefore makes no third-party font request at
 * runtime, builds in an offline/air-gapped CI environment, and avoids the
 * privacy and availability cost of a cross-origin font host. Both faces are
 * variable, so one file per family covers every weight we use.
 */
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";

import { AppShell } from "@/components/app-shell";
import { ThemeProvider, themeBootstrapScript } from "@/components/theme-provider";
import { Providers } from "@/app/providers";
import { vizPaletteCss } from "@/lib/viz-palette";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PulseBoard — analytics & operations dashboard",
    template: "%s · PulseBoard",
  },
  description:
    "A production-style React/Next.js analytics dashboard: server-side filtering, period-over-period KPIs, accessible data tables and CSV reporting. Portfolio project running on synthetic demo data.",
  applicationName: "PulseBoard",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Applies the stored theme before first paint — see ThemeProvider. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        {/* Chart tokens, generated from the TypeScript palette. */}
        <style dangerouslySetInnerHTML={{ __html: vizPaletteCss }} />
      </head>
      <body className="min-h-full font-sans">
        <ThemeProvider>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
