import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import ApiConnection from "@/class/ApiConnection";
import ApiEndpoint from "@/class/ApiEndpoint";

type ApiState = {
  connections: ApiConnection[];
  addConnection: (connection: ApiConnection) => void;
  updateConnection: (connection: ApiConnection) => void;
  removeConnection: (id: string) => void;
  addEndpoint: (connectionId: string, endpoint: ApiEndpoint) => void;
  updateEndpoint: (connectionId: string, endpoint: ApiEndpoint) => void;
  removeEndpoint: (connectionId: string, endpointId: string) => void;
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
      addEndpoint: (connectionId, endpoint) =>
        set((state) => ({
          connections: state.connections.map((c) => {
            if (c.getId() !== connectionId) return c;
            const updated = c.clone();
            updated.addEndpoint(endpoint);
            return updated;
          }),
        })),
      updateEndpoint: (connectionId, endpoint) =>
        set((state) => ({
          connections: state.connections.map((c) => {
            if (c.getId() !== connectionId) return c;
            const updated = c.clone();
            updated.removeEndpoint(endpoint.getId());
            updated.addEndpoint(endpoint);
            return updated;
          }),
        })),
      removeEndpoint: (connectionId, endpointId) =>
        set((state) => ({
          connections: state.connections.map((c) => {
            if (c.getId() !== connectionId) return c;
            const updated = c.clone();
            updated.removeEndpoint(endpointId);
            if (updated.getHealthCheckEndpointId() === endpointId) {
              updated.setHealthCheckEndpointId(null);
            }
            return updated;
          }),
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
