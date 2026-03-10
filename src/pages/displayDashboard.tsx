import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Maximize2, Minimize2 } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import DisplayBubbles from "@/components/Widget/DisplayBubbles";
import { useWidgetData } from "@/hooks/useWidgetData";
import { useFullscreen } from "@/hooks/useFullscreen";
import DashboardClock from "@/components/DashboardClock";
import WidgetCard from "@/components/Widget/WidgetCard";
import type { Widget, WidgetDataState } from "@/types/widget";

const COL_GAP    = 8;
const COLS       = 12;
const ROW_HEIGHT = 80;

const STATIC_DATA_STATE: WidgetDataState = {
  data: null, loading: false, error: null, httpCode: null, fetchedAt: null,
};

function FetchingReadonlyWidget({ widget }: { widget: Widget }) {
  const dataState = useWidgetData(widget);
  return <WidgetCard widget={widget} dataState={dataState} readonly />;
}

function ReadonlyWidget({ widget }: { widget: Widget }) {
  if (widget.config.type === "text") {
    return <WidgetCard widget={widget} dataState={STATIC_DATA_STATE} readonly />;
  }
  return <FetchingReadonlyWidget widget={widget} />;
}

function colToPercent(x: number) { return `${(x / COLS) * 100}%`; }
function widthPercent(w: number)  { return `calc(${(w / COLS) * 100}% - ${COL_GAP}px)`; }

export default function DisplayDashboard() {
  const { t } = useTranslation();
  const containerRef                  = useRef<HTMLDivElement | null>(null);
  const gridRef                       = useRef<HTMLDivElement | null>(null);
  const dashboards                    = useDashboardStore((s) => s.dashboards);
  const activeDashboardIndex          = useDashboardStore((s) => s.activeDashboardIndex);
  const currentDashboard              = dashboards[activeDashboardIndex] ?? dashboards[0] ?? null;
  const { isFullscreen, enter, exit } = useFullscreen();
  const [gridPixelHeight, setGridPixelHeight] = useState(0);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setGridPixelHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!currentDashboard) return <div className="display-dashboard__empty"><p>{t("display.noDashboard")}</p></div>;

  const maxRow    = currentDashboard.widgets.reduce(
    (max, w) => Math.max(max, w.position.y + w.position.h), 4
  );
  // Dynamic row height: fill the available grid height exactly
  const rowHeight = gridPixelHeight > 0
    ? Math.floor((gridPixelHeight - COL_GAP) / maxRow - COL_GAP)
    : ROW_HEIGHT;

  return (
    <div
      ref={containerRef}
      className={`display-dashboard${isFullscreen ? " display-dashboard--fullscreen" : ""}`}
    >
      <DashboardClock />

      <DisplayBubbles />

      <button
        className="display-dashboard__fs-btn"
        onClick={() => isFullscreen ? exit() : enter(containerRef.current)}
        title={isFullscreen ? t("display.exitFullscreen") : t("display.fullscreen")}
      >
        {isFullscreen
          ? <Minimize2 size={16} strokeWidth={2} />
          : <Maximize2 size={16} strokeWidth={2} />}
      </button>

      {currentDashboard.widgets.length === 0 ? (
        <div className="display-dashboard__empty">
          <p>{t("display.noWidgets")}</p>
        </div>
      ) : (
        <div
          ref={gridRef}
          className="display-dashboard__grid"
          style={{ width: "100%" }}
        >
          {currentDashboard.widgets.map((widget) => {
            const { x, y, w, h } = widget.position;
            return (
              <div
                key={widget.id}
                style={{
                  position: "absolute",
                  left:     colToPercent(x),
                  top:      y * (rowHeight + COL_GAP),
                  width:    widthPercent(w),
                  height:   h * rowHeight + (h - 1) * COL_GAP,
                }}
              >
                <ReadonlyWidget widget={widget} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
