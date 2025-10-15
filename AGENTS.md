# Tempi TDD Development Guide

## Core Philosophy: TDD for MVP Development

You MUST follow strict TDD discipline while building Tempi. This means:

1. **Never write production code without a failing test first**
2. **Write the minimum code to make the test pass**
3. **Refactor only when tests are green**
4. **YAGNI (You Aren't Gonna Need It) - Critical for MVPs**
5. **Focus on core features that validate the product hypothesis**
6. **Design for web-first, Tauri-ready architecture**
7. **Frontend TDD MUST assert against the DOM (user-observable behavior)**

> **Diagnostics constraint:** For quick inspection, prefer logging to Vite's console or surfacing state in the app UI.

## DOM-Focused TDD for Frontend

- Write tests that assert **rendered DOM** and **user interactions** (not just store/state)
- Use **@testing-library/svelte** to drive tests by roles, labels, and text
- Include **a11y** checks (e.g., **axe-core**) to catch contrast/ARIA issues
- Prefer **black-box** tests at the component/page level; internal implementation may change
- When needed, take **browser snapshots** to validate layout/contrast/overflow

## Tempi MVP-Specific Principles

### What Makes This an MVP

Tempi's core hypothesis: **"Users want a beautifully minimal timer with clear typography and essential controls"**

- **Core features only**: Large timer display, start/pause, reset
- **Web-first**: Ship web app immediately, package with Tauri later
- **Minimal UI**: Focus on typography, spacing, and essential controls
- **Fast iteration**: Ship core timer in week 1
- **Progressive enhancement**: Add presets, keyboard shortcuts, notifications

### Architecture Strategy

**Core Principle**: Build a clean web app first, make Tauri integration trivial later.

```
┌─────────────────────────────────┐
│        Tempi Web App            │
│  - Timer display                │
│  - Start/Pause/Reset            │
│  - Local state only             │
│  - SvelteKit routing            │
└─────────────┬───────────────────┘
              │
    ┌─────────▼──────────┐
    │  Future: Tauri     │
    │  - System tray     │
    │  - Notifications   │
    │  - Shortcuts       │
    └────────────────────┘
```

## Light and Dark Mode Support

- The app **MUST support both light and dark modes**
- Theme detection via `prefers-color-scheme` media query
- Manual theme toggle stored in localStorage
- Enforce contrast ratios and legibility in both modes (timer digits, buttons, controls)
- Provide **DOM-based tests** that flip the theme and assert correct classes/styles and readable colors
- Use snapshots to compare light/dark variants and detect regressions

## Localization (typesafe-i18n)

- All user-visible strings ship through `typesafe-i18n` under `src/i18n` (base locale `en`, Spanish `es`)
- Consumption happens via the Svelte store wrapper in `src/lib/i18n.ts`; never hard-code copy in components
- Regenerate types before running tests or builds with `bun run i18n:gen` (the root `test` script runs it automatically)
- DOM assertions for locale switching live in `tests/i18n.test.ts`
- If you add another locale, include it in `src/i18n/<locale>/index.ts`, re-run `bun run i18n:gen`, and update tests

### What to Build vs What to Skip

**Build (MVP Week 1 - Web Focus):**

- Large, clear timer display (MM:SS format)
- Start/Pause button
- Reset functionality
- Light/dark mode with system detection
- Keyboard shortcuts (Space = start/pause, R = reset)
- Basic sound on timer completion
- Responsive design (mobile-first)

**Build (Week 2 - Enhancement):**

- Timer presets (25min, 5min, 15min)
- Custom duration input
- Browser notifications
- Session history (localStorage)
- Sound preferences

**Build (Week 3 - Tauri):**

- Tauri desktop packaging
- System tray integration
- Global keyboard shortcuts
- Native notifications
- Always-on-top window mode

**Skip (for now):**

- User accounts / cloud sync
- Statistics dashboard
- Multiple simultaneous timers
- Pomodoro tracking
- Task management integration
- Mobile apps

## Tempi Technology Stack

### Core Setup

- **Bun** as package manager and runtime (fast, TypeScript-native)
- **SvelteKit** for routing and SSG
- **Svelte** for reactive UI (perfect for real-time timers)
- **Tailwind CSS** for rapid UI development
- **Vitest** for testing
- **TypeScript** for type safety
- **Vite** for fast local development
- **Playwright** for end-to-end testing
- **HeadlessUI** for accessible UI components
- **Tauri** (future) for desktop packaging

### Architecture Overview

```
┌────────────────────────────┐
│   SvelteKit Routes         │
│   - / (timer page)         │
│   - /settings              │
└──────────┬─────────────────┘
           │
      ┌────▼────┐
      │ Svelte  │ ← Timer Components
      │   App   │
      └────┬────┘
           │
      ┌────▼──────────────────┐
      │ Timer State           │
      │ - remaining_time      │
      │ - is_running          │
      │ - presets             │
      └───────────────────────┘
```

## YAGNI Principle - Critical for Timer MVP

### Core Rules

- **No backend** - Pure client-side for MVP
- **No complex state management** - Svelte stores are sufficient
- **No user accounts** - localStorage for preferences
- **No analytics** - Focus on core experience

### YAGNI in Practice

❌ **Over-engineered for MVP:**

```typescript
// Don't create complex timer orchestration yet
interface AdvancedTimerFeatures {
	multipleTimers(): void;
	pomodoroTracking(): void;
	taskIntegration(): void;
	cloudSync(): void;
}
```

✅ **MVP-appropriate:**

```typescript
// Simple, works perfectly
interface TimerState {
	remaining_seconds: number;
	is_running: boolean;
	duration_seconds: number;
}

export function startTimer(state: TimerState): TimerState {
	return { ...state, is_running: true };
}

export function pauseTimer(state: TimerState): TimerState {
	return { ...state, is_running: false };
}

export function resetTimer(state: TimerState): TimerState {
	return {
		...state,
		is_running: false,
		remaining_seconds: state.duration_seconds
	};
}
```

## Code Organization Standards

### Project Structure

```
tempi/
├── src/
│   ├── routes/
│   │   ├── +page.svelte           # Main timer page
│   │   ├── +layout.svelte         # Theme wrapper
│   │   └── settings/
│   │       └── +page.svelte       # Settings page
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Timer.svelte       # Main timer display
│   │   │   ├── Controls.svelte    # Start/Pause/Reset
│   │   │   └── Presets.svelte     # Quick preset buttons
│   │   ├── stores/
│   │   │   ├── timer.ts           # Timer state
│   │   │   ├── theme.ts           # Theme state
│   │   │   └── preferences.ts     # User preferences
│   │   ├── utils/
│   │   │   ├── time.ts            # Time formatting
│   │   │   └── sound.ts           # Audio playback
│   │   └── i18n.ts                # i18n wrapper
│   ├── i18n/
│   │   ├── en/
│   │   │   └── index.ts
│   │   └── es/
│   │       └── index.ts
│   └── app.html
├── tests/
│   ├── timer.test.ts
│   ├── controls.test.ts
│   ├── theme.test.ts
│   └── i18n.test.ts
├── static/
│   └── sounds/
│       └── complete.mp3
├── package.json
├── vite.config.ts
├── svelte.config.js
└── tailwind.config.js
```

## Testing Strategy

### What to Test

**Test thoroughly:**

- Timer countdown accuracy (tick every second)
- Start/Pause/Reset functionality
- Time formatting (MM:SS display)
- Keyboard shortcuts
- Theme switching
- Sound playback on completion
- Preset selection
- localStorage persistence

**Test minimally:**

- CSS animations
- Exact pixel positioning
- Audio file quality

### Core Timer Tests

```typescript
// tests/timer.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Timer from '$lib/components/Timer.svelte';

describe('Timer Component', () => {
	it('displays time in MM:SS format', () => {
		// Given
		render(Timer, { props: { seconds: 1500 } });

		// Then
		expect(screen.getByText('25:00')).toBeInTheDocument();
	});

	it('starts countdown on play button click', async () => {
		// Given
		vi.useFakeTimers();
		render(Timer, { props: { seconds: 60 } });

		// When
		await fireEvent.click(screen.getByRole('button', { name: /start/i }));
		vi.advanceTimersByTime(1000);

		// Then
		expect(screen.getByText('00:59')).toBeInTheDocument();
	});

	it('pauses timer on pause button click', async () => {
		// Given
		vi.useFakeTimers();
		render(Timer, { props: { seconds: 60 } });
		await fireEvent.click(screen.getByRole('button', { name: /start/i }));

		// When
		await fireEvent.click(screen.getByRole('button', { name: /pause/i }));
		vi.advanceTimersByTime(1000);

		// Then - time should not change
		expect(screen.getByText('01:00')).toBeInTheDocument();
	});

	it('resets timer to initial duration', async () => {
		// Given
		render(Timer, { props: { seconds: 1500 } });
		await fireEvent.click(screen.getByRole('button', { name: /start/i }));

		// When
		await fireEvent.click(screen.getByRole('button', { name: /reset/i }));

		// Then
		expect(screen.getByText('25:00')).toBeInTheDocument();
	});
});
```

### Keyboard Shortcut Tests

```typescript
// tests/keyboard.test.ts
describe('Keyboard Shortcuts', () => {
	it('starts timer on Space key', async () => {
		// Given
		render(Timer);

		// When
		await fireEvent.keyDown(document, { key: ' ', code: 'Space' });

		// Then
		expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
	});

	it('resets timer on R key', async () => {
		// Given
		render(Timer, { props: { seconds: 60 } });
		await fireEvent.click(screen.getByRole('button', { name: /start/i }));

		// When
		await fireEvent.keyDown(document, { key: 'r', code: 'KeyR' });

		// Then
		expect(screen.getByText('01:00')).toBeInTheDocument();
	});
});
```

## TDD Workflow Example

### Step 1: Propose Test to User

````
"I'll create a test for the timer display formatting:

```typescript
// tests/time-format.test.ts
describe('Time Formatting', () => {
  it('formats seconds as MM:SS', () => {
    // Given
    const testCases = [
      { seconds: 0, expected: '00:00' },
      { seconds: 59, expected: '00:59' },
      { seconds: 60, expected: '01:00' },
      { seconds: 3599, expected: '59:59' },
      { seconds: 3600, expected: '60:00' },
    ];

    for (const { seconds, expected } of testCases) {
      // When
      const formatted = formatTime(seconds);

      // Then
      expect(formatted).toBe(expected);
    }
  });
});
````

Should I proceed with this test?"

````

### Step 2: Get Approval, Run Test (It Should Fail)

### Step 3: Write Minimum Code to Pass

```typescript
// src/lib/utils/time.ts
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
````

### Step 4: Verify Test Passes, Commit

## MVP Commands

```bash
# Development Setup
bun create svelte@latest tempi
cd tempi
bun install

# Install dependencies
bun add -d vitest @testing-library/svelte @testing-library/dom
bun add -d playwright @playwright/test
bun add -d tailwindcss postcss autoprefixer
bun add -d @sveltejs/adapter-static
bun add typesafe-i18n

# Development
bun run dev              # Start dev server (localhost:5173)

# Testing
bun test                 # Run unit tests
bun test:ui              # Open Vitest UI
bun test:e2e             # Run Playwright tests

# i18n
bun run i18n:gen         # Generate i18n types

# Build
bun run build            # Build for production
bun run preview          # Preview production build

# Tauri (future)
bun add -D @tauri-apps/cli
bun run tauri dev        # Run Tauri dev
bun run tauri build      # Build desktop app

# Quick commits
git add .
git commit -m "Add timer display component"
git commit -m "Add start/pause controls"
git commit -m "Add keyboard shortcuts"
```

## Development Timeline

### Week 1: Core Timer MVP

```
Day 1: Timer display component + time formatting
Day 2: Start/Pause/Reset controls
Day 3: Keyboard shortcuts + sound
Day 4: Light/dark theme + responsive design
Day 5: Testing & polish
✅ Ship web app
```

### Week 2: Enhancement Features

```
Day 1: Timer presets (25min, 5min, etc.)
Day 2: Custom duration input
Day 3: Browser notifications
Day 4: localStorage for history/preferences
Day 5: Sound preferences & settings page
✅ Enhanced web app
```

### Week 3: Tauri Desktop

```
Day 1-2: Tauri setup & packaging
Day 3: System tray integration
Day 4: Global shortcuts & native notifications
Day 5: Testing & distribution
✅ Desktop app release
```

## MVP Checklist for Every Feature

- [ ] **Proposed test to user and got approval**
- [ ] Started with a failing test
- [ ] Wrote minimum code to pass
- [ ] All tests pass
- [ ] Works in both light and dark modes
- [ ] Keyboard accessible
- [ ] Responsive on mobile
- [ ] Committed to git

## Anti-Patterns to Avoid

❌ Backend/API before it's needed
❌ Complex state management (Redux, etc.)
❌ User accounts too early
❌ Over-animated UI
❌ Feature creep (task management, stats, etc.)
❌ Premature Tauri integration
❌ Custom time picker components (use native input)

## Progressive Enhancement Strategy

### Core Features (Web MVP) 🌐

- Timer display (large, clear typography)
- Start/Pause/Reset buttons
- Keyboard shortcuts (Space, R)
- Light/dark mode
- Sound on completion
- Responsive design

### Enhanced Features (Week 2) 🚀

- Quick presets (25, 15, 5 minutes)
- Custom duration input
- Browser notifications
- Sound preferences
- Session history
- Settings page

### Desktop Features (Tauri) 🖥️

- System tray icon
- Global keyboard shortcuts
- Native notifications
- Always-on-top window
- Launch at startup
- Menu bar integration (macOS)

## Remember

**MVP Goal**: Create a beautifully minimal timer that feels fast and focused.

**Web First**: Ship immediately, no waiting for Tauri.

**Typography Matters**: Large, clear numbers are the star of the show.

**Keyboard First**: Power users live in keyboard shortcuts.

**Progressive Enhancement**: Web works great, desktop adds convenience.

**No Bloat**: Resist feature creep. A timer should be simple.

## State Management

```typescript
// src/lib/stores/timer.ts
import { writable, derived } from 'svelte/store';

interface TimerState {
	duration_seconds: number;
	remaining_seconds: number;
	is_running: boolean;
}

function createTimerStore() {
	const { subscribe, set, update } = writable<TimerState>({
		duration_seconds: 1500, // 25 minutes default
		remaining_seconds: 1500,
		is_running: false
	});

	return {
		subscribe,
		start: () => update((s) => ({ ...s, is_running: true })),
		pause: () => update((s) => ({ ...s, is_running: false })),
		reset: () =>
			update((s) => ({
				...s,
				is_running: false,
				remaining_seconds: s.duration_seconds
			})),
		tick: () =>
			update((s) => ({
				...s,
				remaining_seconds: Math.max(0, s.remaining_seconds - 1)
			})),
		setDuration: (seconds: number) =>
			update((s) => ({
				...s,
				duration_seconds: seconds,
				remaining_seconds: seconds,
				is_running: false
			}))
	};
}

export const timer = createTimerStore();

export const formattedTime = derived(timer, ($timer) => formatTime($timer.remaining_seconds));
```
