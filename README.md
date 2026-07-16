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
  ui/                 Cursor · MagneticButton · AnimatedText · GrainOverlay ·
                      ScrollProgress · Reveal
  layout/             Navbar · FullscreenMenu
  canvas/             HeroCanvas (ssr:false) · ShaderBackground · Particles
  sections/           Loader · Hero  (About/Services/Portfolio/Process/
                      Testimonials/Contact to follow)
  Home.tsx            client coordinator: loader → reveal
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
- **Global** — bespoke cursor (dot + lagging ring with hover/label states),
  animated film grain, scroll-progress line.

## Accessibility & performance

- Every motion path is gated behind `prefers-reduced-motion` (loader skipped,
  Lenis disabled, WebGL frameloop paused, transitions collapsed).
- WebGL is client-only with a CSS-gradient fallback so a GPU failure still looks
  intentional. DPR is clamped and particle counts scale down on mobile.
- Semantic markup, full Open Graph / Twitter metadata, keyboard-dismissable menu.

## Roadmap

Built section by section: **Foundation · Loader · Hero · Navigation** are done.
Next: About → Services → Portfolio → Process → Testimonials → Contact → Footer.
