import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { extractData } from "@/services/widgetFetch";

type Props = {
  value:    string;
  onChange: (value: string) => void;
  preview?: unknown; // raw API response to preview path result
};

export default function DataPathInput({ value, onChange, preview }: Props) {
  const { t } = useTranslation();
  const [previewResult, setPreviewResult] = useState<string | null>(null);

  useEffect(() => {
    if (preview === undefined || preview === null) {
      setPreviewResult(null);
      return;
    }
    if (!value.trim()) {
      setPreviewResult(t("dataPath.fullResponsePreview"));
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
  }, [value, preview, t]);

  return (
    <div className="form-group">
      <label className="form-label">{t("dataPath.label")}</label>
      <input
        className="form-input"
        type="text"
        placeholder={t("dataPath.placeholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {previewResult !== null && (
        <span className="form-hint">
          Preview: <code>{previewResult}</code>
        </span>
      )}
      <span className="form-hint">{t("dataPath.fullResponseHint")}</span>
    </div>
  );
}
