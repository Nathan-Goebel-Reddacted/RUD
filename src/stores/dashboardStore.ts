import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Widget, WidgetPosition, Dashboard, FetchCacheEntry } from "@/types/widget";

type DashboardState = {
  // Persisté
  dashboards:            Dashboard[];
  activeDashboardIndex:  number;

  // Mutations (ciblent dashboards[activeDashboardIndex])
  setTitle:           (title: string) => void;
  setRefreshInterval: (seconds: number) => void;
  addWidget:          (widget: Widget) => void;
  updateWidget:       (widget: Widget) => void;
  removeWidget:       (id: string) => void;
  moveWidget:         (id: string, position: WidgetPosition) => void;

  // Navigation multi-dashboard
  setActiveDashboardIndex: (index: number) => void;
  addDashboard:            (title?: string) => void;
  removeDashboard:         (index: number) => void;
  reorderDashboards:       (fromIndex: number, toIndex: number) => void;

  // Duplication
  duplicateDashboard:       (index: number, titleSuffix?: string) => void;
  renameDashboard:          (index: number, title: string) => void;
  setDashboardShowInDisplay:(index: number, value: boolean) => void;

  // Import / reset
  resetDashboard:  () => void;
  setDashboard:    (d: Dashboard) => void;
  setDashboards:   (dashboards: Dashboard[], activeIndex?: number) => void;

  // Runtime cache (not persisted)
  fetchCache:      Record<string, FetchCacheEntry>;
  setFetchCache:   (key: string, entry: FetchCacheEntry) => void;
  clearFetchCache: () => void;

  // Global clock tick (not persisted) — incremented every second by DashboardClock
  tick:          number;
  incrementTick: () => void;
};

function createDefaultDashboard(): Dashboard {
  return {
    id:              crypto.randomUUID(),
    title:           "My Dashboard",
    widgets:         [],
    refreshInterval: 30,
    showInDisplay:   true,
  };
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.warn("[dashboardStore] localStorage quota exceeded — dashboard not saved.");
    }
  }
}

