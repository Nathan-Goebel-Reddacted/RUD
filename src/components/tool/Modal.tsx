import React, { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import '@/App.css'

/**
 * open/close.
 */
type Listener = (payload?: any) => void;
const listeners = new Map<string, Set<Listener>>();

function on(event: string, cb: Listener) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(cb);
  return () => listeners.get(event)!.delete(cb);
}
function emit(event: string, payload?: any) {
  listeners.get(event)?.forEach((cb) => cb(payload));
}

/**
 * API
 */
export function openModal(id: string) {
  emit("modal:closeAll");
  emit("modal:open", id);
}
export function closeModal(id: string) {
  emit("modal:close", id);
}

type ModalProps = {
  id: string;
  width?: string | number;
  height?: string | number;
  children: ReactNode;
  className?: string;        
  style?: React.CSSProperties;
  preventClose?: boolean;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
};

export default function Modal({
  id,
  width,
  height,
  children,
  className,
  style,
  preventClose = false,
  ariaLabelledBy,
  ariaDescribedBy,
}: ModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedEl = useRef<HTMLElement | null>(null);
  const portalTarget = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const offOpen = on("modal:open", (targetId?: string) => {
      if (targetId === id) {
        lastFocusedEl.current = (document.activeElement as HTMLElement) ?? null;
        setIsOpen(true);
      }
    });
    const offClose = on("modal:close", (targetId?: string) => {
      if (targetId === id) setIsOpen(false);
    });
    const offCloseAll = on("modal:closeAll", () => setIsOpen(false));
    return () => {
      offOpen();
      offClose();
      offCloseAll();
    };
  }, [id]);

  useEffect(() => {
    let el = document.getElementById("__modal-root__");
    if (!el) {
      el = document.createElement("div");
      el.id = "__modal-root__";
      document.body.appendChild(el);
    }
    portalTarget.current = el;
  }, []);

useEffect(() => {
  if (!isOpen) return;

  const prevOverflow = document.body.style.overflow;
  const prevPadRight = document.body.style.paddingRight;
  const scrollbarW =
    window.innerWidth - document.documentElement.clientWidth;
  if (scrollbarW > 0) {
    document.body.style.paddingRight = `${scrollbarW}px`;
  }
  document.body.style.overflow = "hidden";

  const to = setTimeout(() => {
    const container = contentRef.current;
    if (!container) return;
    const focusables = container.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    (focusables[0] ?? container).focus();
  }, 0);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !preventClose) {
      closeModal(id);
      return;
    }
    if (e.key !== "Tab") return;
    const container = contentRef.current;
    if (!container) return;
    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey) {
      if (active === first || !container.contains(active)) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (active === last || !container.contains(active)) {
        first.focus();
        e.preventDefault();
      }
    }
  };

  const onFocusIn = (e: FocusEvent) => {
    const container = contentRef.current;
    if (!container) return;
    if (!container.contains(e.target as Node)) {
      container.focus();
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("focusin", onFocusIn);

  return () => {
    document.body.style.overflow = prevOverflow;
    document.body.style.paddingRight = prevPadRight;
    clearTimeout(to);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("focusin", onFocusIn);
    lastFocusedEl.current?.focus?.();
    lastFocusedEl.current = null;
  };
}, [isOpen, id, preventClose]);

  if (!isOpen || !portalTarget.current) return null;

  const w =
    typeof width === "number" ? `${width}px` : width ? width : undefined;
  const h =
    typeof height === "number" ? `${height}px` : height ? height : undefined;

const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

const contentStyles: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "grid",
  placeItems: "center",
  zIndex: 9999,
  // backdrop + tint moved here
  backdropFilter: "blur(2px)",
  background: "rgba(0,0,0,0.35)",
  animation: prefersReducedMotion ? "none" : "modalFade 150ms ease-out",
};

  const cardStyles: React.CSSProperties = {
    maxWidth: "95vw",
    maxHeight: "95vh",
    width: w,
    height: h,
    overflow: "auto",
    outline: "none",
    background:"var(--background-color)",
  };

const overlayStyles: React.CSSProperties & { [key: string]: any } = {
  position: "fixed",
  inset: 0,
  backdropFilter: "blur(2px)",
  background: "rgba(0,0,0,0.35)",
  zIndex: 9998,
  animation: prefersReducedMotion ? "none" : "modalPop 160ms ease-out",
};

  const innerWrapper: React.CSSProperties = {
    transform: "scale(1)",
    animation: "modalPop 160ms ease-out",
  };

  const keyframes = (
    <style>
      {`
        @keyframes modalFade {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: translateY(4px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}
    </style>
  );

  const overlay = (
    <div
      aria-hidden="true"
      style={overlayStyles}
      onClick={() => {
        if (!preventClose) closeModal(id);
      }}
    />
  );

const dialog = (
  <div
    style={contentStyles}
    aria-hidden={!isOpen}
    onMouseDown={(e) => {
      if (!preventClose && e.target === e.currentTarget) closeModal(id);
    }}
  >
    <div style={innerWrapper}>
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className={`border-radius ${className ?? ""}`}
        style={{ ...cardStyles, ...style }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  </div>
);

  return createPortal(
    <>
      {keyframes}
      {overlay}
      {dialog}
    </>,
    portalTarget.current
  );
}
