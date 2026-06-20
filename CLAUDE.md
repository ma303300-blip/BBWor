# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

BBWor is a Hebrew-language, RTL, mobile-first Progressive Web App (PWA) for managing employees across two physical branches (Raanana and Hadera). There is no backend — all state is persisted in `localStorage`. There is no build step, no package manager, no test suite, and no linter. The entire application lives in a single file: `index.html`.

## Development

To run the app locally, serve the repo root over HTTP (required for the service worker):

```sh
python3 -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080` in a browser. Opening `index.html` directly as a `file://` URL will break the service worker registration.

To test PWA install behaviour, use Chrome DevTools → Application → Manifest / Service Workers.

## Architecture

Everything in `index.html` is structured in three sections: CSS, HTML screens, and a single inline `<script>` block.

### Screens

The app is a multi-screen SPA with no router. Screens are `<div class="screen">` elements; only the one with the `.active` class is displayed (`display: flex`). The `show(name)` function switches between them by toggling `.active`.

| Screen ID | Purpose |
|---|---|
| `screen-home` | Entry point — branch selector + manager access |
| `screen-register` | New employee registration form (name, phone, optional photo) |
| `screen-employee` | Logged-in employee home (feature stubs for future features) |
| `screen-manager` | Manager view — approve/reject pending employees per branch |

### Data Model

All persistence is `localStorage`-only. Keys follow these patterns:

- `bbwor_employees_raanana` / `bbwor_employees_hadera` — JSON arrays of employee objects
- `bbwor_session_raanana` / `bbwor_session_hadera` — JSON `{ empId }` for the active session per branch
- `bbwor_nodisplay` — set to `'1'` when the user dismisses the install banner

Employee objects:
```js
{
  id: string,           // Date.now().toString(36) + random suffix
  firstName: string,
  lastName: string,
  phone: string,
  photo: string|null,   // base64 data URL (stored in localStorage — watch size)
  branch: 'raanana'|'hadera',
  status: 'pending'|'approved',
  createdAt: ISO string
}
```

Access helpers: `getEmployees(branch)`, `setEmployees(branch, arr)`, `getSession(branch)`, `setSession(branch, s)`, `clearSession(branch)`.

### Key Flows

**Registration / login:** `enterBranch(branch)` checks for an existing session. If found and approved → `openEmployeeHome`. If pending → `showPendingModal`. If no session → `openRegisterForm`. On submit, `submitReg()` deduplicates by phone number, creates a `pending` employee, and stores a session.

**Manager approval:** `renderManager()` builds the manager view by reading both branches from `localStorage`. `approveEmp(id, branch)` sets `status = 'approved'`; `rejectEmp(id, branch)` removes the record entirely.

**Auto-login on load:** An IIFE at the bottom of the script iterates both branches and calls `openEmployeeHome` if an approved session is found, bypassing the home screen.

### PWA / Service Worker

`sw.js` uses a network-first strategy with a cache fallback. On `activate` it wipes all previous caches (cache-busting on every update). The install banner (`#install-banner`) handles both Android (`beforeinstallprompt` event) and iOS (manual Safari share-sheet instructions). The `_isSA` flag detects standalone mode to suppress the banner when already installed.

## Conventions

- **Language:** UI strings are Hebrew; code identifiers and comments are in English.
- **No external JS dependencies** — vanilla ES5 throughout (no arrow functions, no `const`/`let`, no modules). Keep it that way for broad compatibility.
- **CSS variables** for the colour palette are defined on `:root` — always use `var(--gold)`, `var(--dark)`, etc. rather than hardcoded hex values.
- **Photo storage** is base64 in `localStorage`. If adding features that store more images, consider storage quota limits on mobile browsers (~5–10 MB total).
- The `manifest.json` `start_url` and `scope` are set to `/BBWor/` — this app is designed to be hosted at a subpath (GitHub Pages at `/BBWor/`), so any new assets must work correctly under that base path.
