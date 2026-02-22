import { useState, useEffect } from "react";
import Modal from "@/components/tool/Modal";
import ApiEndpoint from "@/class/ApiEndpoint";
import { HttpMethod } from "@/enum/httpMethod";
import type { HttpMethod as HttpMethodValue } from "@/enum/httpMethod";
import { ParamType, BodyContentType } from "@/types/endpoint";
import type { PathParam, QueryParam } from "@/types/endpoint";
import { useApiStore } from "@/stores/apiStore";

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
  const addEndpoint    = useApiStore((state) => state.addEndpoint);
  const updateEndpoint = useApiStore((state) => state.updateEndpoint);
  const removeEndpoint = useApiStore((state) => state.removeEndpoint);

  const isEdit  = !!initialEndpoint;
  const modalId = isEdit ? ENDPOINT_MODAL_EDIT_ID : ENDPOINT_MODAL_CREATE_ID;

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
      isEdit ? updateEndpoint(connectionId, endpoint) : addEndpoint(connectionId, endpoint);
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

  return (
    <Modal id={modalId} width={480}>
      <div className="p-4">
        <h2 className="text-center m-2">{isEdit ? "Edit route" : "Add route"}</h2>
        <form onSubmit={handleSubmit}>

          {/* Path + Method */}
          <div className="d-flex gap-2 m-2 align-center">
            <input
              style={{ flex: 1 }}
              placeholder="/path/{id}"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              required
            />
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethodValue)}
              style={{ width: 100 }}
            >
              {Object.values(HttpMethod).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          {errors["ApiEndpoint.path.empty"] && (
            <span className="form-error">Path is required</span>
          )}
          {errors["ApiEndpoint.path.noLeadingSlash"] && (
            <span className="form-error">Path must start with /</span>
          )}

          {/* Path params — auto-detected */}
          {pathParams.length > 0 && (
            <div className="m-2">
              <div className="form-section-label">Path parameters</div>
              {pathParams.map((p, i) => (
                <div key={p.name} className="d-flex gap-2 m-1 align-center">
                  <code style={{ minWidth: 80, opacity: 0.8 }}>{`{${p.name}}`}</code>
                  <select
                    value={p.type}
                    onChange={(e) => updatePathParam(i, "type", e.target.value)}
                    style={{ width: 90 }}
                  >
                    {Object.values(ParamType).map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    placeholder="default"
                    value={p.defaultValue}
                    onChange={(e) => updatePathParam(i, "defaultValue", e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Query params */}
          <div className="m-2">
            <div className="d-flex justify-between align-center">
              <span className="form-section-label">Query parameters</span>
              <button type="button" onClick={addQueryParam}>+ Add</button>
            </div>
            {queryParams.map((p, i) => (
              <div key={i} className="d-flex gap-2 m-1 align-center">
                <input
                  placeholder="name"
                  value={p.name}
                  onChange={(e) => updateQueryParam(i, "name", e.target.value)}
                  style={{ flex: 2 }}
                />
                <select
                  value={p.type}
                  onChange={(e) => updateQueryParam(i, "type", e.target.value)}
                  style={{ width: 90 }}
                >
                  {Object.values(ParamType).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  placeholder="default"
                  value={p.defaultValue}
                  onChange={(e) => updateQueryParam(i, "defaultValue", e.target.value)}
                  style={{ flex: 2 }}
                />
                <label className="d-flex align-center gap-1" style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                  <input
                    type="checkbox"
                    checked={p.required}
                    onChange={(e) => updateQueryParam(i, "required", e.target.checked)}
                  />
                  req.
                </label>
                <button type="button" onClick={() => removeQueryParam(i)}>✕</button>
              </div>
            ))}
          </div>

          {/* Response data path */}
          <div className="m-2">
            <div className="form-section-label">Response data path</div>
            <input
              className="d-block w-full"
              placeholder="$.data  or  $.items[*]  (leave empty for root)"
              value={responseDataPath}
              onChange={(e) => setResponseDataPath(e.target.value)}
            />
          </div>

          {/* Body — POST / PUT / PATCH only */}
          {METHODS_WITH_BODY.includes(method) && (
            <div className="m-2">
              <div className="d-flex justify-between align-center">
                <span className="form-section-label">Request body</span>
                <select
                  value={bodyContentType}
                  onChange={(e) => setBodyContentType(e.target.value as typeof bodyContentType)}
                  style={{ fontSize: "0.8rem" }}
                >
                  {Object.values(BodyContentType).map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>
              <textarea
                className="d-block w-full"
                rows={5}
                placeholder={'{\n  "key": "value"\n}'}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{ fontFamily: "monospace", fontSize: "0.85rem", resize: "vertical" }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="d-flex gap-2 m-2">
            <button type="submit" style={{ flex: 1 }}>{isEdit ? "Save" : "Add"}</button>
            <button type="button" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          </div>

          {isEdit && (
            <div className="m-2">
              <button
                type="button"
                onClick={handleDelete}
                className="d-block w-full"
                style={{ color: "#e05252", borderColor: "#e05252" }}
              >
                Delete this route
              </button>
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
}

export default ApiEndpointForm;
