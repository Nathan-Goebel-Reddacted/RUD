import { useRef, useState, useEffect } from "react";
import { useProfileStore } from "@/stores/profileStore";

/**
 * Returns true for ~600ms whenever `value` changes between fetches (RUD056).
 * Does NOT fire on the first fetch — establishes a baseline silently.
 * Respects the global animationsEnabled profile setting and prefers-reduced-motion (via CSS).
 */
export function useValueChange(value: string, fetchedAt: number | null): boolean {
  const animationsEnabled = useProfileStore((s) => s.profile?.getAnimationsEnabled() ?? true);
  const prevValueRef      = useRef<string | undefined>(undefined);
  const [changed, setChanged] = useState(false);
  const timerRef          = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!animationsEnabled || fetchedAt === null) return;

    // First fetch — set baseline, no animation
    if (prevValueRef.current === undefined) {
      prevValueRef.current = value;
      return;
    }

    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      setChanged(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setChanged(false), 600);
    }
  // fetchedAt is the reliable signal that new data arrived
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedAt]);

  // Cleanup on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return changed && animationsEnabled;
}
