# Tempi

Tempi is a typography-first countdown timer for the web. The interface keeps the focus on oversized digits, fluid layout, and touch-friendly gestures so you can start a session in a heartbeat—whether you are at a desk, on a tablet stand, or mirroring to a studio display.

## What Makes Tempi Different

- **Gesture-first controls** – Double-tap the timer surface or tap the space bar to start and pause, long press anywhere to reset, and drag the minute digits up or down to fine-tune the session length without touching a menu.
- **Keyboard comfort** – Space toggles play/pause and `R` resets instantly, so power users never need to leave the keyboard.
- **Orientation aware** – The layout listens for device orientation and reshapes the UI (side-by-side in landscape, stacked in portrait) while keeping the seconds aligned with the baseline of the minutes.
- **Accessible motion** – Finish states trigger a bold flash, but motion automatically calms down when `prefers-reduced-motion` is enabled.
- **Test-driven core** – Unit and DOM-driven tests cover the timer store, orientation handling, gestures, keyboard shortcuts, and completion behavior to keep the MVP stable as features grow.

## Quick Start

### Prerequisites

- Node.js 20+ or Bun 1.1+

### Install Dependencies

```bash
bun install          # recommended
# or
npm install
```

### Run the Dev Server

```bash
bun run dev
# npm run dev       # alternative
```

The Vite dev server boots on `http://localhost:5173` by default.

### Production Build & Preview

```bash
bun run build
bun run preview
```

## Testing

Vitest powers the unit and component tests, and Playwright drives browser-level checks.

```bash
# Run the DOM and store unit suite (includes orientation & gesture tests)
bun run test:unit

# End-to-end smoke in headless Chromium
bun run test:e2e

# CI-style combined execution (unit + e2e)
bun run test
```

The timer page tests assert rendered DOM and user-observable behavior—orientation changes, pointer drags, double-clicks, long presses, and keyboard shortcuts—so regressions show up as failing interactions, not brittle snapshots.

## Project Structure

```
src/
├── lib/
│   ├── assets/            # Static assets (favicon, fonts, etc.)
│   └── stores/
│       ├── timer.ts       # Timer state machine + derived MM:SS formatting
│       └── timer.test.ts  # Store-level unit coverage
├── routes/
│   ├── +layout.svelte     # Global styles and favicon wiring
│   └── +page.svelte       # Timer UI with gestures, keyboard, orientation logic
│       └── __tests__/     # DOM-facing Vitest suites for the timer page
└── app.css                # Tailwind entry point
```

Playwright specs live in `e2e/`, and project tooling (ESLint, TypeScript, Tailwind) is configured at the repository root.

## Development Notes

- **Follow TDD** – Introduce failing tests for new behavior before touching production Svelte or store code.
- **Design for the DOM** – Tests assert against the rendered output (roles, labels, text) so refactors remain safe.
- **Respect accessibility settings** – Motion-sensitive behavior is already guarded; ensure future animations honor the same pattern.
- **Plan for Tauri later** – The app is web-first. Keep dependencies lean and avoid OS-specific APIs inside the Svelte layer.

## Scripts Reference

| Command              | Purpose                                    |
|----------------------|--------------------------------------------|
| `bun run dev`        | Start the Vite dev server                  |
| `bun run build`      | Create a production build (adapter-static) |
| `bun run preview`    | Preview the production output locally      |
| `bun run test:unit`  | Run Vitest suites                          |
| `bun run test:e2e`   | Run Playwright end-to-end smoke tests      |
| `bun run test`       | Run unit tests followed by e2e             |
| `bun run lint`       | Format check + ESLint                      |
| `bun run format`     | Format source with Prettier                |

## Roadmap

Tempi ships as a web MVP first. Upcoming work focuses on timer presets, audio polish, and a settings surface before we wrap it in Tauri for desktop conveniences like global shortcuts and system tray control.

---

Tempi is built for people who care about focus. If you are improving the timer, start with a failing test, validate it through the DOM, and keep the interface minimal. The digits are the hero—let them breathe.
