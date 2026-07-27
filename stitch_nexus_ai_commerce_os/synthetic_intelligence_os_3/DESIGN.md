---
name: Synthetic Intelligence OS
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#d1bcff'
  on-secondary: '#3c0090'
  secondary-container: '#7000ff'
  on-secondary-container: '#ddcdff'
  tertiary: '#ddffd3'
  on-tertiary: '#003907'
  tertiary-container: '#00fb40'
  on-tertiary-container: '#006e16'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d1bcff'
  on-secondary-fixed: '#23005b'
  on-secondary-fixed-variant: '#5700c9'
  tertiary-fixed: '#72ff70'
  tertiary-fixed-dim: '#00e639'
  on-tertiary-fixed: '#002203'
  on-tertiary-fixed-variant: '#00530e'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
  intelligence-score: '#FACC15'
  risk-danger: '#FF4B4B'
  market-growth: '#00FF41'
  api-connected: '#22C55E'
  api-disconnected: '#94A3B8'
  data-node: '#38BDF8'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-desktop: 32px
  margin-mobile: 16px
  density-compact: 8px
  density-comfortable: 16px
---

## Brand & Style

This design system is engineered as a high-performance operating system for commerce intelligence. The brand personality is **Intelligent, Authoritative, and Technical**, functioning as a "digital brain" that synthesizes vast amounts of market data into actionable executive insights. 

The visual style is **Corporate / Modern** with a heavy influence from **Minimalism** to manage high information density. It utilizes a dark-mode default to reduce eye strain during prolonged data analysis and to emphasize vibrant "Intelligence" accents. The aesthetic is "SaaS-Industrial"—precise, stable, and foundational, ensuring that the interface never distracts from the critical KPIs it presents. Every element is designed for maximum clarity, facilitating a seamless flow from data detection to fulfillment.

## Colors

The color strategy employs a deep, dark neutral base to establish the "OS" environment, allowing functional colors to pop with high contrast. 

- **Primary (Electric Cyan):** Used for primary actions, active states, and AI-driven insights. It represents the "synapses" of the system.
- **Secondary (Deep Purple):** Used for advanced automation features and the AI Content Factory, distinguishing machine-generated processes from human inputs.
- **Tertiary (Neon Green):** Reserved for growth indicators, market success, and positive connectivity status.
- **Intelligence Scoring:** A specialized yellow-to-orange gradient scale is used for Seller and Product scores to indicate "heat" and potential.
- **Connectivity Status:** API and Web states use a binary color logic (Green for active, Muted Slate for disconnected) to provide immediate peripheral awareness of system health.

## Typography

The typography system is built for a data-heavy environment where legibility and hierarchy are paramount.

- **Hanken Grotesk** provides a sharp, contemporary feel for headlines and display areas, conveying professional modernity.
- **Inter** is the workhorse for body copy and interface elements, chosen for its exceptional readability in dense layouts.
- **JetBrains Mono** is utilized for all "Data Intelligence" and "Market Mapping" metrics. This monospaced choice ensures that numerical values (prices, margin calculations, scores) align perfectly in tables and dashboards, allowing for quick vertical scanning.

For mobile, headlines scale down to ensure dashboard widgets remain functional, while monospaced data maintains its size to preserve legibility.

## Layout & Spacing

The design system uses a **Fluid Grid** model based on a 4px baseline shift. Given the OS-nature of the product, the layout is widget-centric, allowing for modular blocks of data to reflow based on screen real estate.

- **Desktop (1440px+):** 12-column grid with 16px gutters. High-density widgets occupy 3-4 columns each.
- **Tablet (768px - 1024px):** 8-column grid. Sidebars collapse into icons to prioritize data visualization.
- **Mobile (<768px):** 4-column grid. Complex data tables transform into card-based intelligence summaries.

Spacing follows a strict "Compact" rhythm for the Data Intelligence hubs to maximize the information visible above the fold without requiring excessive scrolling.

## Elevation & Depth

Hierarchy is established using **Tonal Layers** rather than heavy shadows, maintaining a sleek, technical look.

1.  **Level 0 (Base):** The darkest surface (#0F172A). Used for the application background.
2.  **Level 1 (Surface):** A slightly lighter shade for dashboard widgets and sidebar containers. Use a subtle 1px border (#1E293B) to define edges.
3.  **Level 2 (Active/Hover):** Elements that are elevated for interaction. These use low-opacity ambient shadows (0 4px 20px rgba(0,0,0,0.5)) and a primary-colored "glow" or inner border.
4.  **AI Layer:** Any AI-assisted content or "Brain" outputs utilize a subtle back-drop blur (8px) and a purple-tinted border to signify its origin.

## Shapes

The shape language is **Soft** (roundedness: 1). 

- **Standard Components:** 4px (0.25rem) corner radius for buttons and input fields to maintain a precise, technical feel.
- **Data Widgets/Cards:** 8px (0.5rem) corner radius to differentiate larger containers from functional inputs.
- **Connectivity Indicators:** Status dots and "Intelligence Scores" use full pill-shaping (circular) to stand out against the predominantly rectangular grid.
- **Borders:** All containers use a consistent 1px stroke. Avoid heavy borders; the depth should be felt through color shifts rather than physical weight.

## Components

- **Intelligence Scoring (Seller/Product):** Represented by a radial progress ring or a stylized "Score Card." Scores 0-40 are muted, 41-70 are Primary Cyan, and 71-100 are Tertiary Green with a subtle outer glow.
- **Connectivity Status Indicators:** Small badges containing an icon (API/Web) and a status dot. The label uses `label-caps`. Pulsing animations are used only when "Real-time Scanning" is active.
- **Data Tables:** High-density rows using `data-mono` for all numerical values. Alternate row striping is used for readability. Hovering on a row should highlight it with a Primary Cyan left-edge accent.
- **Buttons:** 
    - *Primary:* Solid Cyan with black text for maximum visibility.
    - *Secondary:* Ghost style with a purple border for AI-related actions.
- **Input Fields:** Dark background with 1px slate borders. Focus states transition the border to Primary Cyan with a 2px inner glow.
- **Market Mapping Nodes:** Circular elements connected by 1px "neural" lines. Each node features a small Sparkline showing 24h trend data.