import type { Metadata, Viewport } from "next";
import { syne, inter, instrument } from "./fonts";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { Cursor } from "@/components/ui/Cursor";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import "./globals.css";

const SITE = "https://southpage.studio";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Southpage — Premium Web Design Studio",
    template: "%s · Southpage",
  },
  description:
    "Southpage is a premium web design studio crafting fast, cinematic websites for brands that refuse to blend in. Strategy, design and engineering under one roof.",
  keywords: [
    "web design studio",
    "premium web design",
    "creative agency",
    "branding",
    "Next.js development",
    "motion design",
  ],
  authors: [{ name: "Southpage" }],
  openGraph: {
    type: "website",
    url: SITE,
    title: "Southpage — Premium Web Design Studio",
    description:
      "Fast, cinematic websites for brands that refuse to blend in.",
    siteName: "Southpage",
  },
  twitter: {
    card: "summary_large_image",
    title: "Southpage — Premium Web Design Studio",
    description:
      "Fast, cinematic websites for brands that refuse to blend in.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${inter.variable} ${instrument.variable}`}
    >
      <body>
        <SmoothScrollProvider>
          <ScrollProgress />
          <GrainOverlay />
          <Cursor />
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
