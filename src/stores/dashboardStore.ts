import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Widget, WidgetPosition, Dashboard, FetchCacheEntry } from "@/types/widget";

type DashboardState = {
  // Persisted
  currentDashboard: Dashboard;

  // Actions
  setTitle:           (title: string) => void;
  setRefreshInterval: (seconds: number) => void;
  addWidget:          (widget: Widget) => void;
  updateWidget:       (widget: Widget) => void;
  removeWidget:       (id: string) => void;
  moveWidget:         (id: string, position: WidgetPosition) => void;

  // Runtime cache (not persisted)
  fetchCache:      Record<string, FetchCacheEntry>;
  setFetchCache:   (key: string, entry: FetchCacheEntry) => void;
  clearFetchCache: () => void;
};

const defaultDashboard: Dashboard = {
  id:              crypto.randomUUID(),
  title:           "My Dashboard",
  widgets:         [],
  refreshInterval: 30,
};

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
      currentDashboard: defaultDashboard,

      setTitle: (title) =>
        set((state) => ({
          currentDashboard: { ...state.currentDashboard, title },
        })),

      setRefreshInterval: (seconds) =>
        set((state) => ({
          currentDashboard: { ...state.currentDashboard, refreshInterval: seconds },
        })),

      addWidget: (widget) =>
        set((state) => ({
          currentDashboard: {
            ...state.currentDashboard,
            widgets: [...state.currentDashboard.widgets, widget],
          },
        })),

      updateWidget: (widget) =>
        set((state) => ({
          currentDashboard: {
            ...state.currentDashboard,
            widgets: state.currentDashboard.widgets.map((w) =>
              w.id === widget.id ? widget : w
            ),
          },
        })),

      removeWidget: (id) =>
        set((state) => ({
          currentDashboard: {
            ...state.currentDashboard,
            widgets: state.currentDashboard.widgets.filter((w) => w.id !== id),
          },
        })),

      moveWidget: (id, position) =>
        set((state) => ({
          currentDashboard: {
            ...state.currentDashboard,
            widgets: state.currentDashboard.widgets.map((w) =>
              w.id === id ? { ...w, position } : w
            ),
          },
        })),

      // Runtime cache
      fetchCache:    {},
      setFetchCache: (key, entry) =>
        set((state) => ({ fetchCache: { ...state.fetchCache, [key]: entry } })),
      clearFetchCache: () => set({ fetchCache: {} }),
    }),
    {
      name:    "rud-dashboard",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ currentDashboard: state.currentDashboard }),
    }
  )
);
