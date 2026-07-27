---
name: Synthetic Intelligence
colors:
  surface: '#13131b'
  surface-dim: '#13131b'
  surface-bright: '#393841'
  surface-container-lowest: '#0d0d15'
  surface-container-low: '#1b1b23'
  surface-container: '#1f1f27'
  surface-container-high: '#292932'
  surface-container-highest: '#34343d'
  on-surface: '#e4e1ed'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e4e1ed'
  inverse-on-surface: '#303038'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#4fdbc8'
  on-secondary: '#003731'
  secondary-container: '#04b4a2'
  on-secondary-container: '#003f38'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#71f8e4'
  secondary-fixed-dim: '#4fdbc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#13131b'
  on-background: '#e4e1ed'
  surface-variant: '#34343d'
  surface-background: '#0F172A'
  surface-card: rgba(30, 41, 59, 0.7)
  on-surface-muted: '#c7c4d7'
  ai-glow-teal: rgba(20, 184, 166, 0.3)
  outline-dim: rgba(51, 65, 85, 0.5)
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.25'
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  margin-mobile: 16px
  margin-desktop: 48px
  gutter: 24px
---

## Brand & Style
The brand personality is high-tech, proactive, and sophisticated, targeting modern entrepreneurs who leverage automation. The visual identity sits at the intersection of **Corporate Modern** and **Glassmorphism**, evoking a sense of "reliable intelligence."

The aesthetic uses a deep indigo-slate foundation to create a focused, low-strain environment. Visual interest is driven by "AI Glow" effects—subtle teal and lavender outer glows that suggest active processing. The interface feels premium and technical without being unapproachable, using translucent layers to create a sense of deep information architecture.

## Colors
The palette is rooted in a deep "Midnight Navy" background (`#0F172A`). 
- **Primary (Indigo):** Used for brand identity and high-emphasis actions.
- **Secondary (Teal):** Used for "Active" states, positive growth metrics, and AI-driven elements.
- **Tertiary (Amber):** Used for cautionary trends or secondary alerts.
- **Neutral:** A range of slates and purplish-greys (`#e4e1ed`) ensure legibility against dark backgrounds.

Color application relies heavily on opacity: background blurs and tinted overlays (e.g., 10% secondary for icons) are used to indicate relationship and hierarchy without introducing too many distinct hues.

## Typography
The system uses a dual-font approach. **Plus Jakarta Sans** provides a modern, slightly geometric feel for headlines, reinforcing the "forward-thinking" brand. **Inter** is used for all functional and body text to maximize readability across dense data sets.

Type is strictly hierarchical:
- **Headlines:** Use Bold or Semi-Bold weights with tighter tracking.
- **Labels:** Use Medium to Semi-Bold weights, often paired with uppercase styling for metadata or category headers to create visual structure.
- **Body:** Stays at Regular weight for maximum legibility against the dark UI.

## Layout & Spacing
The layout follows a **Fluid Grid** system within a `1280px` (max-width) container. 
- **Desktop:** A 12-column grid with `24px` gutters. Margins are generous (`48px`) to allow the UI to breathe.
- **Mobile:** Single column with `16px` horizontal margins.
- **Bento Logic:** Complex dashboards use a grid-based "Bento" layout where cards span varied column counts (e.g., 3-column split for stats, 2-column split for deep insights).
- **Navigation:** Top app bar is fixed on desktop; a bottom navigation bar is used exclusively for mobile viewports to keep actions within thumb-reach.

## Elevation & Depth
Depth is created through **Glassmorphism** and **Tonal Layering** rather than traditional heavy shadows.
- **Level 1 (Base):** Deep Slate (`#0F172A`).
- **Level 2 (Cards):** Translucent backgrounds (`rgba(30, 41, 59, 0.7)`) with a `12px` backdrop blur and a `1px` low-opacity white top border to simulate light hitting an edge.
- **Level 3 (Pop-overs/FABs):** Solid surfaces with `shadow-lg` to separate them from the glass layers below.
- **AI Accentuation:** High-priority AI recommendations feature a specific `ai-glow` style—a soft teal outer shadow that radiates from the border, making the element appear "energized."

## Shapes
The shape language is consistently **Rounded**. 
- **Standard Cards/Containers:** `1rem` (rounded-2xl) for a modern, friendly feel.
- **Interactive Elements:** Buttons and Input fields use `0.75rem` (rounded-xl).
- **Status Pills/Chips:** Always `9999px` (pill-shaped) to distinguish them from actionable buttons.
- **Search Bars:** Utilize the `rounded-xl` style for a contemporary, soft aesthetic.

## Components
- **Buttons:** Primary buttons are high-contrast (Indigo background, White text). Secondary buttons use a subtle ghost style or a tinted background (10% opacity) of the brand color.
- **Glass Cards:** The primary container. Must include `backdrop-filter: blur(12px)` and a subtle `outline-variant` border.
- **Inputs:** Dark backgrounds (`surface-container-lowest`) with active focus states that utilize a `2px` primary ring with 50% opacity.
- **Status Indicators:** "Active" states use the secondary teal; "Pending" or "Muted" states use surface-container-highest. Always include a small icon paired with text.
- **AI Recommendations:** Featured cards utilize a unique image header with a "Match %" badge in the top-left corner and a distinct teal border glow.
- **Bottom Navigation (Mobile):** High-profile active states (pill-shaped background for the active icon) and subtle icons for inactive states.