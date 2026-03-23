import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { HexColorPicker } from "react-colorful";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const safe = (v: string) => (HEX_RE.test(v) ? v : "#000000");

export default function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [open, setOpen]           = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [pos, setPos]             = useState({ top: 0, left: 0 });
  const [positioned, setPositioned] = useState(false);
  const swatchRef  = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Compute exact position after the popover is in the DOM, before paint
  useLayoutEffect(() => {
    if (!open || !popoverRef.current || !swatchRef.current) {
      setPositioned(false);
      return;
    }
    const pr = popoverRef.current.getBoundingClientRect();
    const sr = swatchRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 6;

    const top  = sr.bottom + gap + pr.height > vh
      ? Math.max(4, sr.top - pr.height - gap)
      : sr.bottom + gap;

    const left = sr.left + pr.width > vw
      ? Math.max(4, vw - pr.width - 8)
      : sr.left;

    setPos({ top, left });
    setPositioned(true);
  }, [open]);

  const toggle = () => {
    if (!open) setInputValue(value);
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        !popoverRef.current?.contains(e.target as Node) &&
        !swatchRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    if (HEX_RE.test(v)) onChange(v);
  };

  return (
    <div className={`color-picker${className ? ` ${className}` : ""}`}>
      <button
        ref={swatchRef}
        type="button"
        className="color-picker__swatch"
        style={{ background: safe(value) }}
        onClick={toggle}
        aria-label={`Color: ${value}`}
      />
      {open && (
        <div
          ref={popoverRef}
          className="color-picker__popover"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            visibility: positioned ? "visible" : "hidden",
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <HexColorPicker color={safe(value)} onChange={onChange} />
          <input
            type="text"
            className="color-picker__hex-input"
            value={inputValue}
            onChange={handleHexInput}
            maxLength={7}
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}
