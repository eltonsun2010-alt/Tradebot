import {
  Syne,
  Inter,
  Instrument_Serif,
  Fraunces,
  Poppins,
  Anton,
} from "next/font/google";

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

// ---- Demo-only display faces (loaded on their demo page only) ----

// Coffee demo — warm, characterful serif.
export const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

// Dental demo — friendly, rounded geometric sans.
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

// Fitness demo — heavy condensed display.
export const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});
