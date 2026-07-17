/* ============================================================
   Central content source for Southpage.
   Keeping copy here keeps sections presentational & reusable.
   ============================================================ */

export const NAV_LINKS = [
  { label: "Work", href: "#work" },
  { label: "Studio", href: "#studio" },
  { label: "Services", href: "#services" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
] as const;

export const STATS = [
  { value: 120, suffix: "+", label: "Projects shipped" },
  { value: 40, suffix: "M", label: "Users reached", prefix: "" },
  { value: 12, suffix: "", label: "Awards & features" },
  { value: 98, suffix: "%", label: "Client retention" },
] as const;

export const SERVICES = [
  {
    index: "01",
    title: "Brand & Identity",
    summary:
      "Positioning, art direction and visual systems that make a company impossible to confuse with anyone else.",
    tags: ["Strategy", "Art Direction", "Design Systems"],
  },
  {
    index: "02",
    title: "Web Design",
    summary:
      "Editorial, motion-led interfaces engineered pixel-by-pixel to feel expensive on every screen.",
    tags: ["UX", "UI", "Motion"],
  },
  {
    index: "03",
    title: "Development",
    summary:
      "Production-grade Next.js builds with buttery 60fps interaction and 95+ performance scores.",
    tags: ["Next.js", "WebGL", "Performance"],
  },
  {
    index: "04",
    title: "Creative Direction",
    summary:
      "Ongoing partnership — we hold the vision so every touchpoint compounds into one unmistakable brand.",
    tags: ["Retainer", "Campaigns", "Content"],
  },
] as const;

export const PROJECT_FIELDS = [
  "All",
  "Product",
  "Brand",
  "Commerce",
  "Editorial",
] as const;

export type ProjectField = (typeof PROJECT_FIELDS)[number];

export const PROJECTS = [
  {
    id: "aurora",
    title: "Aurora",
    category: "Fintech Platform",
    field: "Product",
    tagline: "A banking experience that finally feels human.",
    year: "2025",
    accent: "#3b82f6",
  },
  {
    id: "monolith",
    title: "Monolith",
    category: "Architecture Studio",
    field: "Brand",
    tagline: "An identity as considered as the buildings.",
    year: "2025",
    accent: "#7c3aed",
  },
  {
    id: "halcyon",
    title: "Halcyon",
    category: "Luxury Travel",
    field: "Editorial",
    tagline: "Slow journeys, told at the pace they deserve.",
    year: "2024",
    accent: "#0ea5e9",
  },
  {
    id: "vesper",
    title: "Vesper",
    category: "Fashion House",
    field: "Commerce",
    tagline: "A boutique that sells the way it dresses.",
    year: "2024",
    accent: "#a855f7",
  },
  {
    id: "cascade",
    title: "Cascade",
    category: "SaaS Analytics",
    field: "Product",
    tagline: "Data that reads like a story, not a spreadsheet.",
    year: "2023",
    accent: "#22d3ee",
  },
  {
    id: "atlas",
    title: "Atlas",
    category: "Property Group",
    field: "Brand",
    tagline: "A portfolio of places, unified under one mark.",
    year: "2023",
    accent: "#6366f1",
  },
] as const;

export const PROCESS = [
  {
    step: "01",
    title: "Discover",
    body: "We interrogate the business, the audience and the ambition until the strategy is undeniable.",
  },
  {
    step: "02",
    title: "Design",
    body: "Concepts become craft. Type, motion and interaction are refined to the last frame.",
  },
  {
    step: "03",
    title: "Build",
    body: "Engineering the design into a fast, accessible, resilient product that ships.",
  },
  {
    step: "04",
    title: "Evolve",
    body: "We measure, iterate and extend — turning a launch into lasting momentum.",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "Southpage didn't redesign our site — they redefined how the market sees us. Conversions doubled in a quarter.",
    name: "Elena Márquez",
    role: "CEO, Aurora",
  },
  {
    quote:
      "The most meticulous design team we've ever worked with. Every pixel has intent. Every scroll feels considered.",
    name: "Julian Reeve",
    role: "Founder, Monolith",
  },
  {
    quote:
      "It felt less like hiring an agency and more like acquiring a creative department that already understood us.",
    name: "Naomi Adeyemi",
    role: "CMO, Halcyon",
  },
] as const;

export const SOCIALS = [
  { label: "Instagram", href: "#" },
  { label: "Twitter / X", href: "#" },
  { label: "Dribbble", href: "#" },
  { label: "LinkedIn", href: "#" },
] as const;
