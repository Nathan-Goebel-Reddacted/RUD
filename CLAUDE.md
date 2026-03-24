# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**API Dashboard Builder** — A 100% frontend React application that lets users connect to any REST API (via manual config or Swagger/OpenAPI import), build custom dashboards with widgets, and display them fullscreen.

**Core constraint: zero backend, zero server.** All data stays local (localStorage). Deployment targets static hosting only (GitHub Pages, Netlify, Vercel, or self-hosted nginx via Docker).

**Target users:** companies displaying internal metrics on wall/mobile screens, developers testing their APIs.

### 4 Screens

| Screen | Route | Status |
|---|---|---|
| No Profile | `/no-profile` | ✅ done |
| API Configuration | `/api-config` | ✅ done |
| Dashboard Editor | `/dashboard` | ✅ done |
| Fullscreen Display | `/display` | ✅ done |

**API Configuration** — manual input (base URL, headers, auth, endpoints) OR import from a Swagger/OpenAPI file (JSON or YAML) parsed via `js-yaml`.

**Dashboard Editor** — select endpoints, choose widget types, drag-and-drop 12-column grid layout. Multi-dashboard support: tabs/bubbles to switch dashboards, drag-to-reorder, duplication.

**Fullscreen Display** — read-only view (except interactive widgets), fetches live data from configured APIs. Auto-scroll, automatic dashboard rotation, wake lock. Designed for wall screens (desktop) and smartphones in landscape mode.

### Widget types

| Type | Category | Description |
|---|---|---|
| `number-card` | Data | Single numeric value + unit + sparkline history |
| `table` | Data | Auto or configured columns, configurable max rows |
| `bar-chart` | Data | Bar chart via recharts, count aggregation |
| `line-chart` | Data | Multi-series line chart, keep-history mode |
| `text` | Static | Free static text, no API required |
| `raw-response` | Debug | Raw JSON response in a scrollable `<pre>` |
| `health-check` | Status | HTTP ping → OK/KO colored dot |
| `clock` | Native | Real-time clock, 12h/24h |
| `last-update` | Native | Timestamp of last endpoint fetch |

Interactive widgets (Phase 3 — planned): `form`, `button`, `toggle`, `slider`, `select`, `search`.

### Key Technical Challenges

- **Dynamic fetch** — URL, method, headers, auth all configured by the user at runtime
- **CORS** — user-configured APIs may block browser requests; this is a user responsibility
- **Interactive widgets** — Phase 3: widgets that trigger POST/PUT/PATCH calls from the Display screen
- **Mobile display** — landscape lock, 12×4 visible grid, auto-scroll for overflow rows
- **Widget history** — runtime-only in-memory history (not persisted) for sparklines and line chart keep-history mode

### Open Questions

- How to handle paginated API responses?

## Distribution Model

**Self-hosting is the intended deployment.** Two options:
- **Docker** (`docker compose up`) — `rud-full` port 8080 (Editor + Display), `rud-display` port 8081 (Display only)
- **GitHub Pages** — display-only PWA at `https://nathan-goebel-reddacted.github.io/RUD/`, auto-deployed on push to `main`

**QR code profile sharing:** The profile is compressed (LZ-string) + base64-encoded and embedded in the URL hash (`/#/import?data=<base64>`). The server never receives profile data — the hash is client-side only. Warning shown if compressed profile exceeds ~2KB (QR code density limit ~2.9KB binary).

## Mobile Display Architecture

- **Orientation:** landscape forced via `screen.orientation.lock('landscape')`. Fallback: "Please rotate your device" message if unsupported (iOS Safari without PWA).
- **Grid:** same 12-column grid as desktop — no layout recalculation needed. 4 rows visible at a time, dynamic row height via ResizeObserver.
- **Overflow:** auto-scroll (configurable px/s) handles content beyond 4 visible rows. Dashboard rotation cycles through dashboards automatically in `timer` or `scroll-end` mode.
- **PWA:** `vite-plugin-pwa` installed — installable, offline cache, orientation lock on iOS.
- **Wake Lock:** `navigator.wakeLock.request('screen')` active in Display mode, silent fallback.

## Ticket Tracking

All tickets are stored in `TICKETS.md` at the root of the project. **On every commit, update `TICKETS.md`**: mark completed tickets with `✅`, and add any new tickets that emerge from the work done.

## Commands

```bash
npm run dev              # Dev server (Vite HMR)
npm run build            # TypeScript check + Vite build (full app)
npm run build:display    # Build display-only (no Editor/ApiConfig)
npm run build:gh-pages   # Build display-only with base /RUD/ for GitHub Pages
npm run lint             # ESLint
npm run preview          # Preview production build
```

No test runner is configured yet.

## Architecture

**Goal:** 100% frontend React app — API Dashboard Builder, zero backend. Persistence via localStorage (Zustand persist middleware). Import/export via JSON backup files and QR code URL.

### Routing (`src/main.tsx`)

```
/             → App.tsx (profile guard → /dashboard or /no-profile)
/no-profile   → pages/noProfile.tsx
/api-config   → pages/apiConfig.tsx
/dashboard    → pages/dashboard.tsx
/display      → pages/displayDashboard.tsx
```

Display-only build uses `src/main.display.tsx` as entry point (excludes Editor and ApiConfig pages).

