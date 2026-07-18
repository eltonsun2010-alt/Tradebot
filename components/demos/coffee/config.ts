import type { DemoConfig } from "@/components/demos/DemoShell";

export const coffeeConfig: DemoConfig = {
  name: "Ember & Oak",
  base: "/demos/coffee",
  theme: "light",
  fontDisplay: "var(--font-fraunces), Georgia, serif",
  colors: {
    bg: "#f6efe3",
    ink: "#2b1c13",
    sub: "#8a6d4b",
    accent: "#c65f3f",
    onAccent: "#ffffff",
    line: "rgba(43,28,19,0.14)",
    panel: "#efe4d2",
  },
  nav: [
    { label: "Coffee", href: "/demos/coffee/menu" },
    { label: "Our Story", href: "/demos/coffee/about" },
    { label: "Visit", href: "/demos/coffee/visit" },
  ],
  cta: { label: "Order beans", href: "/demos/coffee/menu" },
  contact: {
    email: "hello@emberandoak.coffee",
    phone: "(555) 210-8890",
    address: "42 Maple Street, corner of Oak.\nOpen 7am – 4pm, every day.",
  },
};

/** Warm gradient fallbacks so a slot is never blank if a photo is slow. */
export const warm = "linear-gradient(160deg, #c65f3f, #2b1c13)";
export const warmSoft = "linear-gradient(160deg, #d8a48a, #8a6d4b)";

// Keyword-based photos (LoremFlickr): every URL reliably returns a real photo
// matching the keywords, so no individual link can be "wrong". `lock` keeps
// each slot's photo stable across loads; the gradient fallback covers any stall.
const lf = (keywords: string, lock: number) =>
  `https://loremflickr.com/1200/1200/${keywords}?lock=${lock}`;

export const coffeeImg = {
  heroPour: lf("coffee,cafe", 21),
  cup: lf("cappuccino,coffee", 22),
  beans: lf("coffee,beans", 23),
  cafe: lf("cafe,coffeeshop", 24),
  table: lf("coffee,cup,table", 25),
  pourover: lf("coffee,brewing", 26),
  latteArt: lf("latte,coffee", 27),
  roast: lf("coffee,roasting", 28),
};
