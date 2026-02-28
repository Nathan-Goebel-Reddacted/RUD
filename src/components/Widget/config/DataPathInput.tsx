import { useState, useEffect } from "react";
import { extractData } from "@/services/widgetFetch";

type Props = {
  value:    string;
  onChange: (value: string) => void;
  preview?: unknown; // raw API response to preview path result
};

export default function DataPathInput({ value, onChange, preview }: Props) {
  const [previewResult, setPreviewResult] = useState<string | null>(null);

  useEffect(() => {
    if (preview === undefined || preview === null) {
      setPreviewResult(null);
      return;
    }
    if (!value.trim()) {
      setPreviewResult("(using full response)");
      return;
    }
    const { value: extracted, error } = extractData(preview, value);
    if (error) {
      setPreviewResult(`Error: ${error}`);
    } else {
      try {
        const str = JSON.stringify(extracted, null, 0);
        setPreviewResult(str.length > 120 ? str.slice(0, 117) + "..." : str);
      } catch {
        setPreviewResult(String(extracted));
      }
    }
  }, [value, preview]);

  return (
    <div className="form-group">
      <label className="form-label">Data Path (JSONPath)</label>
      <input
        className="form-input"
        type="text"
        placeholder="e.g. $.data or $.results[0].value"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {previewResult !== null && (
        <span className="form-hint">
          Preview: <code>{previewResult}</code>
        </span>
      )}
      <span className="form-hint">Leave empty to use the full response.</span>
    </div>
  );
}
