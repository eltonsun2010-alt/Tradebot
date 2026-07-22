/* ============================================================
   Central content source for Southpage.
   Keeping copy here keeps sections presentational & reusable.
   ============================================================ */

export const NAV_LINKS = [
  { label: "Home", href: "#top" },
  { label: "Services", href: "#services" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
] as const;

export const SOCIALS = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "Email", href: "mailto:Contact.southpage@gmail.com" },
] as const;

export const SERVICES = [
  {
    index: "01",
    title: "Custom Website Design",
    summary:
      "Every business has a different story to tell. That's why every Southpage website is designed from the ground up to reflect your brand, your goals, and the experience you want your customers to have. No templates. No shortcuts. Just thoughtful design built around your business.",
    tags: ["Brand", "UX / UI", "Bespoke"],
  },
  {
    index: "02",
    title: "Website Development",
    summary:
      "A beautiful website means very little if it feels slow or frustrating to use. Every website we build is responsive, fast-loading, and designed to work seamlessly across desktop, tablet, and mobile devices.",
    tags: ["Responsive", "Fast", "Reliable"],
  },
  {
    index: "03",
    title: "Business Automation",
    summary:
      "Save hours every week by letting your website handle repetitive tasks. From enquiry confirmations and appointment bookings to follow-ups and reminders, automation helps your business respond faster and stay organised.",
    tags: ["Enquiries", "Bookings", "Follow-ups"],
  },
  {
    index: "04",
    title: "Website Redesign",
    summary:
      "Already have a website? We'll transform it into a modern experience that better reflects your business and creates a stronger first impression.",
    tags: ["Refresh", "Modernise", "Convert"],
  },
  {
    index: "05",
    title: "Ongoing Support",
    summary:
      "Businesses change. Your website should be able to change with them. Whether you need updates, improvements, or additional pages, we're here whenever you need us.",
    tags: ["Updates", "Improvements", "Care"],
  },
] as const;

export const WHY_CARDS = [
  {
    title: "Custom From Day One",
    body: "Every project is built specifically for your business. No recycled layouts. No generic templates.",
  },
  {
    title: "Performance Comes First",
    body: "Fast-loading websites create better experiences and provide a stronger technical foundation for your online presence.",
  },
  {
    title: "Designed for Every Device",
    body: "Whether someone visits from their phone, tablet, or desktop, your website will feel consistent, intuitive, and easy to use.",
  },
  {
    title: "Honest Communication",
    body: "You'll always know what's happening throughout your project. Clear timelines. Clear expectations. No surprises.",
  },
  {
    title: "Built to Grow",
    body: "As your business evolves, your website should evolve with it. Every project is built with future improvements in mind.",
  },
  {
    title: "Quality Over Quantity",
    body: "We don't chase volume. We focus on creating websites that reflect the quality of the businesses behind them.",
  },
] as const;

export const AUTOMATIONS = [
  { title: "Instant Enquiry Responses", body: "Let customers know you've received their enquiry the moment they get in touch." },
  { title: "Appointment Bookings", body: "Allow customers to book available times without endless back-and-forth messages." },
  { title: "Follow-Up Workflows", body: "Stay connected with potential customers through automated follow-ups and reminders." },
  { title: "Lead Organisation", body: "Keep enquiries organised so you can spend less time searching and more time responding." },
  { title: "Notifications", body: "Receive instant alerts whenever someone submits an enquiry or books your services." },
  { title: "Custom Workflows", body: "Every business operates differently. We'll tailor automations to suit the way you work." },
] as const;

export const PROCESS = [
  { step: "01", title: "Discover", body: "We start by understanding your business, your goals, and the people you're trying to reach. The better we understand your business, the better we can build for it." },
  { step: "02", title: "Plan", body: "Before any design begins, we carefully plan the structure, content, and user experience. A strong foundation leads to a stronger website." },
  { step: "03", title: "Design", body: "Every layout is designed with clarity, usability, and attention to detail. The goal isn't simply to look good — it's to make visitors feel confident choosing your business." },
  { step: "04", title: "Build", body: "Once approved, your website is developed using modern technologies that prioritise speed, responsiveness, and reliability." },
  { step: "05", title: "Refine", body: "Every page is tested across different devices and refined until everything feels polished. The little details matter." },
  { step: "06", title: "Launch", body: "Once everything is ready, your website goes live. From there, your business has a professional online presence built to grow alongside you." },
] as const;

