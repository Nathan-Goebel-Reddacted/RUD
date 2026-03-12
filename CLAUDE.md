# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**API Dashboard Builder** — A 100% frontend React application that lets users connect to any REST API (via manual config or Swagger/OpenAPI import), build a custom dashboard with widgets, and display it fullscreen.

**Core constraint: zero backend, zero server.** All data stays local (localStorage). Deployment targets static hosting only (Netlify, Vercel, GitHub Pages, or self-hosted nginx via Docker).

**Target users:** companies displaying internal metrics on wall/mobile screens, developers testing their APIs.

### 4 Screens

| Screen | Route | Status |
|---|---|---|
| No Profile | `/no-profile` | ✅ done |
| API Configuration | `/api-config` | ✅ done |
| Dashboard Editor | `/dashboard` | ✅ done |
| Fullscreen Display | `/display` | ✅ done |

**API Configuration** — manual input (base URL, headers, auth, endpoints) OR import from a Swagger/OpenAPI file (JSON or YAML) parsed via `js-yaml`.

**Dashboard Editor** — select endpoints, choose widget types, drag-and-drop 12-column grid layout. Phase 2: multi-dashboard support.

**Fullscreen Display** — read-only view, fetches live data from configured APIs. Designed for wall screens (desktop) and smartphones in landscape mode.

### Key Technical Challenges

- **Dynamic fetch** — URL, method, headers, auth all configured by the user at runtime
- **CORS** — user-configured APIs may block browser requests; this is a user responsibility
- **Multi-dashboard state** — Phase 2: multiple dashboards per profile, active index, auto-rotation
- **Mobile display** — landscape lock, 12×4 visible grid, auto-scroll for overflow rows

### Open Questions

- How to handle paginated API responses?

## Distribution Model

**Self-hosting is the intended deployment.** Two options:
- Docker (nginx:alpine) — for companies on their own infra (RUD043)
- Static hosting (Netlify/Vercel/GitHub Pages) — for public/community instance

**QR code profile sharing:** The profile is compressed (LZ-string) + base64-encoded and embedded in the URL hash (`/#/import?data=<base64>`). The server never receives profile data — the hash is client-side only. Warning shown if compressed profile exceeds ~2KB (QR code density limit ~2.9KB binary).

## Mobile Display Architecture

- **Orientation:** landscape forced via `screen.orientation.lock('landscape')`. Fallback: "Please rotate your device" message if unsupported (iOS Safari without PWA).
- **Grid:** same 12-column grid as desktop — no layout recalculation needed. 4 rows visible at a time, dynamic row height via ResizeObserver (same mechanism as RUD028).
- **Overflow:** auto-scroll (RUD034) handles content beyond 4 visible rows. Dashboard rotation (RUD035) cycles through dashboards automatically.
- **PWA:** `vite-plugin-pwa` planned (RUD044) for installability + offline cache + orientation lock on iOS.

## Ticket Tracking

All tickets are stored in `TICKETS.md` at the root of the project. **On every commit, update `TICKETS.md`**: mark completed tickets with `✅`, and add any new tickets that emerge from the work done.

## Commands

```bash
npm run dev       # Dev server (Vite HMR)
npm run build     # TypeScript check + Vite build
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test runner is configured yet.

## Architecture

**Goal:** 100% frontend React app — API Dashboard Builder, zero backend. Persistence via localStorage (Zustand persist middleware). Import/export via JSON backup files.

### Routing (`src/main.tsx`)

```
/             → App.tsx (profile guard → /dashboard or /no-profile)
/no-profile   → pages/noProfile.tsx
/api-config   → pages/apiConfig.tsx
/dashboard    → pages/dashboard.tsx
/display      → pages/displayDashboard.tsx
```

### State Management

Three Zustand stores with `persist` middleware (localStorage):
- `src/stores/profileStore.ts` — user profile, key `"rud-profile"`
- `src/stores/apiStore.ts` — API connections (`ApiConnection[]`), key `"rud-api"`
- `src/stores/dashboardStore.ts` — current dashboard + runtime fetch cache (not persisted), key `"rud-dashboard"`

### Domain Patterns

- **`ActionResult`** (`src/services/resultAction.tsx`): Result pattern for all validation. `isSuccess()` returns true when `reasons` array is empty. Error reasons carry both a code and an i18n key.
- **`ApiConnection`** / **`ApiEndpoint`** — domain classes with getters, rehydrated from JSON via `fromJSON()`.

### i18n (`src/translations/`)

`i18next` + `react-i18next`. Language set at runtime from profile. Keys follow dot-notation namespaced by feature (`noProfile.title`, `navbar.export`, etc.). Both `en.json` and `fr.json` maintained.

### Path Alias

`@/` maps to `src/` (configured in `vite.config.ts`). Always use `@/` for internal imports.

### CSS

- `src/index.css` — global resets and utility classes
- `src/assets/Color.css` — CSS custom properties (`--background-color`, `--border-color`, `--danger-color`, etc.)
- `src/assets/dashboard.css` — dashboard, widgets, toolbar, display styles
- No CSS framework installed

### Installed Stack

| Library | Purpose |
|---|---|
| `zustand` v5 | State management + localStorage persistence |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop layout editor |
| `recharts` | Bar, Line charts |
| `js-yaml` | Parse Swagger/OpenAPI YAML files |
| `jsonpath-plus` | JSONPath extraction in widgets |

> `src/components/tool/Modal.tsx` — custom modal implementation (React portals, focus trap, Escape key, ARIA). The `modal` and `popup` packages in `package.json` are unused.
