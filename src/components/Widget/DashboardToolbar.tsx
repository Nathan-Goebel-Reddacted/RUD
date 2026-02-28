import { useNavigate } from "react-router";

type Props = {
  title:           string;
  refreshInterval: number;
  onTitleChange:   (title: string) => void;
  onRefreshChange: (seconds: number) => void;
  onAddWidget:     () => void;
};

export default function DashboardToolbar({
  title,
  refreshInterval,
  onTitleChange,
  onRefreshChange,
  onAddWidget,
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-toolbar">
      <div className="dashboard-toolbar__left">
        <input
          className="dashboard-toolbar__title-input"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Dashboard title"
          aria-label="Dashboard title"
        />
      </div>

      <div className="dashboard-toolbar__center">
        <label className="dashboard-toolbar__label" htmlFor="refresh-interval">
          Refresh every
        </label>
        <select
          id="refresh-interval"
          className="form-select dashboard-toolbar__select"
          value={refreshInterval}
          onChange={(e) => onRefreshChange(Number(e.target.value))}
        >
          <option value={10}>10 s</option>
          <option value={30}>30 s</option>
          <option value={60}>1 min</option>
          <option value={300}>5 min</option>
          <option value={0}>Manual</option>
        </select>
      </div>

      <div className="dashboard-toolbar__right">
        <button className="btn btn--primary" onClick={onAddWidget}>
          + Add widget
        </button>
        <button
          className="btn btn--secondary"
          onClick={() => navigate("/display")}
          title="Open fullscreen display"
        >
          ▶ Display
        </button>
      </div>
    </div>
  );
}
