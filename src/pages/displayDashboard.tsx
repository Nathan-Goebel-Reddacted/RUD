import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Maximize2, Minimize2 } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useProfileStore } from "@/stores/profileStore";
import DisplayBubbles from "@/components/Widget/DisplayBubbles";
import { useWidgetData } from "@/hooks/useWidgetData";
import { useThresholdAlert } from "@/hooks/useThresholdAlert";
import { useFullscreen } from "@/hooks/useFullscreen";
import DashboardClock from "@/components/DashboardClock";
import WidgetCard from "@/components/Widget/WidgetCard";
import AlertBanner, { type ActiveAlert } from "@/components/Widget/AlertBanner";
import type { Widget, WidgetDataState, AlertEvent } from "@/types/widget";
import InstallPromptBanner from "@/components/tool/InstallPromptBanner";

const COL_GAP              = 8;
const COLS                 = 12;
const ROW_HEIGHT           = 80;
const SCROLL_BACK_DURATION = 1200;

const STATIC_DATA_STATE: WidgetDataState = {
  data: null, loading: false, error: null, httpCode: null, fetchedAt: null,
};

function FetchingReadonlyWidget({
  widget,
  onAlert,
}: {
  widget:  Widget;
  onAlert: (event: AlertEvent) => void;
}) {
  const dataState              = useWidgetData(widget);
  const { alertColor }         = useThresholdAlert(widget, dataState, onAlert);

  return (
    <div
      className={alertColor ? "widget-alert-wrapper--alerting" : undefined}
      style={alertColor ? ({ "--alert-color": alertColor, height: "100%" } as React.CSSProperties) : { height: "100%" }}
    >
      <WidgetCard widget={widget} dataState={dataState} readonly />
    </div>
  );
}

function ReadonlyWidget({ widget, onAlert }: { widget: Widget; onAlert: (event: AlertEvent) => void }) {
  const INTERACTIVE: string[] = ["text", "form", "button", "toggle", "slider", "select", "search"];
  if (INTERACTIVE.includes(widget.config.type)) {
    return <WidgetCard widget={widget} dataState={STATIC_DATA_STATE} readonly />;
  }
  return <FetchingReadonlyWidget widget={widget} onAlert={onAlert} />;
}

function colToPercent(x: number) { return `${(x / COLS) * 100}%`; }
function widthPercent(w: number)  { return `calc(${(w / COLS) * 100}% - ${COL_GAP}px)`; }

