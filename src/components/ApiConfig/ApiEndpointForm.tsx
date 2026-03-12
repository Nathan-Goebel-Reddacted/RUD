import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/tool/Modal";
import ApiEndpoint from "@/class/ApiEndpoint";
import { HttpMethod } from "@/enum/httpMethod";
import type { HttpMethod as HttpMethodValue } from "@/enum/httpMethod";
import { ParamType, BodyContentType } from "@/types/endpoint";
import type { PathParam, QueryParam } from "@/types/endpoint";
import { useApiStore } from "@/stores/apiStore";
import ConfirmDeleteButton from "@/components/tool/ConfirmDeleteButton";

export const ENDPOINT_MODAL_CREATE_ID = "ApiEndpointCreate";
export const ENDPOINT_MODAL_EDIT_ID   = "ApiEndpointEdit";

const METHODS_WITH_BODY: HttpMethodValue[] = [
  HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH,
];

type Props = {
  connectionId: string;
  onClose: () => void;
  initialEndpoint?: ApiEndpoint;
};

function ApiEndpointForm({ connectionId, onClose, initialEndpoint }: Props) {
  const { t } = useTranslation();
  const addEndpoint    = useApiStore((state) => state.addEndpoint);
  const updateEndpoint = useApiStore((state) => state.updateEndpoint);
  const removeEndpoint = useApiStore((state) => state.removeEndpoint);

  const isEdit  = !!initialEndpoint;
  const modalId = isEdit ? ENDPOINT_MODAL_EDIT_ID : ENDPOINT_MODAL_CREATE_ID;

  const [label,            setLabel]            = useState(initialEndpoint?.getLabel()            ?? "");
  const [path,             setPath]             = useState(initialEndpoint?.getPath()             ?? "/");
  const [method,           setMethod]           = useState<HttpMethodValue>(initialEndpoint?.getMethod() ?? HttpMethod.GET);
  const [pathParams,       setPathParams]       = useState<PathParam[]>(initialEndpoint?.getPathParams()   ?? []);
  const [queryParams,      setQueryParams]      = useState<QueryParam[]>(initialEndpoint?.getQueryParams() ?? []);
  const [responseDataPath, setResponseDataPath] = useState(initialEndpoint?.getResponseDataPath() ?? "");
  const [body,             setBody]             = useState(initialEndpoint?.getBody()             ?? "");
  const [bodyContentType,  setBodyContentType]  = useState(initialEndpoint?.getBodyContentType()  ?? BodyContentType.JSON);
  const [errors,           setErrors]           = useState<Record<string, string>>({});

  // Re-sync path params when path changes
  useEffect(() => {
    const matches = [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    setPathParams((prev) =>
      matches.map((name) => prev.find((p) => p.name === name) ?? { name, type: ParamType.STRING, defaultValue: "" })
    );
  }, [path]);

  const updatePathParam = (index: number, field: keyof PathParam, value: string) => {
    setPathParams((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const addQueryParam = () => {
    setQueryParams((prev) => [...prev, { name: "", type: ParamType.STRING, required: false, defaultValue: "" }]);
  };
  const removeQueryParam = (index: number) => {
    setQueryParams((prev) => prev.filter((_, i) => i !== index));
  };
  const updateQueryParam = (index: number, field: keyof QueryParam, value: string | boolean) => {
    setQueryParams((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = new ApiEndpoint();
    endpoint.createAnApiEndpoint(path, method, isEdit ? initialEndpoint!.getId() : undefined);
    endpoint.setLabel(label);
    endpoint.setPathParams(pathParams);
    endpoint.setQueryParams(queryParams);
    endpoint.setResponseDataPath(responseDataPath);
    if (METHODS_WITH_BODY.includes(method)) {
      endpoint.setBody(body);
      endpoint.setBodyContentType(bodyContentType);
    }

    const result = endpoint.isApiEndpointValid();
    if (result.isSuccess()) {
      setErrors({});
      if (isEdit) { updateEndpoint(connectionId, endpoint); } else { addEndpoint(connectionId, endpoint); }
      onClose();
    } else {
      const errs: Record<string, string> = {};
      result.getAllReason().forEach((r) => { errs[r.getreasonCode()] = r.getreasonMessage(); });
      setErrors(errs);
    }
  };

  const handleDelete = () => {
    removeEndpoint(connectionId, initialEndpoint!.getId());
    onClose();
  };

  const pathError =
    errors["ApiEndpoint.path.empty"]          ? t("apiEndpoint.pathErrorEmpty") :
    errors["ApiEndpoint.path.noLeadingSlash"] ? t("apiEndpoint.pathErrorNoSlash") :
    undefined;

  return (
    <Modal id={modalId} width={640}>
      <div className="p-4">
        <h2 className="text-center m-2" style={{ marginTop: 0 }}>
          {isEdit ? t("apiEndpoint.titleEdit") : t("apiEndpoint.titleAdd")}
        </h2>
        <form onSubmit={handleSubmit}>

          {/* Label (optional) */}
          <div className="endpoint-form__section">
            <input
              className="d-block w-full"
              placeholder={t("apiEndpoint.labelPlaceholder")}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              style={{ boxSizing: "border-box" }}
            />
          </div>

          {/* Route bar — method badge + path */}
          <div className={`endpoint-form__route-bar method--${method.toLowerCase()}`}>
            {/* Path input first in DOM for correct focus order */}
            <input
              className="endpoint-form__path-input"
              placeholder={t("apiEndpoint.pathPlaceholder")}
              value={path}
              onChange={(e) => setPath(e.target.value)}
              required
              style={{ order: 2 }}
            />
            <div className="endpoint-form__method-wrapper" style={{ order: 1 }}>
              <select
                className={`endpoint-form__method-select method--${method.toLowerCase()}`}
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethodValue)}
              >
                {Object.values(HttpMethod).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          {pathError && <span className="form-error" style={{ marginTop: "-0.25rem", display: "block" }}>{pathError}</span>}

          {/* Path params — auto-detected from {param} in path */}
          {pathParams.length > 0 && (
            <div className="endpoint-form__section">
              <div className="form-section-label">{t("apiEndpoint.pathParams")}</div>
              <div className="endpoint-form__table endpoint-form__table--path">
                <div className="endpoint-form__table-header">
                  <span>{t("apiEndpoint.table.name")}</span>
                  <span>{t("apiEndpoint.table.type")}</span>
                  <span>{t("apiEndpoint.table.default")}</span>
                </div>
                {pathParams.map((p, i) => (
                  <div key={p.name} className="endpoint-form__table-row">
                    <span className="endpoint-form__param-name">{`{${p.name}}`}</span>
                    <select
                      value={p.type}
                      onChange={(e) => updatePathParam(i, "type", e.target.value)}
                    >
                      {Object.values(ParamType).map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <input
                      placeholder={t("apiEndpoint.defaultPlaceholder")}
                      value={p.defaultValue}
                      onChange={(e) => updatePathParam(i, "defaultValue", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query params */}
          <div className="endpoint-form__section">
            <div className="d-flex justify-between align-center">
              <span className="form-section-label">{t("apiEndpoint.queryParams")}</span>
              <button type="button" className="endpoint-form__add-btn" onClick={addQueryParam}>
                {t("apiEndpoint.addQueryParam")}
              </button>
            </div>
            {queryParams.length > 0 && (
              <div className="endpoint-form__table endpoint-form__table--query">
                <div className="endpoint-form__table-header">
                  <span>{t("apiEndpoint.table.name")}</span>
                  <span>{t("apiEndpoint.table.type")}</span>
                  <span style={{ textAlign: "center" }}>{t("apiEndpoint.table.required")}</span>
                  <span>{t("apiEndpoint.table.default")}</span>
                  <span></span>
                </div>
                {queryParams.map((p, i) => (
                  <div key={i} className="endpoint-form__table-row">
                    <input
                      placeholder={t("apiEndpoint.namePlaceholder")}
                      value={p.name}
                      onChange={(e) => updateQueryParam(i, "name", e.target.value)}
                    />
                    <select
                      value={p.type}
                      onChange={(e) => updateQueryParam(i, "type", e.target.value)}
                    >
                      {Object.values(ParamType).map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <input
                      type="checkbox"
                      checked={p.required}
                      onChange={(e) => updateQueryParam(i, "required", e.target.checked)}
                    />
                    <input
                      placeholder={t("apiEndpoint.defaultPlaceholder")}
                      value={p.defaultValue}
                      onChange={(e) => updateQueryParam(i, "defaultValue", e.target.value)}
                    />
                    <button
                      type="button"
                      className="endpoint-form__row-remove"
                      onClick={() => removeQueryParam(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Response data path */}
          <div className="endpoint-form__section">
            <div className="form-section-label">{t("apiEndpoint.dataPath")}</div>
            <input
              className="d-block w-full"
              placeholder={t("apiEndpoint.dataPathPlaceholder")}
              value={responseDataPath}
              onChange={(e) => setResponseDataPath(e.target.value)}
              style={{ boxSizing: "border-box" }}
            />
          </div>

          {/* Body — POST / PUT / PATCH only */}
          {METHODS_WITH_BODY.includes(method) && (
            <div className="endpoint-form__section">
              <div className="d-flex justify-between align-center">
                <span className="form-section-label">{t("apiEndpoint.body")}</span>
                <select
                  className="endpoint-form__content-type"
                  value={bodyContentType}
                  onChange={(e) => setBodyContentType(e.target.value as typeof bodyContentType)}
                >
                  {Object.values(BodyContentType).map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>
              <textarea
                className="endpoint-form__body-editor"
                rows={5}
                placeholder={bodyContentType === BodyContentType.JSON
                  ? t("apiEndpoint.bodyJsonPlaceholder")
                  : t("apiEndpoint.bodyFormPlaceholder")
                }
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          )}

          {/* Actions */}
          <div className={`endpoint-form__actions method--${method.toLowerCase()}`}>
            <button
              type="submit"
              className="endpoint-form__submit"
            >
              {isEdit ? t("apiEndpoint.save") : t("apiEndpoint.addRoute")}
            </button>
            <button type="button" onClick={onClose} style={{ flex: 1 }}>
              {t("apiEndpoint.cancel")}
            </button>
          </div>

          {isEdit && (
            <div style={{ marginTop: "0.75rem" }}>
              <ConfirmDeleteButton
                onConfirm={handleDelete}
                label={t("apiEndpoint.delete")}
                confirmLabel={t("apiEndpoint.confirmDelete")}
              />
            </div>
          )}

        </form>
      </div>
    </Modal>
  );
}

export default ApiEndpointForm;
