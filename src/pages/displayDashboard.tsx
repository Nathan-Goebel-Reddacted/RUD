import { useRef } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useWidgetData } from "@/hooks/useWidgetData";
import { useFullscreen } from "@/hooks/useFullscreen";
import DashboardClock from "@/components/DashboardClock";
import WidgetCard from "@/components/Widget/WidgetCard";
import type { Widget } from "@/types/widget";

const COL_GAP    = 8;
const COLS       = 12;
const ROW_HEIGHT = 80;

function ReadonlyWidget({ widget }: { widget: Widget }) {
  const dataState = useWidgetData(widget);
  return <WidgetCard widget={widget} dataState={dataState} readonly />;
}

function colToPercent(x: number) { return `${(x / COLS) * 100}%`; }
function widthPercent(w: number)  { return `calc(${(w / COLS) * 100}% - ${COL_GAP}px)`; }

export default function DisplayDashboard() {
  const containerRef                  = useRef<HTMLDivElement | null>(null);
  const currentDashboard              = useDashboardStore((s) => s.currentDashboard);
  const { isFullscreen, enter, exit } = useFullscreen();

  const maxRow     = currentDashboard.widgets.reduce(
    (max, w) => Math.max(max, w.position.y + w.position.h), 4
  );
  const gridHeight = maxRow * (ROW_HEIGHT + COL_GAP) + COL_GAP;

  return (
    <div
      ref={containerRef}
      className={`display-dashboard${isFullscreen ? " display-dashboard--fullscreen" : ""}`}
    >
      <DashboardClock />

      <button
        className="display-dashboard__fs-btn"
        onClick={() => isFullscreen ? exit() : enter(containerRef.current)}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen
          ? <Minimize2 size={16} strokeWidth={2} />
          : <Maximize2 size={16} strokeWidth={2} />}
      </button>

      {currentDashboard.widgets.length === 0 ? (
        <div className="display-dashboard__empty">
          <p>No widgets configured. Go to the <strong>Dashboard Editor</strong> to add widgets.</p>
        </div>
      ) : (
        <div
          className="display-dashboard__grid"
          style={{ position: "relative", height: gridHeight, width: "100%" }}
        >
          {currentDashboard.widgets.map((widget) => {
            const { x, y, w, h } = widget.position;
            return (
              <div
                key={widget.id}
                style={{
                  position: "absolute",
                  left:     colToPercent(x),
                  top:      y * (ROW_HEIGHT + COL_GAP),
                  width:    widthPercent(w),
                  height:   h * ROW_HEIGHT + (h - 1) * COL_GAP,
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
