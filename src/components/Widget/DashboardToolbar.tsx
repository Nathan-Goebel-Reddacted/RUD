import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="dashboard-toolbar">
      <div className="dashboard-toolbar__left">
        <input
          className="dashboard-toolbar__title-input"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t("toolbar.titlePlaceholder")}
          aria-label={t("toolbar.titlePlaceholder")}
        />
      </div>

      <div className="dashboard-toolbar__center">
        <label className="dashboard-toolbar__label" htmlFor="refresh-interval">
          {t("toolbar.refreshLabel")}
        </label>
        <select
          id="refresh-interval"
          className="form-select dashboard-toolbar__select"
          value={refreshInterval}
          onChange={(e) => onRefreshChange(Number(e.target.value))}
        >
          <option value={10}>{t("toolbar.refresh.10s")}</option>
          <option value={30}>{t("toolbar.refresh.30s")}</option>
          <option value={60}>{t("toolbar.refresh.1min")}</option>
          <option value={300}>{t("toolbar.refresh.5min")}</option>
          <option value={0}>{t("toolbar.refresh.manual")}</option>
        </select>
      </div>

      <div className="dashboard-toolbar__right">
        <button className="btn btn--primary" onClick={onAddWidget}>
          {t("toolbar.addWidget")}
        </button>
        <button
          className="btn btn--secondary"
          onClick={() => navigate("/display")}
        >
          {t("toolbar.openDisplay")}
        </button>
      </div>
    </div>
  );
}
