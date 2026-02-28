import { useApiStore } from "@/stores/apiStore";

type Props = {
  connectionId: string;
  endpointId:   string;
  onChange:     (connectionId: string, endpointId: string) => void;
};

export default function EndpointSelector({ connectionId, endpointId, onChange }: Props) {
  const connections = useApiStore((state) => state.connections);

  function handleConnectionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const connId = e.target.value;
    const conn   = connections.find((c) => c.getId() === connId);
    const firstEp = conn?.getEndpoints()[0];
    onChange(connId, firstEp?.getId() ?? "");
  }

  function handleEndpointChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(connectionId, e.target.value);
  }

  const selectedConn = connections.find((c) => c.getId() === connectionId);
  const endpoints    = selectedConn?.getEndpoints() ?? [];

  return (
    <div className="endpoint-selector">
      <div className="form-group">
        <label className="form-label">API Connection</label>
        <select
          className="form-select"
          value={connectionId}
          onChange={handleConnectionChange}
        >
          <option value="">— Select a connection —</option>
          {connections.map((c) => (
            <option key={c.getId()} value={c.getId()}>
              {c.getLabel()} ({c.getBaseUrl()})
            </option>
          ))}
        </select>
      </div>

      {connectionId && (
        <div className="form-group">
          <label className="form-label">Endpoint</label>
          <select
            className="form-select"
            value={endpointId}
            onChange={handleEndpointChange}
            disabled={endpoints.length === 0}
          >
            <option value="">— Select an endpoint —</option>
            {endpoints.map((ep) => (
              <option key={ep.getId()} value={ep.getId()}>
                [{ep.getMethod()}] {ep.getPath()}
              </option>
            ))}
          </select>
          {endpoints.length === 0 && (
            <span className="form-hint">No endpoints on this connection.</span>
          )}
        </div>
      )}
    </div>
  );
}