### State Management

Zustand stores with `persist` middleware (localStorage):
- `src/stores/profileStore.ts` — user profile, key `"rud-profile"`
- `src/stores/apiStore.ts` — API connections (`ApiConnection[]`), key `"rud-api"`
- `src/stores/dashboardStore.ts` — dashboards array + active index + runtime fetch cache (cache not persisted), key `"rud-dashboard"`
- `src/stores/widgetHistory.ts` — runtime-only in-memory history for widgets (Map, never persisted). `clearHistory(widgetId)` called on widget deletion.

### Domain Patterns

- **`ActionResult`** (`src/services/resultAction.tsx`): Result pattern for all validation. `isSuccess()` returns true when `reasons` array is empty. Error reasons carry both a code (`getReasonCode()`) and an i18n key (`getReasonMessage()`).
- **`ApiConnection`** / **`ApiEndpoint`** (`src/class/`) — domain classes with getters, rehydrated from JSON via `fromJSON()`.
- **`Profile`** (`src/class/Profiles.tsx`) — profile class with color, language, display settings. `isProfileValid()` used before save.

### i18n (`src/translations/`)

`i18next` + `react-i18next`. Language set at runtime from profile. Keys follow dot-notation namespaced by feature (`noProfile.title`, `navbar.export`, etc.). Both `en.json` and `fr.json` maintained.

### Path Alias

`@/` maps to `src/` (configured in `vite.config.ts`). Always use `@/` for internal imports.

### CSS Architecture

Modular CSS files, no framework:
- `src/assets/Color.css` — CSS custom properties (`--background-color`, `--border-color`, `--text-color`, `--text-hover-color`, `--danger-color`, etc.)
- `src/assets/global.css` — base resets, element styles, form feedback classes
- `src/assets/utilities.css` — utility classes (flexbox, spacing, sizing, color picker)
- `src/assets/navbar.css` — navbar and HUD styles
- `src/assets/api-config.css` — API config page styles
- `src/assets/dashboard.css` — dashboard grid, widgets, toolbar, display styles

### Installed Stack

| Library | Purpose |
|---|---|
| `zustand` v5 | State management + localStorage persistence |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop layout editor |
| `recharts` | Bar, Line charts |
| `js-yaml` | Parse Swagger/OpenAPI YAML files |
| `jsonpath-plus` | JSONPath extraction in widgets |
| `lz-string` | Profile compression for QR code URL sharing |
| `qrcode.react` | QR code generation from profile URL |
| `react-colorful` | Color picker (HexColorPicker) in profile settings and widget config |

### Key Components

```
src/components/
├── tool/
│   ├── Modal.tsx            # Custom modal (portals, focus trap, Escape, ARIA)
│   ├── ColorPicker.tsx      # HexColorPicker + hex input, smart viewport positioning
│   └── ConfirmDeleteButton.tsx
├── HUD/
│   ├── NavBar.tsx
│   ├── ProfilSettings.tsx   # Profile edit modal (tabs: profile, display, dashboards)
│   └── QRCodeModal.tsx
├── Widget/
│   ├── WidgetCard.tsx       # Container: header, loading/error, dispatch type
│   ├── DashboardGrid.tsx    # dnd-kit, CSS Grid 12 cols 80px rows
│   ├── DashboardToolbar.tsx # Title, refresh interval, Add widget, ▶ Display
│   ├── types/               # NumberCard, Table, BarChart, LineChart, Text,
│   │                        # RawResponse, HealthCheck, ClockWidget,
│   │                        # LastUpdateWidget
│   └── config/
│       ├── WidgetConfigPanel.tsx  # Add/edit modal
│       ├── EndpointSelector.tsx   # Connection → endpoint nested select
│       ├── DataPathInput.tsx      # JSONPath + live preview
│       └── AxisKeySelector.tsx    # Keys from response introspection
└── ApiConfig/
    ├── ApiConnectionForm.tsx
    └── ApiEndpointForm.tsx
```

### Services & Hooks

- `src/services/apiFetch.ts` — `sendEndpoint()`, `testConnection()`, `buildFetchHeaders()`, `buildEndpointUrl()`
- `src/services/widgetFetch.ts` — `fetchWidgetData(conn, ep, dataPath, signal?)`, `extractData(raw, path)`
- `src/services/resultAction.tsx` — `ActionResult` / `Reason` pattern
- `src/services/profileBackup.ts` — JSON export/import
- `src/services/swaggerImport.ts` — Swagger/OpenAPI parsing
- `src/hooks/useWidgetData.ts` — fetch + polling + AbortController + cache dedup by `connectionId::endpointId`
- `src/hooks/useFullscreen.ts` — requestFullscreen + webkit fallback

### Important Behaviours

- Widget orphan: `useWidgetData` returns `error: "endpoint_not_found"` if connection/endpoint not found
- `extractData`: `null` → `no_data`, `undefined` → `invalid_path`, `[]` → valid empty array
- Fetch cache key: `${connectionId}::${endpointId}`, freshness = 90% of refresh interval
- `safeStorage` in dashboardStore: `QuotaExceededError` handled silently with `console.warn`
- `clearHistory(widgetId)` called on `removeWidget` to avoid stale in-memory data
