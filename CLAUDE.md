# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**API Dashboard Builder** — A 100% frontend React application that lets users connect to any REST API (via manual config or Swagger/OpenAPI import), build a custom dashboard with charts, and display it fullscreen.

**Core constraint: zero backend, zero server.** All data stays local. Deployment targets static hosting only (Netlify, Vercel, GitHub Pages).

### 3 Screens

| Screen | Route | Status |
|---|---|---|
| API Configuration | TBD | ❌ not started |
| Dashboard Editor | `/dashboard` | ❌ stub only |
| Fullscreen Display | TBD | ❌ not started |

**API Configuration** — manual input (base URL, headers, auth, endpoints) OR import from a Swagger/OpenAPI file (JSON or YAML) parsed via `swagger-parser`.

**Dashboard Editor** — select endpoints, choose chart types, drag-and-drop grid layout, save/load config as a JSON file.

**Fullscreen Display** — read-only view, fetches live data from configured APIs, designed for wall/monitoring screens.

### JSON Config Format

```json
{
  "version": "1.0",
  "api": {
    "baseUrl": "https://api.example.com",
    "headers": {},
    "endpoints": [{ "id": "users", "path": "/users", "method": "GET", "label": "Users list" }]
  },
  "dashboard": {
    "title": "My Dashboard",
    "widgets": [
      { "id": "widget-1", "type": "bar-chart", "endpointId": "users", "dataPath": "$.data", "position": { "x": 0, "y": 0, "w": 6, "h": 4 } }
    ]
  }
}
```

### Key Technical Challenges

- **Swagger parsing** — mapping OpenAPI endpoints to callable fetch configs at runtime
- **Dynamic fetch** — URL, method, headers, auth all configured by the user at runtime
- **CORS** — user-configured APIs may block browser requests; this is a user responsibility
- **Dashboard state** — complex shared state between Editor and Display screens (planned: Zustand)
- **Drag-and-drop layout** — grid-based editor with resize + reorder (planned: dnd-kit)

### Open Questions (not yet decided)

- Chart types to support first? (bar, line, pie, table, number card)
- API auth methods to support? (Bearer token, API Key, Basic Auth)
- Grid system: fixed grid vs free placement?
- How to map API response fields to chart axes? (visual mapper or JSONPath?)
- Refresh interval for live data on the display screen?
- How to handle paginated API responses?

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

**Goal:** 100% frontend React app — API Dashboard Builder with 3 screens, zero backend. Persistence via JSON import/export only.

### Routing (`src/main.tsx`)

```
/             → App.tsx (redirect guard)
/no-profile   → pages/noProfile.tsx
/dashboard    → pages/dashboard.tsx  [stub]
```

`App.tsx` reads `ProfileContext` and redirects: if profile exists → `/dashboard`, else → `/no-profile`. It also applies the profile language to i18n.

`ProfileProvider` wraps the entire router — it must remain the outermost wrapper.

### State Management

Single `ProfileContext` (`src/contexts/ProfileContext.tsx`) exposes `{ profile: Profile | null, setProfile }`. Consumed via `useProfile()` hook. **No Zustand yet** — planned but not installed.

The `Profile` class (`src/class/Profiles.tsx`) holds user settings. Several fields are stubbed with comments (`Dashboards`, `APIs`, `roleForEditDashboard`, etc.) — these are the extension points for upcoming features.

### Domain Patterns

- **`ActionResult`** (`src/services/resultAction.tsx`): Result pattern used for all validation. `isSuccess()` returns true when `reasons` array is empty. Error reasons carry both a code (e.g. `"Profile.name.tooShort"`) and an i18n key (e.g. `"profile.invalidName"`).
- **`Profile`** class uses `createAProfile()` as a factory-style init, then `IsProfileValid()` before any usage.

### i18n (`src/translations/`)

`i18next` + `react-i18next`. Language is set at runtime from `profile.getLanguage()`. Translation keys follow dot-notation namespaced by feature (e.g. `noProfile.title`, `profileSettings.name`). French translations (`fr.json`) are incomplete — only structure exists.

### Path Alias

`@/` maps to `src/` (configured in `vite.config.ts`). Always use `@/` for internal imports.

### CSS

- `src/index.css` — global resets and utility classes (`margin-10`, `display-block`, etc.)
- `src/assets/Color.css` — CSS custom properties for the color palette
- No CSS framework installed

### Planned Stack (not yet installed)

| Library | Purpose |
|---|---|
| `zustand` | Replace Context API for complex shared state |
| `dnd-kit` | Drag-and-drop layout editor |
| `recharts` | Charts and data visualization |
| `swagger-parser` | Parse OpenAPI 2.0/3.x specs at runtime |

> `modal` and `popup` are in `package.json` but unused — `src/components/tool/Modal.tsx` is the actual modal implementation (React portals, focus trap, Escape key, ARIA).
