import { useState } from "react";
import { useApiStore } from "@/stores/apiStore";
import { openModal, closeModal } from "@/components/tool/Modal";
import ApiConnectionForm, {
  MODAL_CREATE_ID,
  MODAL_EDIT_ID,
} from "@/components/ApiConfig/ApiConnectionForm";
import ApiConnection from "@/class/ApiConnection";
import "@/components/ApiConfig/ApiConfig.css";

function ApiConfig() {
  const connections = useApiStore((state) => state.connections);

  const [openId,          setOpenId]          = useState<string | null>(null);
  const [editingConnection, setEditingConnection] = useState<ApiConnection | null>(null);

  const toggleOpen = (id: string) =>
    setOpenId((prev) => (prev === id ? null : id));

  const openEdit = (conn: ApiConnection, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConnection(conn);
    openModal(MODAL_EDIT_ID);
  };

  const closeCreate = () => closeModal(MODAL_CREATE_ID);
  const closeEdit   = () => {
    closeModal(MODAL_EDIT_ID);
    setEditingConnection(null);
  };

  return (
    <div className="page-with-nav p-2 d-flex flex-col align-center">
      <ul className="api-list">
        {connections.map((conn) => {
          const isOpen    = openId === conn.getId();
          const endpoints = conn.getEndpoints();

          return (
            <li key={conn.getId()} className="api-item">
              <div
                className="api-item__header"
                onClick={() => toggleOpen(conn.getId())}
              >
                <span className="api-item__url">{conn.getBaseUrl()}</span>
                <div className="api-item__actions">
                  <button
                    className="api-item__btn"
                    title="Edit connection"
                    onClick={(e) => openEdit(conn, e)}
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
                    endpoints.map((ep) => (
                      <div key={ep.getId()} className="endpoint-row">
                        <span className="endpoint-row__method">{ep.getMethod()}</span>
                        <span className="endpoint-row__path">{ep.getPath()}</span>
                        <span style={{ opacity: 0.6, fontSize: "0.85rem" }}>{ep.getLabel()}</span>
                        <button className="api-item__btn" title="Edit route" disabled>…</button>
                      </div>
                    ))
                  )}
                  <button className="api-item__add-route" disabled>
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
          onClose={closeEdit}
        />
      )}
    </div>
  );
}

export default ApiConfig;
