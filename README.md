# Southpage

An interactive digital experience for **Southpage** — a premium web design studio.
The site is the portfolio: every section is engineered to prove the studio's craft.

> Dark, cinematic, minimal. Pure black ground, soft-white type, electric-blue
> accent with royal-purple living inside the gradients and light.

## Tech

| | |
|---|---|
| Framework | Next.js 15 (App Router) · React 19 · TypeScript |
| Styling | Tailwind CSS v4 (design tokens in `app/globals.css`) |
| Motion | GSAP + ScrollTrigger · Framer Motion · Lenis smooth scroll |
| 3D / WebGL | Three.js · React Three Fiber (hero shader mesh + particles) |
| Fonts | Syne (display) · Instrument Serif (accent) · Inter (body) |

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve the production build
npm run typecheck  # tsc --noEmit
```

## Architecture

```
app/                  layout (fonts · metadata · providers) · page · globals.css
components/
  providers/          SmoothScrollProvider — Lenis ↔ GSAP ScrollTrigger
  ui/                 Cursor · MagneticButton · AnimatedText · GradientReveal ·
                      ScrollRevealText · Counter · ProjectMockup · FloatingField ·
                      GrainOverlay · ScrollProgress · Reveal
  layout/             Navbar · FullscreenMenu · Footer
  canvas/             HeroCanvas (ssr:false) · ShaderBackground · Particles
  sections/           Loader · Hero · Work · Studio · Services · Process ·
                      Testimonials · Contact
  Home.tsx            client coordinator: loader → reveal → sections
hooks/                useMediaQuery · usePrefersReducedMotion · useMousePosition …
lib/                  gsap · motion (typed eases) · utils (cn) · data (content)
```

## Experience notes

- **Loader** — wordmark reveal, live 0→100 counter, clip-path curtain hand-off.
- **Hero** — GPU shader gradient-mesh with a light that pools around the pointer,
  floating particle field, char-by-char masked headline that un-blurs, serif
  gradient accent line, magnetic CTAs, scroll parallax.
- **Navigation** — scroll-aware glass navbar, animated logo, full-screen menu
  with per-link staggered mask reveals.
- **Work** — editorial project list with a cursor-tracked floating mockup
  preview, per-project accent glow, category filtering; inline mockups on touch.
- **Studio** — word-by-word scroll-brightened manifesto, count-up stats, and a
  vertical timeline whose accent→violet line draws on scroll.
- **Services** — hover-expanding panels with a cursor-tracked light pool, a
  growing accent rail and animated plus/minus.
- **Process** — GSAP-pinned horizontal-scroll sequence (Discover → Design →
  Build → Evolve); stacks into a column below `md`.
- **Testimonials** — interactive 3D glass deck with pointer-tilt depth, ghost
  cards, direction-aware rotate transitions, drag-to-swipe and autoplay.
- **Contact** — floating-label fields, client-side validation, and a satisfying
  idle → sending → sent submit with a drawn check.
- **Global** — bespoke cursor (dot + lagging ring with hover/label states),
  animated film grain, scroll-progress line, oversized footer wordmark.

## Accessibility & performance

- Every motion path is gated behind `prefers-reduced-motion` (loader skipped,
  Lenis disabled, WebGL frameloop paused, transitions collapsed).
- WebGL is client-only with a CSS-gradient fallback so a GPU failure still looks
  intentional. DPR is clamped and particle counts scale down on mobile.
- Semantic markup, full Open Graph / Twitter metadata, keyboard-dismissable menu.

## Status

All sections are built: **Loader · Hero · Work · Studio · Services · Process ·
Testimonials · Contact · Footer**. Each was shipped and verified section by
section (typecheck, production build, and in-browser checks on desktop + mobile).