export default function DisplayDashboard() {
  const { t } = useTranslation();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef      = useRef<HTMLDivElement | null>(null);
  const slideRef     = useRef<HTMLDivElement | null>(null); // handles translateX slide animation
  const innerGridRef = useRef<HTMLDivElement | null>(null); // handles translateY scroll

  const rafIdRef           = useRef<number>(0);
  const scrollPosRef       = useRef<number>(0);
  const maxScrollRef       = useRef<number>(0);
  const scrollSpeedRef     = useRef<number>(0);
  const loopPauseMsRef     = useRef<number>(2000);
  const isPausedRef        = useRef<boolean>(true);
  const pauseTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const atBottomSinceRef   = useRef<number | null>(null);
  const isScrollingBackRef = useRef<boolean>(false);

  const displayModeRef    = useRef<string>("timer");
  const dashboardCountRef = useRef<number>(1);
  const goToNextRef       = useRef<() => void>(() => {});

  const prevIndexRef = useRef<number>(0);

  const dashboards              = useDashboardStore((s) => s.dashboards);
  const activeDashboardIndex    = useDashboardStore((s) => s.activeDashboardIndex);
  const setActiveDashboardIndex = useDashboardStore((s) => s.setActiveDashboardIndex);
  const currentDashboard        = dashboards[activeDashboardIndex] ?? dashboards[0] ?? null;
  const profile                 = useProfileStore((s) => s.profile);
  const { isFullscreen, enter, exit } = useFullscreen();

  const [gridPixelHeight, setGridPixelHeight] = useState(0);
  const [showRotateMsg, setShowRotateMsg]     = useState(false);
  const [alerts, setAlerts]                   = useState<ActiveAlert[]>([]);
  const alertTimeoutsRef                      = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const handleAlert = useCallback((event: AlertEvent) => {
    const uid = `${event.widgetId}-${Date.now()}`;
    setAlerts((prev) => [{ ...event, uid }, ...prev].slice(0, 5));
    const t = setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.uid !== uid));
      alertTimeoutsRef.current.delete(t);
    }, 5000);
    alertTimeoutsRef.current.add(t);
  }, []);

  const dismissAlert = useCallback((uid: string) => {
    setAlerts((prev) => prev.filter((a) => a.uid !== uid));
  }, []);

  useEffect(() => {
    const set = alertTimeoutsRef.current;
    return () => { set.forEach(clearTimeout); set.clear(); };
  }, []);

  useEffect(() => {
    setAlerts([]);
  }, [activeDashboardIndex]);

  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } })
      .wakeLock.request("screen")
      .then((l) => { lock = l; })
      .catch(() => { });
    return () => { lock?.release(); };
  }, []);
  useEffect(() => {
    const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);
    if (!isMobileDevice) return;
    let mounted = true;
    const tryLock = async () => {
      try {
        await (screen.orientation as ScreenOrientation & { lock: (o: string) => Promise<void> }).lock("landscape");
      } catch {
        const mq = window.matchMedia("(orientation: portrait)");
        if (mounted) setShowRotateMsg(mq.matches);
        const handler = (e: MediaQueryListEvent) => { if (mounted) setShowRotateMsg(e.matches); };
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
      }
    };
    const cleanup = tryLock();
    return () => {
      mounted = false;
      cleanup.then((fn) => fn?.());
      screen.orientation.unlock();
    };
  }, []);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setGridPixelHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    pauseTimerRef.current = setTimeout(() => { isPausedRef.current = false; }, loopPauseMsRef.current);
    return () => { if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current); };
  }, []);

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

  useEffect(() => {
    let lastTouchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
      if (isScrollingBackRef.current) {
        isScrollingBackRef.current = false;
        if (innerGridRef.current) innerGridRef.current.style.transition = "";
      }
      atBottomSinceRef.current = null;
      isPausedRef.current = true;
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!innerGridRef.current || maxScrollRef.current <= 0) return;
      e.preventDefault();
      const touchY = e.touches[0].clientY;
      const deltaY = lastTouchY - touchY;
      lastTouchY = touchY;
      scrollPosRef.current = Math.max(0, Math.min(scrollPosRef.current + deltaY, maxScrollRef.current));
      innerGridRef.current.style.transform = `translateY(-${scrollPosRef.current}px)`;
    };
    const onTouchEnd = () => {
      pauseTimerRef.current = setTimeout(() => { isPausedRef.current = false; }, 2000);
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: false });
    window.addEventListener("touchend",   onTouchEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("touchend",   onTouchEnd);
    };
  }, []);

  useEffect(() => {
    let prevTime: number | null = null;

    const loop = (timestamp: number) => {
      if (innerGridRef.current && maxScrollRef.current === 0 && scrollPosRef.current !== 0) {
        scrollPosRef.current = 0;
        innerGridRef.current.style.transform = "";
      }

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

  const displayMode     = profile?.getDisplayMode()     ?? "timer";
  const displayInterval = profile?.getDisplayInterval() ?? 30;

  useEffect(() => {
    if (dashboards.length <= 1) return;

    const goNext = () => {
      const count = dashboards.length;
      for (let i = 1; i < count; i++) {
        const idx = (activeDashboardIndex + i) % count;
        if (dashboards[idx].showInDisplay) { setActiveDashboardIndex(idx); return; }
      }
    };

    if (displayMode === "scroll-end" && maxScrollRef.current === 0 && loopPauseMsRef.current > 0) {
      const timer = setTimeout(goNext, loopPauseMsRef.current);
      return () => clearTimeout(timer);
    }

    if (displayMode !== "timer" || displayInterval <= 0) return;
    const timer = setTimeout(goNext, displayInterval * 1000);
    return () => clearTimeout(timer);
  }, [activeDashboardIndex, displayMode, displayInterval, dashboards.length, gridPixelHeight, setActiveDashboardIndex]);

  useEffect(() => {
    const el = slideRef.current;

    const isNext = dashboards.length > 1 && (
      activeDashboardIndex > prevIndexRef.current ||
      (activeDashboardIndex === 0 && prevIndexRef.current === dashboards.length - 1)
    );
    prevIndexRef.current = activeDashboardIndex;

    if (el && dashboards.length > 1) {
      const cls = isNext ? "display-dashboard__slide--from-right" : "display-dashboard__slide--from-left";
      el.classList.add(cls);
      const onEnd = () => el.classList.remove(cls);
      el.addEventListener("animationend", onEnd, { once: true });
    }

    isScrollingBackRef.current = false;
    atBottomSinceRef.current   = null;
    scrollPosRef.current       = 0;
    if (innerGridRef.current) {
      innerGridRef.current.style.transition = "";
      innerGridRef.current.style.transform  = "translateY(0)";
    }

    isPausedRef.current = true;
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => { isPausedRef.current = false; }, loopPauseMsRef.current);
  }, [activeDashboardIndex, dashboards.length]);

  if (showRotateMsg) return <div className="display-dashboard__rotate"><p>{t("display.rotate")}</p></div>;

  if (!currentDashboard) return <div className="d-flex flex-1 align-center justify-center" style={{ opacity: 0.5 }}><p>{t("display.noDashboard")}</p></div>;

  const scrollSpeed = profile?.getScrollSpeed() ?? 0;
  const maxRow = currentDashboard.widgets.reduce(
    (max, w) => Math.max(max, w.position.y + w.position.h), 4,
  );

  const dynamicRowHeight = gridPixelHeight > 0
    ? Math.floor((gridPixelHeight - COL_GAP) / maxRow - COL_GAP)
    : ROW_HEIGHT;
  const rowHeight = Math.max(ROW_HEIGHT, dynamicRowHeight);

  const totalContentHeight = maxRow * rowHeight + maxRow * COL_GAP;
  const maxScroll = Math.max(0, totalContentHeight - gridPixelHeight);

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
  };

  return (
    <div
      ref={containerRef}
      className={`d-flex flex-col h-screen${isFullscreen ? " display-dashboard--fullscreen" : ""}`}
      style={!isFullscreen ? { background: 'var(--background-color)', overflow: 'hidden', padding: '6px', paddingTop: '10px', boxSizing: 'border-box' } : undefined}
    >
      <DashboardClock />

      <DisplayBubbles />

      <AlertBanner alerts={alerts} onDismiss={dismissAlert} />

      <button
        className="display-dashboard__fs-btn"
        onClick={() => isFullscreen ? exit() : enter(containerRef.current)}
        title={isFullscreen ? t("display.exitFullscreen") : t("display.fullscreen")}
      >
        {isFullscreen
          ? <Minimize2 size={16} strokeWidth={2} />
          : <Maximize2 size={16} strokeWidth={2} />}
      </button>

      <InstallPromptBanner />

      {currentDashboard.widgets.length === 0 ? (
        <div className="d-flex flex-1 align-center justify-center" style={{ opacity: 0.5 }}>
          <p>{t("display.noWidgets")}</p>
        </div>
      ) : (
        <div
          ref={gridRef}
          className="flex-1 position-relative overflow-hidden"
        >
          <div ref={slideRef} className="w-full h-full">
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
                    <ReadonlyWidget widget={widget} onAlert={handleAlert} />
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
