import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Maximize2, Minimize2 } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useProfileStore } from "@/stores/profileStore";
import DisplayBubbles from "@/components/Widget/DisplayBubbles";
import { useWidgetData } from "@/hooks/useWidgetData";
import { useFullscreen } from "@/hooks/useFullscreen";
import DashboardClock from "@/components/DashboardClock";
import WidgetCard from "@/components/Widget/WidgetCard";
import type { Widget, WidgetDataState } from "@/types/widget";

const COL_GAP              = 8;
const COLS                 = 12;
const ROW_HEIGHT           = 80;
const SCROLL_BACK_DURATION = 1200;

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

  // DOM refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef      = useRef<HTMLDivElement | null>(null);
  const slideRef     = useRef<HTMLDivElement | null>(null); // handles translateX slide animation
  const innerGridRef = useRef<HTMLDivElement | null>(null); // handles translateY scroll

  // rAF scroll refs
  const rafIdRef           = useRef<number>(0);
  const scrollPosRef       = useRef<number>(0);
  const maxScrollRef       = useRef<number>(0);
  const scrollSpeedRef     = useRef<number>(0);
  const loopPauseMsRef     = useRef<number>(2000);
  const isPausedRef        = useRef<boolean>(false);
  const pauseTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const atBottomSinceRef   = useRef<number | null>(null);
  const isScrollingBackRef = useRef<boolean>(false);

  // Rotation refs
  const displayModeRef    = useRef<string>("timer");
  const dashboardCountRef = useRef<number>(1);
  const goToNextRef       = useRef<() => void>(() => {});

  // Slide direction tracking
  const prevIndexRef = useRef<number>(0);

  // Store reads
  const dashboards              = useDashboardStore((s) => s.dashboards);
  const activeDashboardIndex    = useDashboardStore((s) => s.activeDashboardIndex);
  const setActiveDashboardIndex = useDashboardStore((s) => s.setActiveDashboardIndex);
  const currentDashboard        = dashboards[activeDashboardIndex] ?? dashboards[0] ?? null;
  const profile                 = useProfileStore((s) => s.profile);
  const { isFullscreen, enter, exit } = useFullscreen();

  const [gridPixelHeight, setGridPixelHeight] = useState(0);

  // Measure grid container height via ResizeObserver
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setGridPixelHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pause auto-scroll for 2s on mousemove or click
  useEffect(() => {
    const pause = () => {
      isPausedRef.current = true;
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => { isPausedRef.current = false; }, 2000);
    };
    window.addEventListener("mousemove", pause);
    window.addEventListener("click",     pause);
    return () => {
      window.removeEventListener("mousemove", pause);
      window.removeEventListener("click",     pause);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  // Manual scroll via mouse wheel
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!innerGridRef.current || maxScrollRef.current <= 0) return;
      e.preventDefault();
      if (isScrollingBackRef.current) {
        isScrollingBackRef.current = false;
        innerGridRef.current.style.transition = "";
      }
      atBottomSinceRef.current = null;
      isPausedRef.current = true;
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => { isPausedRef.current = false; }, 2000);
      scrollPosRef.current = Math.max(0, Math.min(scrollPosRef.current + e.deltaY, maxScrollRef.current));
      innerGridRef.current.style.transform = `translateY(-${scrollPosRef.current}px)`;
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  // rAF scroll loop
  useEffect(() => {
    let prevTime: number | null = null;

    const loop = (timestamp: number) => {
      if (
        innerGridRef.current &&
        prevTime !== null &&
        !isPausedRef.current &&
        !isScrollingBackRef.current &&
        scrollSpeedRef.current > 0 &&
        maxScrollRef.current > 0
      ) {
        const dt = Math.min(timestamp - prevTime, 100);
        scrollPosRef.current += (scrollSpeedRef.current * dt) / 1000;

        if (scrollPosRef.current >= maxScrollRef.current) {
          scrollPosRef.current = maxScrollRef.current;
          if (atBottomSinceRef.current === null) {
            atBottomSinceRef.current = timestamp;
          } else if (timestamp - atBottomSinceRef.current >= loopPauseMsRef.current) {
            atBottomSinceRef.current = null;
            if (displayModeRef.current === "scroll-end" && dashboardCountRef.current > 1) {
              goToNextRef.current();
            } else {
              isScrollingBackRef.current = true;
              scrollPosRef.current       = 0;
              innerGridRef.current.style.transition = `transform ${SCROLL_BACK_DURATION}ms ease-in-out`;
              innerGridRef.current.style.transform  = "translateY(0)";
              setTimeout(() => {
                if (innerGridRef.current) innerGridRef.current.style.transition = "";
              }, SCROLL_BACK_DURATION);
              setTimeout(() => {
                isScrollingBackRef.current = false;
              }, SCROLL_BACK_DURATION + loopPauseMsRef.current);
            }
          }
        } else {
          atBottomSinceRef.current = null;
          innerGridRef.current.style.transform = `translateY(-${scrollPosRef.current}px)`;
        }
      }
      prevTime = timestamp;
      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, []);

  // Timer rotation
  const displayMode     = profile?.getDisplayMode()     ?? "timer";
  const displayInterval = profile?.getDisplayInterval() ?? 30;

  useEffect(() => {
    if (displayMode !== "timer" || dashboards.length <= 1 || displayInterval <= 0) return;
    // No scroll (content fits or speed=0): use loopPauseMs as display duration per dashboard
    // With scroll: use displayInterval
    const noScroll = maxScrollRef.current === 0 || scrollSpeedRef.current === 0;
    const intervalMs = noScroll && loopPauseMsRef.current > 0
      ? loopPauseMsRef.current
      : displayInterval * 1000;
    if (intervalMs <= 0) return;
    const timer = setTimeout(() => {
      const count = dashboards.length;
      for (let i = 1; i < count; i++) {
        const idx = (activeDashboardIndex + i) % count;
        if (dashboards[idx].showInDisplay) { setActiveDashboardIndex(idx); return; }
      }
    }, intervalMs);
    return () => clearTimeout(timer);
  }, [activeDashboardIndex, displayMode, displayInterval, dashboards.length, setActiveDashboardIndex]);

  // Slide animation + scroll reset on dashboard change
  useEffect(() => {
    const el = slideRef.current;

    // Determine slide direction: next → from right, prev → from left
    const isNext = dashboards.length > 1 && (
      activeDashboardIndex > prevIndexRef.current ||
      (activeDashboardIndex === 0 && prevIndexRef.current === dashboards.length - 1)
    );
    prevIndexRef.current = activeDashboardIndex;

    // Apply slide class and remove after animation
    if (el && dashboards.length > 1) {
      const cls = isNext ? "display-dashboard__slide--from-right" : "display-dashboard__slide--from-left";
      el.classList.add(cls);
      const onEnd = () => el.classList.remove(cls);
      el.addEventListener("animationend", onEnd, { once: true });
    }

    // Reset scroll
    isScrollingBackRef.current = false;
    atBottomSinceRef.current   = null;
    scrollPosRef.current       = 0;
    if (innerGridRef.current) {
      innerGridRef.current.style.transition = "";
      innerGridRef.current.style.transform  = "translateY(0)";
    }
  }, [activeDashboardIndex, dashboards.length]);

  if (!currentDashboard) return <div className="display-dashboard__empty"><p>{t("display.noDashboard")}</p></div>;

  const scrollSpeed = profile?.getScrollSpeed() ?? 0;
  const maxRow = currentDashboard.widgets.reduce(
    (max, w) => Math.max(max, w.position.y + w.position.h), 4,
  );

  const dynamicRowHeight = gridPixelHeight > 0
    ? Math.floor((gridPixelHeight - COL_GAP) / maxRow - COL_GAP)
    : ROW_HEIGHT;
  const rowHeight = Math.max(ROW_HEIGHT, dynamicRowHeight);

  const totalContentHeight = maxRow * rowHeight + (maxRow - 1) * COL_GAP;
  const maxScroll          = Math.max(0, totalContentHeight - gridPixelHeight);

  // Sync refs inline
  maxScrollRef.current      = maxScroll;
  scrollSpeedRef.current    = scrollSpeed;
  loopPauseMsRef.current    = profile?.getLoopPauseMs() ?? 2000;
  displayModeRef.current    = displayMode;
  dashboardCountRef.current = dashboards.length;
  goToNextRef.current = () => {
    const count = dashboards.length;
    for (let i = 1; i < count; i++) {
      const idx = (activeDashboardIndex + i) % count;
      if (dashboards[idx].showInDisplay) {
        setActiveDashboardIndex(idx);
        return;
      }
    }
    // All others disabled — stay on current
  };

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
          <div ref={slideRef} className="display-dashboard__slide">
            <div
              ref={innerGridRef}
              style={{
                position:   "relative",
                height:     totalContentHeight,
                willChange: scrollSpeed > 0 ? "transform" : undefined,
              }}
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
          </div>
        </div>
      )}
    </div>
  );
}
