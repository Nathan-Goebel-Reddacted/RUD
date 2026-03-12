import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { LastUpdateConfig } from "@/types/widget";

function formatRelative(fetchedAt: number): string {
  const diff = Math.floor((Date.now() - fetchedAt) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

type Props = {
  config:    LastUpdateConfig;
  fetchedAt: number | null;
};

export default function LastUpdateWidget({ config, fetchedAt }: Props) {
  const { t } = useTranslation();
  const [, tick] = useState(0);

  useEffect(() => {
    if (config.displayFormat !== "relative") return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [config.displayFormat]);

  if (fetchedAt === null) {
    return (
      <div className="widget-last-update widget-last-update--empty">
        {t("widgetLastUpdate.never")}
      </div>
    );
  }

  const display = config.displayFormat === "relative"
    ? formatRelative(fetchedAt)
    : new Date(fetchedAt).toLocaleTimeString();

  return (
    <div className="widget-last-update">
      <span className="widget-last-update__time">{display}</span>
    </div>
  );
}
