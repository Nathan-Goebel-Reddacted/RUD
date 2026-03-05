import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import SwaggerImportButton from "@/components/ApiConfig/SwaggerImportButton";
import { sendEndpoint } from "@/services/apiFetch";
import type { FetchStatus, FetchResult } from "@/services/apiFetch";
import ApiConnection from "@/class/ApiConnection";
import ApiEndpoint from "@/class/ApiEndpoint";
import "@/components/ApiConfig/ApiConfig.css";

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086zM11.189 6.25 9.75 4.81l-6.286 6.287a.25.25 0 0 0-.064.108l-.558 1.953 1.953-.558a.25.25 0 0 0 .108-.064z"/>
  </svg>
);

function StatusDot({ status }: { status: FetchStatus }) {
  return (
    <span
      className={`status-dot${status !== "unknown" ? ` status-dot--${status}` : ""}`}
      title={status}
    />
  );
}

function ApiConfig() {
  const { t } = useTranslation();
  const connections   = useApiStore((state) => state.connections);
  const addConnection = useApiStore((state) => state.addConnection);

  const [openId,               setOpenId]               = useState<string | null>(null);
  const [editingConnection,    setEditingConnection]    = useState<ApiConnection | null>(null);
  const [endpointConnectionId, setEndpointConnectionId] = useState<string | null>(null);
  const [editingEndpoint,      setEditingEndpoint]      = useState<ApiEndpoint | null>(null);

  const [endpointResults,    setEndpointResults]    = useState<Record<string, FetchResult>>({});
  const [endpointLoading,    setEndpointLoading]    = useState<Record<string, boolean>>({});
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, FetchStatus>>({});

  // Auto-connect health check endpoints on mount
  useEffect(() => {
    connections.forEach((conn) => {
      const hcId = conn.getHealthCheckEndpointId();
      if (!hcId) return;
      const ep = conn.getEndpoints().find((e) => e.getId() === hcId);
      if (!ep) return;
      setConnectionStatuses((prev) => ({ ...prev, [conn.getId()]: "loading" }));
      sendEndpoint(conn, ep).then((result) => {
        setConnectionStatuses((prev) => ({ ...prev, [conn.getId()]: result.status }));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setEndpointLoading((prev) => ({ ...prev, [ep.getId()]: true }));
    const result = await sendEndpoint(conn, ep);
    setEndpointLoading((prev) => ({ ...prev, [ep.getId()]: false }));
    setEndpointResults((prev) => ({ ...prev, [ep.getId()]: result }));
  };

  const handleConnectHealth = async (conn: ApiConnection, ep: ApiEndpoint, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectionStatuses((prev) => ({ ...prev, [conn.getId()]: "loading" }));
    const result = await sendEndpoint(conn, ep);
    setConnectionStatuses((prev) => ({ ...prev, [conn.getId()]: result.status }));
  };

  const handleSwaggerImport = (conn: ApiConnection) => {
    addConnection(conn);
    setOpenId(conn.getId());
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
          const connStatus = connectionStatuses[conn.getId()] ?? "unknown";
          const hcId = conn.getHealthCheckEndpointId();
          const hcEp = hcId ? conn.getEndpoints().find((e) => e.getId() === hcId) ?? null : null;

          return (
            <li key={conn.getId()} className="api-item">
              <div
                className="api-item__header"
                onClick={() => toggleOpen(conn.getId())}
              >
                {hcEp && <StatusDot status={connStatus} />}
                <span className="api-item__url">{conn.getBaseUrl()}</span>
                <div className="api-item__actions">
                  {hcEp && (
                    <button
                      className="api-item__btn"
                      title={t("apiConfig.connect")}
                      onClick={(e) => handleConnectHealth(conn, hcEp, e)}
                    >
                      {t("apiConfig.connect")}
                    </button>
                  )}
                  <button
                    className="api-item__btn api-item__btn--icon"
                    title={t("apiConfig.editConnection")}
                    onClick={(e) => openEditConnection(conn, e)}
                  >
                    <PencilIcon />
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
                      {t("apiConfig.noRoutes")}
                    </div>
                  ) : (
                    endpoints.map((ep) => {
                      const isLoading = endpointLoading[ep.getId()] ?? false;
                      const result    = endpointResults[ep.getId()];
                      const epStatus: FetchStatus = isLoading ? "loading" : (result?.status ?? "unknown");

                      return (
                        <div key={ep.getId()}>
                          <div className="endpoint-row">
                            <span className="endpoint-row__info">
                              <StatusDot status={epStatus} />
                              <span className="endpoint-row__path">{ep.getPath()}</span>
                            </span>
                            <span className={`endpoint-row__method method--${ep.getMethod().toLowerCase()}`}>
                              {ep.getMethod()}
                            </span>
                            <button
                              className="api-item__btn"
                              disabled={isLoading}
                              onClick={(e) => handleSendEndpoint(conn, ep, e)}
                            >
                              {isLoading ? "…" : t("apiConfig.send")}
                            </button>
                            <button
                              className="api-item__btn api-item__btn--icon"
                              title={t("apiConfig.editRoute")}
                              onClick={(e) => openEditEndpoint(conn, ep, e)}
                            >
                              <PencilIcon />
                            </button>
                          </div>
                          {result && !isLoading && (
                            <div className={`endpoint-result${result.corsError ? " endpoint-result--cors" : result.status === "error" ? " endpoint-result--error" : ""}`}>
                              {result.httpCode && (
                                <span className="endpoint-result__code">{result.httpCode}</span>
                              )}
                              {result.corsError ? (
                                <span className="endpoint-result__message">
                                  {t("apiConfig.corsError")}
                                </span>
                              ) : result.preview ? (
                                <pre className="endpoint-result__preview">{result.preview}</pre>
                              ) : (
                                <span className="endpoint-result__message">{t("apiConfig.emptyBody")}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <button
                    className="api-item__add-route"
                    onClick={(e) => openAddEndpoint(conn.getId(), e)}
                  >
                    {t("apiConfig.addRoute")}
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
        {t("apiConfig.addApi")}
      </button>
      <SwaggerImportButton onImported={handleSwaggerImport} />

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
