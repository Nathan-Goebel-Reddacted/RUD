import { useTranslation } from "react-i18next";

type Props = {
  label:    string;
  value:    string;
  keys:     string[];
  onChange: (key: string) => void;
};

export default function AxisKeySelector({ label, value, keys, onChange }: Props) {
  const { t } = useTranslation();

  if (keys.length === 0) {
    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <input
          className="form-input"
          type="text"
          placeholder={t("axisKey.placeholder")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="form-hint">{t("axisKey.fetchFirst")}</span>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select
        className="form-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t("axisKey.selectKey")}</option>
        {keys.map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>
    </div>
  );
}
