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
  PROJECTS double as the Work list and the /work/[slug] case-study pages.
  Copy here is polished PLACEHOLDER content — swap client, results and the
  overview/challenge/approach/outcome text for real project details.
*/
export const PROJECTS = [
  {
    id: "aurora",
    title: "Aurora",
    category: "Fintech Platform",
    field: "Product",
    tagline: "A banking experience that finally feels human.",
    year: "2025",
    accent: "#3b82f6",
    layout: "dashboard",
    client: "Aurora Financial",
    timeframe: "12 weeks",
    services: ["Product Strategy", "UX / UI", "Development"],
    deliverables: ["Design system", "iOS & web app", "Marketing site"],
    overview:
      "Aurora wanted personal banking to feel calm instead of clinical. We rebuilt the experience end to end — from first impression to daily use — around clarity, trust and a little quiet delight.",
    challenge:
      "The old product buried its best features under dense menus, and new users dropped off before ever funding an account. Growth had stalled and the brand felt like every other bank.",
    approach:
      "We led with a single, opinionated flow: one clear next step on every screen. A restrained visual system, generous space and motion that guides rather than decorates made the product feel effortless and premium.",
    outcome:
      "Onboarding became something people finished. The redesign gave Aurora a distinct voice in a crowded market and a foundation their team could extend for years.",
    results: [
      { value: 2, suffix: "×", label: "Signup conversion" },
      { value: 38, suffix: "%", label: "Faster onboarding" },
      { value: 4, suffix: ".9★", label: "App store rating" },
    ],
  },
  {
    id: "monolith",
    title: "Monolith",
    category: "Architecture Studio",
    field: "Brand",
    tagline: "An identity as considered as the buildings.",
    year: "2025",
    accent: "#7c3aed",
    layout: "portfolio",
    client: "Monolith Studio",
    timeframe: "8 weeks",
    services: ["Brand Identity", "Art Direction", "Web Design"],
    deliverables: ["Visual identity", "Portfolio site", "Print system"],
    overview:
      "An award-winning architecture practice with a forgettable brand. We built an identity as precise and material as their work, then gave it a home that lets the projects breathe.",
    challenge:
      "Their portfolio read like a folder of photos. Nothing carried the weight or restraint of the buildings themselves, and prospective clients couldn't feel the craft.",
    approach:
      "A confident grotesk wordmark, an architectural grid, and full-bleed imagery framed by silence. Every interaction is slow and deliberate — the site behaves the way their buildings feel.",
    outcome:
      "Monolith now presents like the studio it is. The new identity travels from business cards to billboards without losing an ounce of intent.",
    results: [
      { value: 3, suffix: "×", label: "Enquiry quality" },
      { value: 60, suffix: "%", label: "Longer sessions" },
      { value: 2, suffix: " awards", label: "Design recognition" },
    ],
  },
  {
    id: "halcyon",
    title: "Halcyon",
    category: "Luxury Travel",
    field: "Editorial",
    tagline: "Slow journeys, told at the pace they deserve.",
    year: "2024",
    accent: "#0ea5e9",
    layout: "editorial",
    client: "Halcyon Journeys",
    timeframe: "10 weeks",
    services: ["Editorial Design", "Art Direction", "Development"],
    deliverables: ["Editorial site", "Booking flow", "Content system"],
    overview:
      "Halcyon curates unhurried, high-touch travel. We designed an editorial experience that sells the feeling of a place first and the itinerary second.",
    challenge:
      "Luxury travel sites all look the same — grids of stock photos and urgency banners. Halcyon needed to feel like a beautifully printed magazine you never want to close.",
    approach:
      "Long-form storytelling, cinematic imagery and typographic rhythm carry each destination. Booking is present but never pushy, folded gently into the narrative.",
    outcome:
      "Guests arrive already sold on the experience. The site became Halcyon's strongest sales tool — and its most shared.",
    results: [
      { value: 55, suffix: "%", label: "More enquiries" },
      { value: 2, suffix: "×", label: "Time on page" },
      { value: 30, suffix: "%", label: "Higher booking value" },
    ],
  },
  {
    id: "vesper",
    title: "Vesper",
    category: "Fashion House",
    field: "Commerce",
    tagline: "A boutique that sells the way it dresses.",
    year: "2024",
    accent: "#a855f7",
    layout: "commerce",
    client: "Vesper Atelier",
    timeframe: "9 weeks",
    services: ["E-commerce", "Art Direction", "Development"],
    deliverables: ["Storefront", "Lookbook", "Checkout"],
    overview:
      "Vesper makes considered, seasonless clothing. We built a storefront that treats commerce as editorial — where browsing feels like flipping through a lookbook, not filling a cart.",
    challenge:
      "A generic template flattened the brand and leaked sales at checkout. The clothes felt expensive; the shopping experience didn't.",
    approach:
      "Editorial product pages, tactile hover states and a checkout stripped to the essentials. Every detail — type, motion, pacing — echoes the atelier's restraint.",
    outcome:
      "The store now feels like the brand. Shoppers browse longer, trust more, and abandon less.",
    results: [
      { value: 46, suffix: "%", label: "Revenue lift" },
      { value: 27, suffix: "%", label: "Less cart drop-off" },
      { value: 2, suffix: "×", label: "Return visitors" },
    ],
  },
  {
    id: "cascade",
    title: "Cascade",
    category: "SaaS Analytics",
    field: "Product",
    tagline: "Data that reads like a story, not a spreadsheet.",
    year: "2023",
    accent: "#22d3ee",
    layout: "analytics",
    client: "Cascade Analytics",
    timeframe: "14 weeks",
    services: ["Product Design", "Design System", "Development"],
    deliverables: ["Dashboard", "Design system", "Docs"],
    overview:
      "Cascade turns messy product data into clear decisions. We redesigned the dashboard so the important signal is always the loudest thing on screen.",
    challenge:
      "Power was there, but buried. New users were overwhelmed and churned inside a week, never reaching the aha moment.",
    approach:
      "A calm, layered interface: headline metrics first, detail on demand. A rigorous design system kept dozens of charts feeling like one considered product.",
    outcome:
      "Teams understand their data faster and stick around. Cascade finally looks as sharp as it is capable.",
    results: [
      { value: 42, suffix: "%", label: "Better retention" },
      { value: 3, suffix: "×", label: "Faster to insight" },
      { value: 95, suffix: "+", label: "Lighthouse score" },
    ],
  },
  {
    id: "atlas",
    title: "Atlas",
    category: "Property Group",
    field: "Brand",
    tagline: "A portfolio of places, unified under one mark.",
    year: "2023",
    accent: "#6366f1",
    layout: "estate",
    client: "Atlas Group",
    timeframe: "11 weeks",
    services: ["Brand Identity", "Web Design", "Development"],
    deliverables: ["Master brand", "Property sites", "Guidelines"],
    overview:
      "Atlas develops distinctive places across a dozen cities. We built a flexible master brand that unifies a diverse portfolio without flattening what makes each property special.",
    challenge:
      "Every development had its own logo, tone and site. The group had no coherent presence, and cross-selling between properties was impossible.",
    approach:
      "A confident master brand with room to flex per property — a shared system of type, grid and motion that scales from the group down to a single building.",
    outcome:
      "Atlas now reads as one considered group. New properties launch in days, not months, on a system that already feels premium.",
    results: [
      { value: 12, suffix: " sites", label: "Unified in one system" },
      { value: 70, suffix: "%", label: "Faster launches" },
      { value: 2, suffix: "×", label: "Brand recall" },
    ],
  },
] as const;

export type Project = (typeof PROJECTS)[number];

export const getProject = (id: string) => PROJECTS.find((p) => p.id === id);

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