const safeStorage = {
  getItem:    (key: string) => localStorage.getItem(key),
  setItem:    safeSetItem,
  removeItem: (key: string) => localStorage.removeItem(key),
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      dashboards:           [createDefaultDashboard()],
      activeDashboardIndex: 0,

      setTitle: (title) => set((state) => {
        const dashboards = [...state.dashboards];
        dashboards[state.activeDashboardIndex] = { ...dashboards[state.activeDashboardIndex], title };
        return { dashboards };
      }),

      setRefreshInterval: (seconds) => set((state) => {
        const dashboards = [...state.dashboards];
        dashboards[state.activeDashboardIndex] = { ...dashboards[state.activeDashboardIndex], refreshInterval: seconds };
        return { dashboards };
      }),

      addWidget: (widget) => set((state) => {
        const dashboards = [...state.dashboards];
        const d = dashboards[state.activeDashboardIndex];
        dashboards[state.activeDashboardIndex] = { ...d, widgets: [...d.widgets, widget] };
        return { dashboards };
      }),

      updateWidget: (widget) => set((state) => {
        const dashboards = [...state.dashboards];
        const d = dashboards[state.activeDashboardIndex];
        dashboards[state.activeDashboardIndex] = {
          ...d,
          widgets: d.widgets.map((w) => w.id === widget.id ? widget : w),
        };
        return { dashboards };
      }),

      removeWidget: (id) => set((state) => {
        const dashboards = [...state.dashboards];
        const d = dashboards[state.activeDashboardIndex];
        dashboards[state.activeDashboardIndex] = { ...d, widgets: d.widgets.filter((w) => w.id !== id) };
        return { dashboards };
      }),

      moveWidget: (id, position) => set((state) => {
        const dashboards = [...state.dashboards];
        const d = dashboards[state.activeDashboardIndex];
        dashboards[state.activeDashboardIndex] = {
          ...d,
          widgets: d.widgets.map((w) => w.id === id ? { ...w, position } : w),
        };
        return { dashboards };
      }),

      // Vider fetchCache suffit à forcer un re-fetch immédiat des widgets
      // (tick++ provoquerait un double fetch avec DashboardClock)
      setActiveDashboardIndex: (index) => set((state) => ({
        activeDashboardIndex: Math.max(0, Math.min(index, state.dashboards.length - 1)),
        fetchCache: {},
      })),

      addDashboard: (title) => set((state) => {
        const d: Dashboard = { ...createDefaultDashboard(), ...(title ? { title } : {}) };
        const dashboards = [...state.dashboards, d];
        return { dashboards, activeDashboardIndex: dashboards.length - 1 };
      }),

      removeDashboard: (index) => set((state) => {
        if (state.dashboards.length <= 1) return state;
        const dashboards = state.dashboards.filter((_, i) => i !== index);
        return {
          dashboards,
          activeDashboardIndex: Math.min(state.activeDashboardIndex, dashboards.length - 1),
        };
      }),

      reorderDashboards: (fromIndex, toIndex) => set((state) => {
        if (fromIndex === toIndex) return state;
        const dashboards = [...state.dashboards];
        const [moved] = dashboards.splice(fromIndex, 1);
        dashboards.splice(toIndex, 0, moved);
        let idx = state.activeDashboardIndex;
        if (idx === fromIndex) idx = toIndex;
        else if (fromIndex < idx && toIndex >= idx) idx -= 1;
        else if (fromIndex > idx && toIndex <= idx) idx += 1;
        return { dashboards, activeDashboardIndex: idx, fetchCache: {} };
      }),

      duplicateDashboard: (index, titleSuffix = " (copy)") => set((state) => {
        const source = state.dashboards[index];
        if (!source) return state;
        const cloned: Dashboard = {
          ...source,
          id:      crypto.randomUUID(),
          title:   `${source.title}${titleSuffix}`,
          widgets: source.widgets.map((w) => ({
            ...w,
            id:     crypto.randomUUID(),
            config: structuredClone(w.config),
          })),
        };
        const dashboards = [...state.dashboards];
        dashboards.splice(index + 1, 0, cloned);
        return { dashboards, activeDashboardIndex: index + 1, fetchCache: {} };
      }),

      renameDashboard: (index, title) => set((state) => {
        const trimmed = title.trim();
        if (!trimmed || index < 0 || index >= state.dashboards.length) return state;
        const dashboards = [...state.dashboards];
        dashboards[index] = { ...dashboards[index], title: trimmed };
        return { dashboards };
      }),

      setDashboardShowInDisplay: (index, value) => set((state) => {
        if (index < 0 || index >= state.dashboards.length) return state;
        const dashboards = [...state.dashboards];
        dashboards[index] = { ...dashboards[index], showInDisplay: value };
        return { dashboards };
      }),

      resetDashboard: () => set({ dashboards: [createDefaultDashboard()], activeDashboardIndex: 0 }),

      setDashboard: (d) => set({ dashboards: [d], activeDashboardIndex: 0 }),

      setDashboards: (dashboards, activeIndex = 0) => set({
        dashboards,
        activeDashboardIndex: Math.max(0, Math.min(activeIndex, dashboards.length - 1)),
      }),

      // Runtime cache
      fetchCache:    {},
      setFetchCache: (key, entry) =>
        set((state) => ({ fetchCache: { ...state.fetchCache, [key]: entry } })),
      clearFetchCache: () => set({ fetchCache: {} }),

      // Global clock
      tick:          0,
      incrementTick: () => set((state) => ({ tick: state.tick + 1 })),
    }),
    {
      name:    "rud-dashboard",
      version: 2,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        dashboards:           state.dashboards,
        activeDashboardIndex: state.activeDashboardIndex,
      }),
      migrate: (persistedState, version) => {
        if (version === 0) {
          const old = persistedState as { currentDashboard?: Dashboard };
          const existing = old.currentDashboard;
          // Valider que le dashboard migré est utilisable (id string requis)
          const dashboards =
            existing && typeof existing.id === "string"
              ? [existing]
              : [createDefaultDashboard()];
          return { dashboards, activeDashboardIndex: 0 };
        }
        if (version === 1) {
          // Add showInDisplay field to existing dashboards
          const state = persistedState as { dashboards?: Dashboard[]; activeDashboardIndex?: number };
          return {
            ...state,
            dashboards: (state.dashboards ?? []).map((d) => ({
              ...d,
              showInDisplay: d.showInDisplay ?? true,
            })),
          };
        }
        return persistedState;
      },
    }
  )
);
