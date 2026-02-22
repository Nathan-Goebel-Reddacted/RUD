import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import ApiConnection from "@/class/ApiConnection";

type ApiState = {
  connections: ApiConnection[];
  addConnection: (connection: ApiConnection) => void;
  updateConnection: (connection: ApiConnection) => void;
  removeConnection: (id: string) => void;
};

export const useApiStore = create<ApiState>()(
  persist(
    (set) => ({
      connections: [],
      addConnection: (connection) =>
        set((state) => ({ connections: [...state.connections, connection] })),
      updateConnection: (connection) =>
        set((state) => ({
          connections: state.connections.map((c) =>
            c.getId() === connection.getId() ? connection : c
          ),
        })),
      removeConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((c) => c.getId() !== id),
        })),
    }),
    {
      name: "rud-api-connections",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.connections = state.connections
          .map((c) =>
            c instanceof ApiConnection ? c : ApiConnection.fromJSON(c)
          )
          .filter((c): c is ApiConnection => c !== null);
      },
    }
  )
);
