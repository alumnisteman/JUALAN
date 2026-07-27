---
name: ResellerHub OS
colors:
  surface: '#0e141a'
  surface-dim: '#0e141a'
  surface-bright: '#333a40'
  surface-container-lowest: '#080f14'
  surface-container-low: '#161c22'
  surface-container: '#1a2026'
  surface-container-high: '#242b31'
  surface-container-highest: '#2f353c'
  on-surface: '#dde3eb'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#dde3eb'
  inverse-on-surface: '#2b3137'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb783'
  on-tertiary: '#4f2500'
  tertiary-container: '#d97721'
  on-tertiary-container: '#452000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#0e141a'
  on-background: '#dde3eb'
  surface-variant: '#2f353c'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
---

## Brand & Style
The design system is engineered for high-performance enterprise supply chain management. The brand persona is **Intelligent, Autonomous, and Scalable**, prioritizing data density and clarity over decorative elements. 

The visual style is **Industrial Modern**, characterized by a sophisticated dark-mode-first aesthetic. It utilizes a structured "layering" approach: deep navy foundational surfaces are contrasted with high-utility indigo actions. To represent the AI layer, the design system employs **Subtle Glassmorphism**—specifically for floating command palettes, AI insights, and contextual overlays—distinguishing automated intelligence from the core operational database.

## Colors
The palette is optimized for long-duration professional use in dark environments.
- **Primary Indigo (#6366f1):** Reserved for primary actions, active states, and critical AI paths.
- **Success Emerald (#10b981):** Specifically for profit-positive metrics, growth indicators, and "Active" status badges.
- **Deep Tech Navy (#0d0d15):** The foundational canvas.
- **Surface Navy (#161624):** Used for cards and secondary navigation to create depth.
- **Sophisticated Silver (#94a3b8 / #e2e8f0):** Used for secondary text and borders to maintain high legibility without the harshness of pure white.

## Typography
**Plus Jakarta Sans** provides a clean, geometric foundation that feels authoritative yet modern. To handle complex supply chain data, we introduce a secondary monospaced font for numerical strings and SKU IDs to ensure character alignment in tables.

Key rules:
- **Headlines:** Use Bold/Semi-Bold weights with slight negative letter spacing for a compact, "engineered" look.
- **Labels:** Use uppercase and tracking (+0.05em) for small category labels to ensure they are distinct from body text.
- **Data Density:** Use the `body-md` (14px) as the standard size for dashboard content to maximize information visible on a single screen.

## Layout & Spacing
This design system utilizes a **12-column fluid grid** for dashboard content. 
- **Desktop (1440px+):** 24px margins, 16px gutters.
- **Tablet (768px-1439px):** 16px margins, 12px gutters.
- **Mobile (Under 767px):** 12px margins, 8px gutters.

Spacing follows a strict **4px baseline grid**. Information-dense modules (like inventory tables) should use `sm` (12px) padding, while marketing or onboarding pages should scale up to `lg` (24px) for better breathing room.

## Elevation & Depth
Depth is created through **Tonal Layering** rather than heavy shadows.
- **Level 0 (Base):** #0d0d15 (App background).
- **Level 1 (Surface):** #161624 (Cards, sidebars). 1px solid #2a2a3c border.
- **Level 2 (Overlay/AI):** Glassmorphism effect. Background blur (12px), 60% opacity of #1e1e2e, with a 1px "inner glow" white border at 10% opacity.
- **Shadows:** Only used on Level 2 overlays—sharp, 4px blur, #000000 at 40% opacity to denote separation from the operational data.

## Shapes
The shape language is **Professional and Precise**. 
- Use **0.25rem (4px)** for standard components like input fields, checkboxes, and small buttons to maintain a rigorous, industrial feel.
- Use **0.5rem (8px)** for containers and cards.
- **Pills** are only permitted for status badges (e.g., "In Stock") to distinguish them from interactive buttons.

## Components
- **Buttons:** Primary buttons use a solid Indigo background with white text. Secondary buttons use a ghost style (border-only) with silver text. No gradients.
- **Data Tables:** High-density layout. Alternate row striping is not used; instead, use 1px horizontal dividers (#2a2a3c). Headers should be in `label-md` uppercase.
- **Input Fields:** Dark fill (#0d0d15) with a 1px border (#2a2a3c). On focus, the border transitions to Indigo with a subtle outer glow.
- **AI Insight Cards:** Distinguished by the glassmorphism effect and a 2px left-accent border in Indigo.
- **KPI Metrics:** Large `headline-lg` numbers with a smaller `label-md` trend indicator (Emerald for up, Red for down).
- **Navigation:** Vertical sidebar with collapsed state capability. Active states marked by a vertical Indigo bar on the left edge.