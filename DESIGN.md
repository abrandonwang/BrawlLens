---
name: dpm.lol Design System
colors:
  surface: '#11131a'
  surface-dim: '#11131a'
  surface-bright: '#373941'
  surface-container-lowest: '#0c0e15'
  surface-container-low: '#191b22'
  surface-container: '#1d1f26'
  surface-container-high: '#282a31'
  surface-container-highest: '#33343c'
  on-surface: '#e2e2ec'
  on-surface-variant: '#c3c6d6'
  inverse-surface: '#e2e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#8d909f'
  outline-variant: '#434653'
  surface-tint: '#b2c5ff'
  primary: '#b2c5ff'
  on-primary: '#002b73'
  primary-container: '#5d8cff'
  on-primary-container: '#002566'
  inverse-primary: '#1c57c8'
  secondary: '#c4c6d1'
  on-secondary: '#2d3039'
  secondary-container: '#444650'
  on-secondary-container: '#b3b5c0'
  tertiary: '#ffb871'
  on-tertiary: '#4a2800'
  tertiary-container: '#d37c00'
  on-tertiary-container: '#412300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#e0e2ed'
  secondary-fixed-dim: '#c4c6d1'
  on-secondary-fixed: '#181b24'
  on-secondary-fixed-variant: '#444650'
  tertiary-fixed: '#ffdcbe'
  tertiary-fixed-dim: '#ffb871'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#6a3c00'
  background: '#11131a'
  on-background: '#e2e2ec'
  surface-variant: '#33343c'
  bg-primary: '#0B0D12'
  bg-secondary: '#161921'
  bg-tertiary: '#1F232E'
  border-subtle: '#2A2F3D'
  status-success: '#4ADE80'
  status-danger: '#F87171'
  status-warning: '#FACC15'
  tier-s-plus: '#A855F7'
  tier-s: '#3B82F6'
  resource-mana: '#06B6D4'
typography:
  hero-title:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  section-heading:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  sub-heading:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  body-text:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  stat-value:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-max-width: 1280px
---

# BrawlLens compact player page direction

- Use the dpm.lol palette and Inter typography as the token base, but do not copy the page literally.
- Player profile pages should be narrow, centered, and data-dense. Target a compact desktop content rail around 1060px instead of stretching cards across the viewport.
- Use very small UI type for panels, rows, filters, and metadata. Reserve larger text only for player identity and headline stats.
- Keep cards flat, dark, and compact with subtle borders, small radii, and tight internal spacing.
- Secondary player navigation is text-only. Do not add icons beside Overview, BrawlLens, Brawlers, Battles, or Club.
- Major card headers are sentence case, not all caps, unless the label is an acronym. Do not place decorative icons beside major headers, except the Ladder card's small badge marker.
- The Ladder card uses a custom minimal tier mark, full trophy count, recent winrate, and a compact `LADDER RANK` pill.
- Avoid blocky game fonts on the player page. Use Inter/system UI for readable analytics surfaces.

# Design Specification: dpm.lol

## 1. Visual Identity & Brand Personality
**Aesthetic:** Modern, high-performance, gaming-focused "Dark Mode" interface.
**Personality:** Analytical, data-driven, sleek, and immersive. It uses deep blacks and navy tones contrasted with vibrant accent colors to highlight key gaming statistics.

---

## 2. Color Palette

### Core Neutrals
- **Primary Background:** `#0B0D12` (Deep Obsidian/Black)
- **Secondary Background/Cards:** `#161921` (Dark Navy Grey)
- **Tertiary Background/Hover States:** `#1F232E`
- **Borders/Dividers:** `#2A2F3D` (Subtle dark stroke)

### Functional Accents
- **Primary Accent (Brand Blue):** `#5D8CFF` (Used for active states, primary buttons, and logos)
- **Positive/Success:** `#4ADE80` (Mint Green - for win rates, upward trends)
- **Negative/Danger:** `#F87171` (Soft Red - for losses, downward trends)
- **Warning/Neutral:** `#FACC15` (Gold - for high-tier rankings/MVP)

### Data Visualization Accents
- **Purple (Tier S+):** `#A855F7`
- **Blue (Tier S):** `#3B82F6`
- **Cyan (Mana/Energy):** `#06B6D4`

---

## 3. Typography

**Primary Font Family:** Inter, system-ui, sans-serif.
- **Headings:** Bold weights (`font-weight: 700+`), high contrast against background.
- **Body:** Regular to Medium weights (`400-500`) for readability.
- **Monospaced (Numbers):** Used for specific statistics and LP values to ensure alignment in tables.

### Type Scale (Desktop)
- **Hero Title:** 48px / 56px (Bold)
- **Section Heading:** 24px / 32px (Semi-bold)
- **Sub-heading:** 18px / 24px (Medium)
- **Body Text:** 14px / 20px (Regular)
- **Small Detail/Caption:** 12px / 16px (Regular)

---

## 4. Components & UI Patterns

### Navigation
- **Top Bar:** Fixed, dark background with a subtle bottom border. Contains the logo (DPM.LOL), global search, and account controls.
- **Sub-nav:** Horizontal pill-style navigation for specific game modes (SoloQ, Flex, Arena).

### Cards & Containers
- **Dashboard Cards:** Rounded corners (`12px-16px`), dark background, subtle inner glow or border.
- **Rank Cards:** Large typography for LP, background gradients reflecting the tier (e.g., Challenger glow).

### Tables
- **Data Rows:** Alternating backgrounds or hover highlights.
- **Cell Alignment:** Champions/Players left-aligned; stats (Winrate, KDA, Pickrate) center or right-aligned for easy scanning.
- **Tier Badges:** High-contrast background colors with bold text.

### Interactive Elements
- **Buttons:** Primary buttons are solid brand blue; secondary buttons are outlined or ghost-style.
- **Switches:** Toggle switches for "Off-Meta" or "Pro" filters.
- **Input Fields:** Dark background, internal search icons, and subtle focus rings.

---

## 5. Layout & Spacing
- **Grid:** Responsive container-based layout.
- **Spacing System:** Base-8 spacing (8px, 16px, 24px, 32px, 48px).
- **Hierarchy:** Uses vertical depth (z-index and subtle shadows) to separate data layers from the main background.

---

## 6. Imagery & Iconography
- **Champions/Avatars:** High-quality character splashes with rounded corners.
- **Iconography:** Custom vector icons for game roles (Top, Jungle, Mid, Bot, Support) using consistent stroke weights.
- **Visual Effects:** Soft glows and mesh gradients in the background to provide depth without distracting from data.
