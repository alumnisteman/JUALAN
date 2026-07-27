---
name: Synthetic Intelligence OS
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#00a572'
  on-tertiary-container: '#00311f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
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
    letterSpacing: -0.01em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is engineered to feel like a high-performance operating system for the next generation of commerce. It prioritizes a sense of "Computational Authority"—the feeling that the platform is not just a tool, but an autonomous, highly precise intelligence layer.

The visual style merges **Glassmorphism** with **Minimalism**, utilizing deep obsidian surfaces, translucent materials, and precision-engineered light leaks. The aesthetic avoids unnecessary decoration, favoring functional density and structural clarity. Every element should feel like a piece of high-tech hardware, where depth is communicated through light refraction and "glowing" edge-lighting rather than traditional shadows.

**Key Principles:**
- **Precision:** Perfect alignment and microscopic detail in borders and icons.
- **Luminescence:** Use of color as a signal of activity and life within the "void."
- **Efficiency:** Information-dense layouts that respect the professional user’s time.

## Colors

The palette is built upon "Void Black," providing a true-black foundation that maximizes the contrast of the high-tech accents. 

- **Primary (Circuit Blue):** Used for primary actions, active states, and "flow" indicators. It represents the connective tissue of the platform.
- **Secondary (Intelligence Purple):** Reserved for AI-driven insights, generative features, and "thinking" states.
- **Tertiary (Success Emerald):** Dedicated to transactional success, positive growth metrics, and "online" status.
- **The Glow:** Accent colors should be used with `0.15` opacity fills and `0.5` opacity 1px borders to create a "glass-on-light" effect. 
- **The Void:** Backgrounds use #09090B. Elevated surfaces use #18181B with a subtle 1px border of #27272A to define shape in the dark.

## Typography

This design system utilizes a tiered typographic approach to distinguish between narrative content and technical data.

1.  **Geist (Headlines):** Used for structural headers. Its geometric precision reflects the "Operating System" aesthetic.
2.  **Inter (Body):** Used for all primary reading tasks and UI controls to ensure maximum legibility at high densities.
3.  **JetBrains Mono (Data & Labels):** Crucial for the OS aesthetic. Used for metrics, status labels, timestamps, and AI "logs."

**Scaling:** On mobile, reduce display sizes by one tier (e.g., Display LG becomes Headline LG) to maintain density without sacrificing readability.

## Layout & Spacing

The layout is governed by a **Bento-style grid**, where content is organized into logical, self-contained modules of varying sizes.

- **Grid System:** A 12-column grid on desktop, 6-column on tablet, and 2-column on mobile.
- **Bento Modules:** Components should "snap" to the grid. Use consistent internal padding (16px or 24px) within modules to maintain a rigorous rhythm.
- **Density:** Mobile layouts use "Compact Hub" navigation—a bottom-anchored navigation bar or a floating "Command Center" button to maximize screen real estate for data.
- **Hierarchy:** Primary AI activity should occupy the top-left or center-large module of the Bento grid.

## Elevation & Depth

This system eschews traditional soft shadows for **Tonal Layering** and **Backdrop Refraction**.

- **Level 0 (Floor):** #09090B. The base canvas.
- **Level 1 (Card/Bento):** #18181B. 1px solid border (#27272A).
- **Level 2 (Glass Overlays):** Background blur (20px) with #FFFFFF at 0.05 opacity. These represent modals or floating command menus.
- **Active State Glow:** When a module is "Active" or "Processing," it gains a subtle outer glow (4px blur) using the Primary or Secondary color at 30% opacity.
- **Internal Depth:** Use inner-glows (1px) on the top and left edges of buttons to simulate a "carved" or "extruded" technical interface.

## Shapes

The shape language is **Soft-Industrial**. We avoid perfectly sharp corners to maintain a premium "hardware" feel, but avoid overly round "pill" shapes which feel too consumer-facing.

- **Standard Radius:** 0.25rem (4px) for small components like checkboxes and small buttons.
- **Module Radius:** 0.75rem (12px) for Bento cards and large containers.
- **Interactive Elements:** Buttons utilize the 0.5rem (8px) radius to feel distinct from the containers they inhabit.

## Components

- **AI Brain Status Indicators:** A custom component featuring a pulsating 8px dot with a concentric "sonar" ring. Blue = Idle, Purple = Thinking, Emerald = Task Complete.
- **Bento Cards:** Dark containers (#18181B) with 1px borders. Headlines should be in `label-caps` (JetBrains Mono) to feel like a system read-out.
- **Buttons:**
    - *Primary:* Solid Circuit Blue with white text. No shadow.
    - *Ghost:* 1px border of #27272A with a blur background. On hover, the border takes the Primary color.
- **Input Fields:** Subdued #0F0F12 backgrounds with `data-mono` font. The cursor should be a block-style "terminal" caret in Circuit Blue.
- **Status Chips:** Small, high-contrast pills using the `label-caps` typography. Backgrounds are 10% opacity of the status color with a 50% opacity 1px border.
- **Command Hub:** A floating bottom-center navigation element that uses a heavy backdrop blur (Glassmorphism) and contains icon-only triggers for the most frequent OS actions.