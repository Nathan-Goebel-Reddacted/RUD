import { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/tool/Modal";
import ApiConnection from "@/class/ApiConnection";
import { AuthType } from "@/enum/authType";
import type { AuthType as AuthTypeValue } from "@/enum/authType";
import { useApiStore } from "@/stores/apiStore";
import ConfirmDeleteButton from "@/components/tool/ConfirmDeleteButton";
import FormField from "@/components/tool/FormField";

export const MODAL_CREATE_ID = "ApiConnectionCreate";
export const MODAL_EDIT_ID   = "ApiConnectionEdit";

type HeaderRow = { key: string; value: string };

type Props = {
  onClose: () => void;
  initialConnection?: ApiConnection;
};

function ApiConnectionForm({ onClose, initialConnection }: Props) {
  const { t } = useTranslation();
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
  const [healthCheckEndpointId, setHealthCheckEndpointId] = useState<string | null>(
    initialConnection?.getHealthCheckEndpointId() ?? null
  );
  const endpoints = isEdit ? initialConnection!.getEndpoints() : [];
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
        const epIds = initialConnection!.getEndpoints().map((e) => e.getId());
        connection.setHealthCheckEndpointId(
          healthCheckEndpointId && epIds.includes(healthCheckEndpointId)
            ? healthCheckEndpointId : null
        );
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
    [AuthType.BEARER]:  t("apiConnection.authValue.bearer"),
    [AuthType.API_KEY]: t("apiConnection.authValue.apiKey"),
    [AuthType.BASIC]:   t("apiConnection.authValue.basic"),
  };

  return (
    <Modal id={modalId} width={480}>
      <div className="p-4">
        <h2 className="text-center m-2">
          {isEdit ? t("apiConnection.titleEdit") : t("apiConnection.titleAdd")}
        </h2>
        <form onSubmit={handleSubmit}>
          <FormField error={errors["ApiConnection.label.tooShort"] ? t("apiConnection.labelError") : undefined}>
            <input
              className="d-block w-full"
              placeholder={t("apiConnection.labelPlaceholder")}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </FormField>

          <FormField error={errors["ApiConnection.baseUrl.invalid"] ? t("apiConnection.baseUrlError") : undefined}>
            <input
              className="d-block w-full"
              placeholder={t("apiConnection.baseUrlPlaceholder")}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              required
            />
          </FormField>

          <select
            className="d-block w-full m-2"
            value={authType}
            onChange={(e) => {
              setAuthType(e.target.value as AuthTypeValue);
              setAuthValue("");
            }}
          >
            <option value={AuthType.NONE}>{t("apiConnection.auth.none")}</option>
            <option value={AuthType.BEARER}>{t("apiConnection.auth.bearer")}</option>
            <option value={AuthType.API_KEY}>{t("apiConnection.auth.apiKey")}</option>
            <option value={AuthType.BASIC}>{t("apiConnection.auth.basic")}</option>
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
              <span>{t("apiConnection.customHeaders")}</span>
              <button type="button" onClick={addHeaderRow}>{t("apiConnection.addHeader")}</button>
            </div>
            {headers.map((row, i) => (
              <div key={i} className="d-flex gap-2 m-1 align-center">
                <input
                  placeholder={t("apiConnection.headerName")}
                  value={row.key}
                  onChange={(e) => updateHeader(i, "key", e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  placeholder={t("apiConnection.headerValue")}
                  value={row.value}
                  onChange={(e) => updateHeader(i, "value", e.target.value)}
                  style={{ flex: 2 }}
                />
                <button type="button" onClick={() => removeHeader(i)}>✕</button>
              </div>
            ))}
          </div>

          {isEdit && (
            <FormField label={t("apiConnection.healthCheck")}>
              <select
                className="d-block w-full"
                value={healthCheckEndpointId ?? ""}
                onChange={(e) => setHealthCheckEndpointId(e.target.value || null)}
              >
                <option value="">{t("apiConnection.noHealthCheck")}</option>
                {endpoints.map((ep) => (
                  <option key={ep.getId()} value={ep.getId()}>
                    {ep.getMethod()} {ep.getPath()}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <div className="d-flex gap-2 m-2">
            <button type="submit" style={{ flex: 1 }}>
              {isEdit ? t("apiConnection.saveChanges") : t("apiConnection.save")}
            </button>
            <button type="button" onClick={onClose} style={{ flex: 1 }}>
              {t("apiConnection.cancel")}
            </button>
          </div>

          {isEdit && (
            <div className="m-2">
              <ConfirmDeleteButton
                onConfirm={handleDelete}
                label={t("apiConnection.delete")}
                confirmLabel={t("apiConnection.confirmDelete")}
              />
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
}

export default ApiConnectionForm;
