# PROJECT.md — Makima Luxury Editorial Tribute Website Blueprint

## Architecture
- **Framework**: Vite + React (JavaScript / JSX)
- **Styling**: Vanilla CSS with strict CSS Custom Properties (`:root` tokens)
- **Motion & Interactions**: Framer Motion (for staggered reveals, card transitions, modal overlays, 3D dossier flipbook), Lenis (smooth scroll)
- **Icons**: Lucide-react (minimal luxury iconography)
- **Grid Layout**: 12-column container (1440px max width, 8pt spacing)

## Design System Tokens
- `--bg-primary`: `#F8F6F2` (Warm Off-White)
- `--bg-secondary`: `#F3EEE8` (Soft Cream / Warm Gray)
- `--bg-surface`: `#FFFFFF` (Pure Surface White)
- `--accent-red`: `#A63D3D` (Crimson / Rust Accent)
- `--accent-hair`: `#D7B26A` (Amber Gold Accent)
- `--text-primary`: `#111111` (Deep Editorial Charcoal)
- `--text-muted`: `#7C7C7C` (Muted Gray)
- `--font-serif`: 'Playfair Display', 'Cormorant Garamond', Georgia, serif
- `--font-sans`: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif
- `--font-jp`: 'Noto Serif JP', 'Mincho', serif

## Code Layout
```
c:\Users\prath\OneDrive\Desktop\Makimafinal\
├── public/
│   ├── favicon.svg
│   └── images/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Hero.jsx
│   │   ├── StickyStory.jsx
│   │   ├── CharacterProfile.jsx
│   │   ├── RelationshipsDossier.jsx
│   │   ├── Timeline.jsx
│   │   ├── Quote.jsx
│   │   ├── Gallery.jsx
│   │   ├── ImageModal.jsx
│   │   ├── LegacyFooter.jsx
│   │   └── LeftNav.jsx
│   ├── styles/
│   │   ├── variables.css
│   │   ├── global.css
│   │   ├── typography.css
│   │   ├── layout.css
│   │   └── components/
│   ├── utils/
│   │   ├── imageFallback.js
│   │   └── scroll.js
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Milestones & Status

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Foundation & Design System | Vite+React setup, dependencies, CSS tokens, global typography, Lenis & fallback utils | none | DONE |
| M2 | Hero Section (R2) | Full-height hero, Japanese typography, section indicator, sticky header | M1 | DONE |
| M3 | Sticky Storytelling (R3) | Pinned left nav, 7 identity slides, staggered animations, interactive indicators | M1, M2 | DONE |
| M4 | Character Profile (R4) | Editorial split layout, metadata table, portrait presentation | M1 | DONE |
| M5 | 3D Relationships Dossier (R5) | Interactive 3D page-flip book (Denji, Aki, Power, Kishibe, Pochita) | M1 | DONE |
| M6 | Timeline & Editorial Gallery (R6 & R7) | 6-arc horizontal timeline track, asymmetric masonry grid, image lightbox modal | M1 | DONE |
| M7 | Quote, Legacy & Footer (R7 & R8) | Full-bleed quote banner, closing tribute statement, minimal footer | M1 | DONE |
| M8 | E2E Integration & Audit | E2E verification, mobile responsiveness, forensic audit pass | M1–M7 | DONE |

## Interface Contracts
- **`App.jsx`**: Top-level container managing section active state (`activeSection`), active modal image (`selectedGalleryImage`), and Lenis smooth scroll instance.
- **`LeftNav.jsx`**: Tracks scroll position and highlights active section `01` through `07`.
- **`RelationshipsDossier.jsx`**: Manages page index `0` to `4` with CSS 3D transforms (`transform-style: preserve-3d`, `rotateY`) or Framer Motion 3D page flipping.
- **`Timeline.jsx`**: Manages selected arc `0` to `5`, highlighting progress bar and active thumbnail.
- **`Gallery.jsx` & `ImageModal.jsx`**: Emits `onSelectImage(img)` to open modal overlay with keyboard `ESC` listener.
