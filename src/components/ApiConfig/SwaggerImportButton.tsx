import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { importSwaggerFile } from "@/services/swaggerImport";
import type ApiConnection from "@/class/ApiConnection";
import type { ImportResult } from "@/services/swaggerImport";

type Props = {
  onImported: (conn: ApiConnection) => void;
};

function SwaggerImportButton({ onImported }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [warnings, setWarnings] = useState<ImportResult["warnings"]>([]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setWarnings([]);

    try {
      const result = await importSwaggerFile(file);
      setWarnings(result.warnings);
      onImported(result.connection);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json,.yaml,.yml"
        hidden
        onChange={handleFile}
      />
      <button
        className="api-config__import-swagger"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? t("swagger.importing") : t("swagger.import")}
      </button>
      {error && <span className="form-error" style={{ padding: "0 0.5rem" }}>{error}</span>}
      {warnings.map((key) => (
        <span key={key} className="form-warning" style={{ padding: "0 0.5rem" }}>{t(key)}</span>
      ))}
    </>
  );
}

export default SwaggerImportButton;
