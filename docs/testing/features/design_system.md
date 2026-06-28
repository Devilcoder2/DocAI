# Feature Test Specifications - UI/UX Design System & Theme Toggle

This document lists test scenarios, validation steps, and progress logs for UI/UX themes, typography, and charts.

---

## Scenarios to Test

### 1. Outfit & Inter Typography Layout
* **What to Test**: Font styling rendering inside browser inspect elements.
* **How to Verify**:
  * Headings (`h1`, `h2`, `h3`, etc.) use the Outfit font stack: `font-family: var(--font-display)`.
  * Body copy and input boxes use the Inter font stack: `font-family: var(--font-sans)`.

### 2. Universal Light/Dark Theme Toggling
* **What to Test**: Clicking the Theme Toggle button across all layouts.
* **How to Verify**:
  * Root `html` class changes instantly between `light` and `dark` (no page refreshes).
  * CSS design variables (`--background`, `--foreground`, `--card-bg`, etc.) transition smoothly.
  * Inputs and text labels remain fully legible in both modes.

### 3. Consultation Analytics Dashboard Stats Charts
* **What to Test**: Visual layout rendering of today's overview stats cards and hourly consult bar charts.
* **How to Verify**:
  * Stats display valid volume figures.
  * Hourly bar heights scale correctly with CSS custom properties matching data.
  * Hovering bar elements displays exact consult value tooltips.

---

## Testing Progress Tracker

| Scenario | Mode | Status | Bugs Found | Notes |
|---|---|---|---|---|
| Outfit / Inter fonts | Visual | `[ ] Pending` | None | Inspect layout font-family |
| Light/Dark toggling | Visual | `[ ] Pending` | None | Verify welcome & scribe pages |
| Legibility checks | Visual | `[ ] Pending` | None | Check input text contrast |
| Bar chart render | Visual | `[ ] Pending` | None | Verify CSS height ranges |
| Chart hover tooltip | Visual | `[ ] Pending` | None | Check details visible on hover |
