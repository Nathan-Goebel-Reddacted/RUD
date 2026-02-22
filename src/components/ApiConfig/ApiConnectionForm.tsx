import { useState } from "react";
import Modal from "@/components/tool/Modal";
import ApiConnection from "@/class/ApiConnection";
import { AuthType } from "@/enum/authType";
import type { AuthType as AuthTypeValue } from "@/enum/authType";
import { useApiStore } from "@/stores/apiStore";

export const MODAL_CREATE_ID = "ApiConnectionCreate";
export const MODAL_EDIT_ID   = "ApiConnectionEdit";

type HeaderRow = { key: string; value: string };

type Props = {
  onClose: () => void;
  initialConnection?: ApiConnection;
};

function ApiConnectionForm({ onClose, initialConnection }: Props) {
  const addConnection    = useApiStore((state) => state.addConnection);
  const updateConnection = useApiStore((state) => state.updateConnection);
  const removeConnection = useApiStore((state) => state.removeConnection);

  const isEdit = !!initialConnection;
  const modalId = isEdit ? MODAL_EDIT_ID : MODAL_CREATE_ID;

  const [label,     setLabel]     = useState(initialConnection?.getLabel()    ?? "");
  const [baseUrl,   setBaseUrl]   = useState(initialConnection?.getBaseUrl()  ?? "");
  const [authType,  setAuthType]  = useState<AuthTypeValue>(
    initialConnection?.getAuthType() ?? AuthType.NONE
  );
  const [authValue, setAuthValue] = useState(initialConnection?.getAuthValue() ?? "");
  const [headers,   setHeaders]   = useState<HeaderRow[]>(
    initialConnection
      ? Object.entries(initialConnection.getHeaders()).map(([key, value]) => ({ key, value }))
      : []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addHeaderRow = () => setHeaders((prev) => [...prev, { key: "", value: "" }]);

  const updateHeader = (index: number, field: "key" | "value", val: string) => {
    setHeaders((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: val } : row))
    );
  };

  const removeHeader = (index: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const connection = new ApiConnection();
    connection.createAnApiConnection(
      label,
      baseUrl,
      isEdit ? initialConnection!.getId() : undefined
    );
    connection.setAuthType(authType);
    if (authType !== AuthType.NONE) connection.setAuthValue(authValue);
    for (const row of headers) {
      if (row.key.trim()) connection.setHeader(row.key.trim(), row.value);
    }
    // preserve existing endpoints when editing
    if (isEdit) {
      for (const ep of initialConnection!.getEndpoints()) {
        connection.addEndpoint(ep);
      }
    }

    const result = connection.isApiConnectionValid();
    if (result.isSuccess()) {
      setErrors({});
      if (isEdit) {
        updateConnection(connection);
      } else {
        addConnection(connection);
      }
      onClose();
    } else {
      const errs: Record<string, string> = {};
      result.getAllReason().forEach((r) => { errs[r.getreasonCode()] = r.getreasonMessage(); });
      setErrors(errs);
    }
  };

  const handleDelete = () => {
    removeConnection(initialConnection!.getId());
    onClose();
  };

  const authValuePlaceholder: Record<AuthTypeValue, string> = {
    [AuthType.NONE]:    "",
    [AuthType.BEARER]:  "Bearer token",
    [AuthType.API_KEY]: "API key value",
    [AuthType.BASIC]:   "username:password",
  };

  return (
    <Modal id={modalId} width={480}>
      <div className="p-4">
        <h2 className="text-center m-2">
          {isEdit ? "Edit API Connection" : "Add API Connection"}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            className="d-block w-full m-2"
            placeholder="Connection label (min. 3 chars)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
          {errors["ApiConnection.label.tooShort"] && (
            <span className="form-error">Label must be at least 3 characters</span>
          )}

          <input
            className="d-block w-full m-2"
            placeholder="Base URL (https://api.example.com)"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            required
          />
          {errors["ApiConnection.baseUrl.invalid"] && (
            <span className="form-error">Enter a valid http/https URL</span>
          )}

          <select
            className="d-block w-full m-2"
            value={authType}
            onChange={(e) => {
              setAuthType(e.target.value as AuthTypeValue);
              setAuthValue("");
            }}
          >
            <option value={AuthType.NONE}>No auth</option>
            <option value={AuthType.BEARER}>Bearer token</option>
            <option value={AuthType.API_KEY}>API Key</option>
            <option value={AuthType.BASIC}>Basic auth (user:password)</option>
          </select>

          {authType !== AuthType.NONE && (
            <input
              className="d-block w-full m-2"
              placeholder={authValuePlaceholder[authType]}
              value={authValue}
              onChange={(e) => setAuthValue(e.target.value)}
            />
          )}

          <div className="m-2">
            <div className="d-flex justify-between align-center">
              <span>Custom headers</span>
              <button type="button" onClick={addHeaderRow}>+ Add header</button>
            </div>
            {headers.map((row, i) => (
              <div key={i} className="d-flex gap-2 m-1 align-center">
                <input
                  placeholder="Header name"
                  value={row.key}
                  onChange={(e) => updateHeader(i, "key", e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  placeholder="Value"
                  value={row.value}
                  onChange={(e) => updateHeader(i, "value", e.target.value)}
                  style={{ flex: 2 }}
                />
                <button type="button" onClick={() => removeHeader(i)}>✕</button>
              </div>
            ))}
          </div>

          <div className="d-flex gap-2 m-2">
            <button type="submit" style={{ flex: 1 }}>
              {isEdit ? "Save changes" : "Save"}
            </button>
            <button type="button" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
          </div>

          {isEdit && (
            <div className="m-2">
              <button
                type="button"
                onClick={handleDelete}
                className="d-block w-full"
                style={{ color: "#e05252", borderColor: "#e05252" }}
              >
                Delete this connection
              </button>
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
}

export default ApiConnectionForm;
