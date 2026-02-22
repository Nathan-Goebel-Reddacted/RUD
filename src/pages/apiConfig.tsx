import { useState } from "react";
import { useApiStore } from "@/stores/apiStore";
import { openModal, closeModal } from "@/components/tool/Modal";
import ApiConnectionForm, {
  MODAL_CREATE_ID,
  MODAL_EDIT_ID,
} from "@/components/ApiConfig/ApiConnectionForm";
import ApiEndpointForm, {
  ENDPOINT_MODAL_CREATE_ID,
  ENDPOINT_MODAL_EDIT_ID,
} from "@/components/ApiConfig/ApiEndpointForm";
import { sendEndpoint, testConnection } from "@/services/apiFetch";
import type { FetchStatus } from "@/services/apiFetch";
import { AuthType } from "@/enum/authType";
import ApiConnection from "@/class/ApiConnection";
import ApiEndpoint from "@/class/ApiEndpoint";
import "@/components/ApiConfig/ApiConfig.css";

function StatusDot({ status }: { status: FetchStatus }) {
  return (
    <span
      className={`status-dot${status !== "unknown" ? ` status-dot--${status}` : ""}`}
      title={status}
    />
  );
}

function ApiConfig() {
  const connections = useApiStore((state) => state.connections);

  const [openId,               setOpenId]               = useState<string | null>(null);
  const [editingConnection,    setEditingConnection]    = useState<ApiConnection | null>(null);
  const [endpointConnectionId, setEndpointConnectionId] = useState<string | null>(null);
  const [editingEndpoint,      setEditingEndpoint]      = useState<ApiEndpoint | null>(null);

  const [endpointStatuses,   setEndpointStatuses]   = useState<Record<string, FetchStatus>>({});
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, FetchStatus>>({});

  const toggleOpen = (id: string) =>
    setOpenId((prev) => (prev === id ? null : id));

  const openEditConnection = (conn: ApiConnection, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConnection(conn);
    openModal(MODAL_EDIT_ID);
  };

  const openAddEndpoint = (connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEndpointConnectionId(connectionId);
    setEditingEndpoint(null);
    openModal(ENDPOINT_MODAL_CREATE_ID);
  };

  const openEditEndpoint = (conn: ApiConnection, ep: ApiEndpoint, e: React.MouseEvent) => {
    e.stopPropagation();
    setEndpointConnectionId(conn.getId());
    setEditingEndpoint(ep);
    openModal(ENDPOINT_MODAL_EDIT_ID);
  };

  const handleSendEndpoint = async (conn: ApiConnection, ep: ApiEndpoint, e: React.MouseEvent) => {
    e.stopPropagation();
    setEndpointStatuses((prev) => ({ ...prev, [ep.getId()]: "loading" }));
    const result = await sendEndpoint(conn, ep);
    setEndpointStatuses((prev) => ({ ...prev, [ep.getId()]: result }));
  };

  const handleTestConnection = async (conn: ApiConnection, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectionStatuses((prev) => ({ ...prev, [conn.getId()]: "loading" }));
    const result = await testConnection(conn);
    setConnectionStatuses((prev) => ({ ...prev, [conn.getId()]: result }));
  };

  const closeCreate         = () => closeModal(MODAL_CREATE_ID);
  const closeEditConnection = () => { closeModal(MODAL_EDIT_ID); setEditingConnection(null); };
  const closeEndpointCreate = () => { closeModal(ENDPOINT_MODAL_CREATE_ID); setEndpointConnectionId(null); };
  const closeEndpointEdit   = () => { closeModal(ENDPOINT_MODAL_EDIT_ID); setEditingEndpoint(null); setEndpointConnectionId(null); };

  return (
    <div className="page-with-nav p-2 d-flex flex-col align-center">
      <ul className="api-list">
        {connections.map((conn) => {
          const isOpen    = openId === conn.getId();
          const endpoints = conn.getEndpoints();
          const hasAuth   = conn.getAuthType() !== AuthType.NONE;
          const connStatus = connectionStatuses[conn.getId()] ?? "unknown";

          return (
            <li key={conn.getId()} className="api-item">
              <div
                className="api-item__header"
                onClick={() => toggleOpen(conn.getId())}
              >
                {hasAuth && <StatusDot status={connStatus} />}
                <span className="api-item__url">{conn.getBaseUrl()}</span>
                <div className="api-item__actions">
                  {hasAuth && (
                    <button
                      className="api-item__btn"
                      title="Test connection"
                      onClick={(e) => handleTestConnection(conn, e)}
                    >
                      Test
                    </button>
                  )}
                  <button
                    className="api-item__btn"
                    title="Edit connection"
                    onClick={(e) => openEditConnection(conn, e)}
                  >
                    …
                  </button>
                  <span className={`api-item__chevron${isOpen ? " api-item__chevron--open" : ""}`}>
                    ▼
                  </span>
                </div>
              </div>

              {isOpen && (
                <div className="api-item__body">
                  {endpoints.length === 0 ? (
                    <div className="endpoint-row" style={{ opacity: 0.5 }}>
                      No routes yet
                    </div>
                  ) : (
                    endpoints.map((ep) => {
                      const epStatus = endpointStatuses[ep.getId()] ?? "unknown";
                      return (
                        <div key={ep.getId()} className="endpoint-row">
                          <span className="endpoint-row__info">
                            <StatusDot status={epStatus} />
                            <span className="endpoint-row__path">{ep.getPath()}</span>
                          </span>
                          <span className="endpoint-row__method">{ep.getMethod()}</span>
                          <button
                            className="api-item__btn"
                            onClick={(e) => handleSendEndpoint(conn, ep, e)}
                          >
                            Send
                          </button>
                          <button
                            className="api-item__btn"
                            title="Edit route"
                            onClick={(e) => openEditEndpoint(conn, ep, e)}
                          >
                            …
                          </button>
                        </div>
                      );
                    })
                  )}
                  <button
                    className="api-item__add-route"
                    onClick={(e) => openAddEndpoint(conn.getId(), e)}
                  >
                    + Add route
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button
        className="api-config__add-api"
        onClick={() => openModal(MODAL_CREATE_ID)}
      >
        + Add API connection
      </button>

      <ApiConnectionForm onClose={closeCreate} />
      {editingConnection && (
        <ApiConnectionForm
          key={editingConnection.getId()}
          initialConnection={editingConnection}
          onClose={closeEditConnection}
        />
      )}

      {endpointConnectionId && !editingEndpoint && (
        <ApiEndpointForm
          connectionId={endpointConnectionId}
          onClose={closeEndpointCreate}
        />
      )}
      {endpointConnectionId && editingEndpoint && (
        <ApiEndpointForm
          key={editingEndpoint.getId()}
          connectionId={endpointConnectionId}
          initialEndpoint={editingEndpoint}
          onClose={closeEndpointEdit}
        />
      )}
    </div>
  );
}

export default ApiConfig;
