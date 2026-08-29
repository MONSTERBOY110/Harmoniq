import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { OfflineBanner } from "@/components/offline-banner";
import { AuthProvider } from "@/features/auth/auth-provider";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const DIRECTION_CONTRACT = `
impeccable direction contract (seed dae84eff)
THESIS: A record-label stage plan for a karaoke night: one enormous light wordmark on a near-black grid, friends as stage-lit cards floating around it, and one lyric line filling with amber as it is sung. Refuses the feature-card hero and the neon-glow dark theme.
OWN-WORLD: Neutral near-black ground with a faint hairline grid, off-white and two greys for type, Stage Amber as the only accent (sweep, primary action), eight singer gels for people, stage-light gradients (teal, magenta) on tiles in place of photography, 6 px radii, glass pill nav; Geist set light and large for display and lyric lines, Geist Mono for codes and timers.
STORY: A visitor meets the wordmark like a label's mark, sees friends singing a lyric that fills with light, understands "we sing together on a call", and opens a room or types a code.
FIRST VIEWPORT: Centered wordmark at roughly 11vw with the meter mark, two floating gel-lit cards at the corners with one-line captions, a small label beneath, then a tilted stacked demo card with a rotating text ring at its edge; a fixed glass pill nav at the bottom carrying Open a room.
FORM: User-pinned reference: kuratemusic.com (independent record label), translated to Harmoniq's context on 2026-08-29 and applied platform-wide; supersedes the karaoke-box direction. Seed key dae84eff.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
`;

export const metadata: Metadata = {
  title: {
    default: "Harmoniq",
    template: "%s | Harmoniq",
  },
  description:
    "Sing karaoke with friends on a video call. Search any song on YouTube, share a room code, and sing together with synced lyrics.",
  applicationName: "Harmoniq",
};

export const viewport: Viewport = {
  themeColor: "#0e0f0f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark h-full ${geist.variable} ${geistMono.variable}`}
      style={{ colorScheme: "dark" }}
    >
      <body className="flex min-h-full flex-col">
        {/* The direction contract must survive the production build as a real HTML comment. */}
        <div hidden dangerouslySetInnerHTML={{ __html: `<!--
${DIRECTION_CONTRACT}
-->` }} />
        <AuthProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </AuthProvider>
        <Toaster />
        <OfflineBanner />
      </body>
    </html>
  );
}
