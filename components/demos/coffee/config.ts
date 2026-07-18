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

const ux = (id: string, w = 1400) =>
  `https://images.unsplash.com/${id}?w=${w}&q=70&auto=format&fit=crop`;

// High-confidence, widely-used Unsplash coffee photos (reused across slots
// where needed for reliability; the gradient fallback covers any that stall).
export const coffeeImg = {
  heroPour: ux("photo-1461023058943-07fcbe16d735", 1600),
  cup: ux("photo-1495474472287-4d71bcdd2085"),
  beans: ux("photo-1447933601403-0c6688de566e"),
  cafe: ux("photo-1453614512568-c4024d13c247", 1600),
  table: ux("photo-1442512595331-e89e73853f31"),
  pourover: ux("photo-1509042239860-f550ce710b93"),
  latteArt: ux("photo-1509042239860-f550ce710b93"),
  roast: ux("photo-1447933601403-0c6688de566e"),
};
