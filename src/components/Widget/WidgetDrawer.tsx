import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Hash,
  Table2,
  BarChart2,
  TrendingUp,
  Type,
  Braces,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import type { WidgetType } from "@/types/widget";

type DrawerItem = {
  type:        WidgetType;
  label:       string;
  icon:        React.ReactNode;
  description: string;
};

type Props = {
  onAdd: (type: WidgetType) => void;
};

export default function WidgetDrawer({ onAdd }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);

  const items: DrawerItem[] = [
    {
      type:        "number-card",
      label:       t("widgetDrawer.types.numberCard"),
      icon:        <Hash size={22} strokeWidth={1.75} />,
      description: t("widgetDrawer.desc.numberCard"),
    },
    {
      type:        "table",
      label:       t("widgetDrawer.types.table"),
      icon:        <Table2 size={22} strokeWidth={1.75} />,
      description: t("widgetDrawer.desc.table"),
    },
    {
      type:        "bar-chart",
      label:       t("widgetDrawer.types.barChart"),
      icon:        <BarChart2 size={22} strokeWidth={1.75} />,
      description: t("widgetDrawer.desc.barChart"),
    },
    {
      type:        "line-chart",
      label:       t("widgetDrawer.types.lineChart"),
      icon:        <TrendingUp size={22} strokeWidth={1.75} />,
      description: t("widgetDrawer.desc.lineChart"),
    },
    {
      type:        "text",
      label:       t("widgetDrawer.types.text"),
      icon:        <Type size={22} strokeWidth={1.75} />,
      description: t("widgetDrawer.desc.text"),
    },
    {
      type:        "raw-response",
      label:       t("widgetDrawer.types.rawResponse"),
      icon:        <Braces size={22} strokeWidth={1.75} />,
      description: t("widgetDrawer.desc.rawResponse"),
    },
  ];

  return (
    <div className={`widget-drawer${open ? " widget-drawer--open" : ""}`}>
      <button
        className="widget-drawer__toggle"
        onClick={() => setOpen((o) => !o)}
        title={open ? t("widgetDrawer.collapse") : t("widgetDrawer.heading")}
      >
        {open ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {open && (
        <div className="widget-drawer__content">
          <p className="widget-drawer__heading">{t("widgetDrawer.heading")}</p>
          <div className="widget-drawer__list">
            {items.map((item) => (
              <button
                key={item.type}
                className="widget-drawer__item"
                onClick={() => onAdd(item.type)}
              >
                <span className="widget-drawer__item-icon">{item.icon}</span>
                <span className="widget-drawer__item-text">
                  <span className="widget-drawer__item-label">{item.label}</span>
                  <span className="widget-drawer__item-desc">{item.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
