import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Hash,
  Table2,
  BarChart2,
  TrendingUp,
  Type,
  Braces,
  Clock,
  RefreshCw,
  HeartPulse,
  Gauge,
  TrendingUpDown,
  StretchHorizontal,
  ChartPie,
  ClipboardList,
  MousePointer,
  ToggleLeft,
  SlidersHorizontal,
  ListFilter,
  Search,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import type { WidgetType } from "@/types/widget";
import { WIDGET_REGISTRY } from "@/components/Widget/widgetRegistry";

const ICON_MAP: Record<WidgetType, React.ReactNode> = {
  "number-card":  <Hash              size={22} strokeWidth={1.75} />,
  "table":        <Table2            size={22} strokeWidth={1.75} />,
  "bar-chart":    <BarChart2         size={22} strokeWidth={1.75} />,
  "line-chart":   <TrendingUp        size={22} strokeWidth={1.75} />,
  "text":         <Type              size={22} strokeWidth={1.75} />,
  "raw-response": <Braces            size={22} strokeWidth={1.75} />,
  "clock":        <Clock             size={22} strokeWidth={1.75} />,
  "last-update":  <RefreshCw         size={22} strokeWidth={1.75} />,
  "health-check": <HeartPulse        size={22} strokeWidth={1.75} />,
  "gauge":        <Gauge             size={22} strokeWidth={1.75} />,
  "stat":         <TrendingUpDown    size={22} strokeWidth={1.75} />,
  "progress":     <StretchHorizontal size={22} strokeWidth={1.75} />,
  "pie-chart":    <ChartPie          size={22} strokeWidth={1.75} />,
  "form":         <ClipboardList     size={22} strokeWidth={1.75} />,
  "button":       <MousePointer      size={22} strokeWidth={1.75} />,
  "toggle":       <ToggleLeft        size={22} strokeWidth={1.75} />,
  "slider":       <SlidersHorizontal size={22} strokeWidth={1.75} />,
  "select":       <ListFilter        size={22} strokeWidth={1.75} />,
  "search":       <Search            size={22} strokeWidth={1.75} />,
};

type Props = {
  onAdd: (type: WidgetType) => void;
};

export default function WidgetDrawer({ onAdd }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);

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
            {WIDGET_REGISTRY.map(({ type, labelKey, descKey }) => (
              <button
                key={type}
                className="widget-drawer__item"
                onClick={() => onAdd(type)}
              >
                <span className="widget-drawer__item-icon">{ICON_MAP[type]}</span>
                <span className="widget-drawer__item-text">
                  <span className="widget-drawer__item-label">{t(labelKey)}</span>
                  <span className="widget-drawer__item-desc">{t(descKey)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
