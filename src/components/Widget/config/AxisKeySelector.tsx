type Props = {
  label:    string;
  value:    string;
  keys:     string[];
  onChange: (key: string) => void;
};

export default function AxisKeySelector({ label, value, keys, onChange }: Props) {
  if (keys.length === 0) {
    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <input
          className="form-input"
          type="text"
          placeholder="key name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="form-hint">Fetch data first to get key suggestions.</span>
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
        <option value="">— Select a key —</option>
        {keys.map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>
    </div>
  );
}