/* Concept projects — the ones with a live demo link to /demos/*. */
export const CONCEPTS: {
  title: string;
  words: string[];
  body: string;
  accent: string;
  demo: string | null;
}[] = [
  { title: "Modern Café", words: ["Warm", "Editorial", "Inviting"], body: "A cinematic, atmosphere-led café site — tabbed menu, signature plates and a warm reservation flow.", accent: "#b8542e", demo: "/demos/cafe" },
  { title: "Premium Fitness Studio", words: ["Bold", "Kinetic", "Converting"], body: "Heavy display type, scroll-triggered stats and a live timetable — built to convert visitors into members.", accent: "#ccff33", demo: "/demos/forge" },
  { title: "Local Trades Business", words: ["Trusted", "Professional", "Direct"], body: "An electrician's site engineered for enquiries — before/after slider, guarantees and a prominent quote form.", accent: "#f6a723", demo: "/demos/trade" },
  { title: "Professional Services", words: ["Premium", "Minimal", "Confident"], body: "A refined wealth-advisory brand — editorial serif, generous whitespace and quiet, credible motion.", accent: "#1f5f4f", demo: "/demos/meridian" },
];

export const PRICING = [
  {
    name: "Website Essentials",
    price: "399",
    currency: "AUD",
    tagline: "A professional website built to give your business a strong online presence.",
    features: [
      "Custom-designed website",
      "Mobile-responsive design",
      "Contact form integration",
      "Basic SEO setup",
      "Fast-loading performance",
      "Google Maps integration (if required)",
      "Launch support",
      "Two rounds of revisions",
    ],
    best: "Businesses looking for a clean, professional website that builds trust and makes it easy for customers to get in touch.",
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Website + Automation",
    price: "699",
    currency: "AUD",
    tagline: "Everything in Website Essentials, plus smart automation designed to save time and simplify your workflow.",
    features: [
      "Everything in Website Essentials",
      "Automated enquiry responses",
      "Appointment or booking integration",
      "Follow-up workflows",
      "Lead capture automation",
      "CRM integration (where applicable)",
      "Analytics and tracking setup",
      "Personal walkthrough after launch",
    ],
    best: "Businesses wanting to reduce repetitive admin, respond faster, and create a smoother customer experience.",
    cta: "Book a Consultation",
    featured: true,
  },
] as const;

export const FAQS = [
  {
    q: "I'm not good with computers. Will I be able to manage this myself?",
    a: "Absolutely. You won't need to touch any code. Once your website is live, you'll have a simple dashboard where you can update text, images, pricing, and other content without needing technical knowledge. If you'd rather not manage it yourself, we also offer ongoing support, so you can focus on running your business while we handle the updates.",
  },
  {
    q: "I already have Instagram. Why do I need a website?",
    a: "Instagram is great for helping people discover your business. Your website is where they decide whether to trust it. When someone searches on Google, clicks a shared link, or wants to learn more, your website becomes your digital storefront. Unlike social platforms, your website is something you own and control — and it lets you accept enquiries, manage bookings, showcase services, and integrate tools that help your business run more efficiently.",
  },
  {
    q: "I paid for a cheap website before. Why is Southpage different?",
    a: "Many low-cost websites rely on generic templates with little consideration for your business, your customers, or your long-term goals. At Southpage, every website is built specifically for your business with a focus on thoughtful design, performance, responsiveness, and creating a strong first impression. The goal isn't simply to launch a website — it's to create something you're proud to share.",
  },
  {
    q: "How long does a project usually take?",
    a: "Most website projects are completed in around one week. Projects that include website automation are typically completed in around two weeks. Before work begins, you'll receive a clear timeline so you always know what to expect.",
  },
  {
    q: "What if automation doesn't generate more leads?",
    a: "Automation doesn't create demand — it helps you make the most of the opportunities you already have. By responding faster, organising enquiries, sending confirmations, and reducing repetitive admin, automation helps your business operate more efficiently and deliver a smoother experience. You'll also know exactly what your automations are doing — nothing is hidden behind a black box.",
  },
  {
    q: "Will my website work on mobile?",
    a: "Yes. Every Southpage website is designed with a mobile-first approach, ensuring it looks and functions beautifully across phones, tablets, laptops, and desktops.",
  },
  {
    q: "Can I add more features later?",
    a: "Absolutely. Your website is built so it can grow alongside your business. Whether you want to add new pages, booking systems, online payments, or additional automations, those features can be added over time.",
  },
  {
    q: "Do you provide ongoing support?",
    a: "Yes. Whether you need small updates, technical assistance, or new functionality in the future, we're available to help after your website launches.",
  },
] as const;

/* Kept for the standalone /demos/* routes. */
export const PROJECTS = [
  { id: "ember", title: "Ember & Oak", category: "Coffee Roaster", tagline: "Small-batch coffee, roasted with patience.", year: "2025", accent: "#c65f3f", layout: "editorial", demo: "/demos/coffee" },
  { id: "marlowe", title: "Marlowe Dental", category: "Dental Studio", tagline: "Modern dentistry that finally feels calm.", year: "2025", accent: "#14b8a6", layout: "dashboard", demo: "/demos/dental" },
  { id: "pulse", title: "Pulse", category: "Strength Studio", tagline: "Train loud. Move fast. Feel unstoppable.", year: "2025", accent: "#bef264", layout: "analytics", demo: "/demos/fitness" },
] as const;

export type Project = (typeof PROJECTS)[number];
