import { useState } from "react";
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
  type:  WidgetType;
  label: string;
  icon:  React.ReactNode;
  description: string;
};

const ITEMS: DrawerItem[] = [
  {
    type:        "number-card",
    label:       "Number",
    icon:        <Hash size={22} strokeWidth={1.75} />,
    description: "Single numeric value",
  },
  {
    type:        "table",
    label:       "Table",
    icon:        <Table2 size={22} strokeWidth={1.75} />,
    description: "List of rows from array",
  },
  {
    type:        "bar-chart",
    label:       "Bar Chart",
    icon:        <BarChart2 size={22} strokeWidth={1.75} />,
    description: "Compare values by category",
  },
  {
    type:        "line-chart",
    label:       "Line Chart",
    icon:        <TrendingUp size={22} strokeWidth={1.75} />,
    description: "Trend over time or sequence",
  },
  {
    type:        "text",
    label:       "Text",
    icon:        <Type size={22} strokeWidth={1.75} />,
    description: "Static text block",
  },
  {
    type:        "raw-response",
    label:       "Raw Response",
    icon:        <Braces size={22} strokeWidth={1.75} />,
    description: "Full JSON response",
  },
];

type Props = {
  onAdd: (type: WidgetType) => void;
};

export default function WidgetDrawer({ onAdd }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className={`widget-drawer${open ? " widget-drawer--open" : ""}`}>
      <button
        className="widget-drawer__toggle"
        onClick={() => setOpen((o) => !o)}
        title={open ? "Collapse panel" : "Add widget"}
      >
        {open ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {open && (
        <div className="widget-drawer__content">
          <p className="widget-drawer__heading">Add widget</p>
          <div className="widget-drawer__list">
            {ITEMS.map((item) => (
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
