import { Syne, Inter, Instrument_Serif } from "next/font/google";

// Display — architectural, modern grotesque. Big headlines.
export const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

// Body / UI — neutral, legible at every size.
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Editorial accent — used sparingly for luxury italic emphasis.
export const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});
