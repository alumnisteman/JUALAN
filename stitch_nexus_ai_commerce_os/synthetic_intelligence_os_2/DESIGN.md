---
name: Synthetic Intelligence OS
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#1f1f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#303032'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#ffb786'
  on-tertiary: '#502400'
  tertiary-container: '#df7412'
  on-tertiary-container: '#461f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-base:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  code-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
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
  margin-mobile: 16px
  margin-desktop: 32px
  bento-gap: 12px
---

## Brand & Style
The design system is engineered for high-stakes business operations and data-intensive environments. It projects the persona of a **High-Performance Command Center**: precise, authoritative, and frictionless. The target audience consists of operators, data scientists, and executives who require immediate clarity within complex information ecosystems.

The visual style is a fusion of **Minimalism** and **Modern Corporate**, optimized for "deep-space" dark environments. It utilizes a strict structural grid to organize dense information, ensuring that even the most complex "Rule Engine" or "Event Store" feels manageable. The emotional response is one of total control and professional reliability.

## Colors
The palette is dominated by the **Deep-Space Dark** foundation (#131315), providing a low-strain background for prolonged analytical work. **Circuit Blue** serves as the primary action color, signaling interactivity and flow. **Intelligence Purple** is reserved for advanced features, AI-driven insights, and sophisticated logic branches.

Functional tokens for the Rule Engine are high-chroma to ensure critical alerts are never missed against the dark backdrop. Surfaces are layered using slight tonal shifts rather than shadows to maintain a sleek, technical aesthetic.

## Typography
The system utilizes **Geist** for its exceptional clarity and technical "neo-grotesque" feel, which aligns with the developer-centric nature of a Synthetic OS. For data points, event logs, and the Rule Engine, **JetBrains Mono** is introduced to provide a distinct visual "break" for monospaced data strings and technical labels.

Headlines should use tight letter spacing to feel impactful and modern. Body text maintains standard spacing for maximum legibility during long-form data review. All labels are strictly uppercase when using the monospaced font to denote "system status" or "immutable data."

## Layout & Spacing
This design system employs a **Bento Grid** philosophy. Content is organized into discrete, modular containers that fit together with mathematical precision. 

- **Grid:** A 12-column fluid grid for desktop; 4-column for mobile.
- **Bento Modules:** Use a consistent `bento-gap` (12px) between all dashboard tiles. Elements should snap to the grid to maintain the "Command Center" feel.
- **Density:** Information density is high. Use padding sparingly within modules (16px to 20px) to maximize data visibility without crowding the optics.
- **Reflow:** On mobile, bento tiles stack vertically, maintaining their internal aspect ratios where possible to preserve data visualization integrity.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and **Low-Contrast Outlines** rather than traditional shadows. This keeps the UI feeling flat, fast, and integrated into the "OS" environment.

- **Level 0 (Background):** #131315 (Deep-Space)
- **Level 1 (Bento Tiles):** #1c1c1f with a 1px solid border of #27272a.
- **Level 2 (Modals/Popovers):** #27272a with a subtle 'Circuit Blue' outer glow (0px 0px 15px rgba(59, 130, 246, 0.1)).
- **Interactive States:** On hover, tile borders should transition to the Primary or Secondary accent color to signal focus.

## Shapes
The shape language is **Soft (0.25rem)**. This subtle rounding prevents the UI from feeling overly aggressive or "sharp" while maintaining a precise, industrial aesthetic. 

- **Standard Elements:** 4px (0.25rem) border radius for buttons, inputs, and small modules.
- **Bento Tiles:** 8px (0.5rem) border radius to create a distinct container feel.
- **Selection Indicators:** Use vertical 2px "pills" on the left edge of active list items rather than fully rounded shapes.

## Components
- **Buttons:** Primary buttons are solid 'Circuit Blue' with white text. Secondary buttons use the low-contrast outline style.
- **Bento Cards:** The foundational component. Must include a header area for a title and a technical icon.
- **Status Chips:** High-contrast backgrounds using the Success, Warning, and Error tokens. Text is condensed and uses the `code-label` typography.
- **Rule Engine Inputs:** Field inputs use a dark fill (#131315) with a subtle 1px border. Focus state triggers a 'Circuit Blue' border and a subtle inner glow.
- **Event Store Lists:** Zebra-striping using Level 0 and Level 1 surface colors. Iconography should be "Line Art" style with 1.5px stroke weight for maximum precision.
- **Data Visualizations:** Use high-contrast lines. Area charts should use a gradient fade from the accent color to transparent.