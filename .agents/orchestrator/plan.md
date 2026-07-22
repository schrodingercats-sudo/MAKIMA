# Makima Luxury Editorial Tribute Website — Execution Plan

## Milestones & Breakdown

### Phase 1: Exploration & Blueprinting
- **Step 1**: Spawn Explorer subagents to analyze existing workspace, wireframe (`wireframe.png`), final design mockup (`final design.png`), design system requirements, and dependencies.
- **Step 2**: Create global `PROJECT.md` specification detailing 12-column grid, color variables, typography rules, component architecture, and asset pipeline.

### Phase 2: Implementation Milestones
- **M1: Foundation & Design System Setup**
  - Initialize Vite + React project structure in `c:\Users\prath\OneDrive\Desktop\Makimafinal` if not present.
  - Setup Vanilla CSS token variables (`:root`), font imports (Editorial serif + clean sans-serif), responsive 12-col grid container, Lenis smooth scrolling, GSAP / Framer Motion utilities.
- **M2: Hero Section (R2)**
  - Full viewport hero, cinematic background reveal, Japanese title "マキマ", massive serif title "MAKIMA", subtitle "PUBLIC SAFETY DEVIL HUNTER", tagline "The woman everyone trusted. The woman everyone feared."
  - Left vertical navigation indicator (01 to 07), scroll prompt, sticky glass/editorial header with logo & section links (STORY, PROFILE, RELATIONSHIPS, TIMELINE, QUOTES, LEGACY).
- **M3: Sticky Storytelling (Identity) Section (R3)**
  - Pinned left vertical navigation menu showing active section tracking.
  - Right scrollable cards updating contextually across 7 identity slides with smooth animations and staggered reveals.
- **M4: Character Profile Section (R4)**
  - Editorial split layout: high-fashion portrait, overview text, metadata table (Name, Affiliation, Species, Status, Height, Age, Birthday, Ability).
- **M5: Interactive Dossier / Book (Relationships) Section (R5)**
  - Interactive 3D page-flip dossier component profiling Denji, Aki Hayakawa, Power, Kishibe, Pochita with relationship types, status, and importance levels.
- **M6: Timeline Section & Editorial Gallery (R6 & R7 Part 2)**
  - Horizontal milestone track with interactive selection showcasing 6 key story arcs (1997 Arrival, Special Division 4, Katana Man Arc, Bomb Girl Arc, Gun Devil Arc, Control Devil Arc Revelation).
  - Responsive masonry gallery grid with image preview modal.
- **M7: Quote, Legacy & Footer Section (R7 Part 1 & R8)**
  - Full-bleed editorial quote ("There are necessary evils." — MAKIMA).
  - Closing tribute statement ("SOMETIMES, THE WARMEST SMILE HIDES THE COLDEST INTENTIONS.").
  - Minimal legacy footer with social links, navigation anchors, copyright notice.
- **M8: E2E Verification, Performance, Responsiveness & Audit**
  - Verify build & dev server runs without errors.
  - Verify mobile/tablet/desktop responsiveness.
  - Execute Forensic Auditor and Challenger pass to ensure 100% genuine code and zero integrity violations.

## Verification & Acceptance Protocol
- Each milestone must be implemented by a Worker, verified by Reviewers/Challengers, and checked by a Forensic Auditor before being marked COMPLETE.
