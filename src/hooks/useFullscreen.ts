import { useState, useCallback, useEffect, useRef } from "react";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);

  const enter = useCallback(async (el?: HTMLElement | null) => {
    const target = el ?? document.documentElement;
    targetRef.current = target;
    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else {
        // webkit fallback
        const webkitEl = target as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
        await webkitEl.webkitRequestFullscreen?.();
      }
    } catch {
      // fullscreen denied (no user gesture, or permission denied) — stay windowed
    }
  }, []);

  const exit = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch { /* ignore */ }
  }, []);

  const toggle = useCallback(
    (el?: HTMLElement | null) => {
      if (isFullscreen) exit();
      else enter(el);
    },
    [isFullscreen, enter, exit]
  );

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
    };
  }, []);

  return { isFullscreen, enter, exit, toggle };
}
