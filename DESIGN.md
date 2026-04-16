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

## AI Design Prompt (Full App, Includes Home)

Use this prompt directly with a UI design AI:

---

Design a complete, production-ready mobile UI for PickleMatch VN (pickleball session matching app).

Goal:
- Keep the visual language modern, premium, and clean.
- Preserve fast scanning and operational clarity for sports flows.
- Ensure Home screen is fully designed (not omitted).

Platform + Technical Context:
- Mobile first (iOS + Android), portrait.
- Existing app stack: React Native + Expo Router.
- Icon pack: lucide-react-native.
- Typography style should remain highly legible for Vietnamese.

Color System (strict):
- background: #f7f9fb
- surface: #f7f9fb
- surface-container-lowest: #ffffff
- surface-container-low: #f2f4f6
- surface-container: #eceef0
- surface-container-high: #e6e8ea
- surface-container-highest: #e0e3e5
- on-surface: #191c1e
- on-surface-variant: #3d4a42
- primary: #006948
- primary-container: #00855d
- on-primary: #ffffff
- secondary: #476800
- secondary-container: #bcf063
- tertiary: #9b3e3b
- tertiary-container: #ba5551
- outline: #6d7a72
- outline-variant: #bccac0
- error: #ba1a1a

Shape System:
- borderRadius default: 1rem
- borderRadius lg: 2rem
- borderRadius xl: 3rem
- borderRadius full: 9999px

Typography:
- Primary family: Plus Jakarta Sans for headlines + key CTAs.
- Secondary family: Be Vietnam Pro (or equivalent highly legible sans) for body/labels.
- Strong hierarchy with clear contrast between headline, body, and metadata.

Design all screens below with consistent color and component behavior:

1) Onboarding
- Welcome/intro, profile basics, self-assessment skill setup.
- Strong hero + step clarity + confidence-building copy.
- Primary actions use brand green (primary / primary-container).

2) Home (required)
- Landing after login.
- Includes compact greeting header, quick action row, filter pills, premium session cards.
- Supports urgent actions (e.g., create session quickly, discover nearby sessions).
- Session cards should emphasize: time, court, level range, fee, slot status, booking signal.

3) Find Session
- Advanced browsing and filtering.
- Reuse Home card language, with stronger comparability for list scanning.

4) My Sessions
- Combined view of hosted + joined sessions.
- Strong status indicators per lifecycle phase.
- Clear host vs participant role cues.

5) Session Detail
- Deep operational screen with all critical data and role-based actions.
- Player actions and host actions must be visually distinct and unmistakable.

6) Create Session
- Multi-step or sectional creation flow.
- Fast defaults, progressive disclosure, and clear completion state.

7) Notifications
- High-scannability grouped feed with state/action cues.

8) Profile + Edit Profile
- Player identity, level hero, ELO/skill context, favorite courts, personalization settings.

Interaction Rules:
- Keep sticky headers readable over scroll.
- Maintain enough bottom spacing for fixed CTA bars and keyboard-safe input focus.
- Avoid random one-off colors; use only the token system above.

Output Format:
- Provide high-fidelity mobile mockups for all screens.
- Include component inventory and reusable variants.
- Include a short token usage map (which token is used for which UI role).
- Include interaction notes for loading, empty, error, and success states.

---
