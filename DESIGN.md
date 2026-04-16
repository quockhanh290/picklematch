# Design System: PickleMatch UI Redesign

## Core Strategy: The Kinetic Gallery
The design system for PickleMatch Vietnam moves away from the rigid, utility-first layouts of traditional sports apps and toward a **"Kinetic Gallery"** aesthetic. This North Star treats every screen as a curated editorial layout where high-energy sport meets high-end sophistication.

Instead of a standard grid of boxes, we utilize intentional asymmetry and tonal layering. Elements should feel like they are floating in a fluid, breathable space. We break the "template" look by overlapping typography over imagery and using aggressive scale contrasts—pairing massive, sporty headlines with hyper-refined, tiny metadata. The goal is to make the user feel like they are flipping through a premium sports magazine, not just scrolling an app.

## Typography
Our type system utilizes a high-contrast pairing of **Plus Jakarta Sans** for display and **Be Vietnam Pro** for utility, ensuring the app feels both global and local.

### Font Families
* **Display & Headlines:** `Plus Jakarta Sans`
* **Body & Labels:** `Be Vietnam Pro`

### Typography Rules
* **Display & Headlines:** These are the "voice" of the app. Use `display-lg` for hero stats or big welcome messages. The bold weight is essential to convey the "energetic" brand personality.
* **Body & Labels:** Optimized for Vietnamese diacritics. Use `body-md` for general content and `label-sm` for technical metadata (like court distance or match times). Use `headline-sm` for Vietnamese text to ensure diacritics are legible and don't feel cramped.
* **Hierarchy Tip:** Create tension by placing a `label-sm` (all caps, tracked out) directly above a `headline-md`. This contrast is a hallmark of high-end editorial design.

## Color Palette

Our palette is rooted in a refreshed, deep emerald that signals both growth and professional prestige.

### Base / Architecture Colors
* **Background:** `#f7f9fb`
* **Surface:** `#f7f9fb`
* **Surface Container Lowest (Interactive Cards):** `#ffffff`
* **Surface Container Low (Secondary Sectioning):** `#f2f4f6`
* **On Surface (Main Text):** `#191c1e` (Don't use pure black)

### Primary Colors
* **Theme Key:** `#00A86B`
* **Primary:** `#006a42`
* **Primary Container:** `#008654`
* **On Primary:** `#ffffff`

### Secondary Colors
* **Theme Key:** `#2B3674`
* **Secondary:** `#4f5a9a`
* **Secondary Container:** `#acb7fe`
* **On Secondary:** `#ffffff`

### Tertiary Colors
* **Theme Key:** `#6366F1`
* **Tertiary:** `#4648d4`
* **Tertiary Container:** `#6063ee`

### Outline & Utility
* **Error:** `#ba1a1a`
* **Outline:** `#6d7a72`
* **Outline Variant:** `#bccac0`

### Color & Depth Rules
1. **The "No-Line" Rule:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts.
2. **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-high` background to create a lift effect without any drop shadow.
3. **Ambient Shadows:** If a card requires a "floating" effect, use a shadow with a blur radius of 40px, 10% opacity, tinted with the `on-surface` color.
4. **The Glass & Gradient Rule:** Use Glassmorphism for floating elements (e.g., bottom navigation bars or sticky headers). Use semi-transparent surface colors with a high `backdrop-blur`. For primary CTAs, use a linear gradient transitioning from `primary` (#006a42) to `primary_container` (#008654) at a 135-degree angle.
