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

export const MANIFESTO =
  "We are a small studio with a large obsession — interfaces that move like they mean it. Design is how it works. Motion is how it feels. The details are the whole thing. Every project is engineered to feel expensive, and to convert like it.";

export const TIMELINE = [
  {
    year: "2019",
    title: "Founded",
    body: "Southpage opens with three people and one belief — the web could feel far better than it does.",
  },
  {
    year: "2021",
    title: "Became a studio",
    body: "Strategy, design and engineering come under one roof, so nothing gets lost in translation.",
  },
  {
    year: "2023",
    title: "Recognised",
    body: "Awwwards, CSSDA and a client roster that now spans four continents and three industries.",
  },
  {
    year: "2025",
    title: "Today",
    body: "A tight senior team shipping cinematic work for brands that refuse to blend in.",
  },
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

/*
  PROJECTS are the studio's showcase. Each links to a full, standalone demo
  website (see app/demos/*). Distinct topic, palette and design per project.
*/
export const PROJECTS = [
  {
    id: 'ember',
    title: 'Ember & Oak',
    category: 'Coffee Roaster',
    tagline: 'Small-batch coffee, roasted with patience.',
    year: '2025',
    accent: '#c65f3f',
    layout: 'editorial',
    demo: '/demos/coffee',
  },
  {
    id: 'marlowe',
    title: 'Marlowe Dental',
    category: 'Dental Studio',
    tagline: 'Modern dentistry that finally feels calm.',
    year: '2025',
    accent: '#14b8a6',
    layout: 'dashboard',
    demo: '/demos/dental',
  },
  {
    id: 'pulse',
    title: 'Pulse',
    category: 'Strength Studio',
    tagline: 'Train loud. Move fast. Feel unstoppable.',
    year: '2025',
    accent: '#bef264',
    layout: 'analytics',
    demo: '/demos/fitness',
  },
] as const;

export type Project = (typeof PROJECTS)[number];

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
