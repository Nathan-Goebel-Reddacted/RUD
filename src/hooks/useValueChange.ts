import { useRef, useState, useEffect } from "react";
import { useProfileStore } from "@/stores/profileStore";

export function useValueChange(value: string, fetchedAt: number | null): boolean {
  const animationsEnabled = useProfileStore((s) => s.profile?.getAnimationsEnabled() ?? true);
  const prevValueRef      = useRef<string | undefined>(undefined);
  const [changed, setChanged] = useState(false);
  const timerRef          = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!animationsEnabled || fetchedAt === null) return;

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
  }, [fetchedAt]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return changed && animationsEnabled;
}
