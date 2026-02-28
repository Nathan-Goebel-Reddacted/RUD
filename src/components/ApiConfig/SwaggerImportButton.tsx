import { useRef, useState } from "react";
import { importSwaggerFile } from "@/services/swaggerImport";
import type ApiConnection from "@/class/ApiConnection";

type Props = {
  onImported: (conn: ApiConnection) => void;
};

function SwaggerImportButton({ onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const conn = await importSwaggerFile(file);
      onImported(conn);
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
        {loading ? "Importing…" : "Import from Swagger / OpenAPI"}
      </button>
      {error && <span className="form-error" style={{ padding: "0 0.5rem" }}>{error}</span>}
    </>
  );
}

export default SwaggerImportButton;
