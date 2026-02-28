import { useRef } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { GripHorizontal } from "lucide-react";
import type { Widget, WidgetPosition } from "@/types/widget";
import { useWidgetData } from "@/hooks/useWidgetData";
import WidgetCard from "./WidgetCard";

const COLS       = 12;
const ROW_HEIGHT = 80; // px
const COL_GAP    = 8;  // px
const MIN_W      = 2;
const MIN_H      = 2;

function colToPercent(x: number): string {
  return `calc(${(x / COLS) * 100}% + ${COL_GAP / 2}px)`;
}
function widthPercent(w: number): string {
  return `calc(${(w / COLS) * 100}% - ${COL_GAP}px)`;
}

// ─── Resize handle ────────────────────────────────────────────────────────────

type ResizeHandleProps = {
  widget:   Widget;
  gridRef:  React.RefObject<HTMLDivElement | null>;
  onResize: (id: string, position: WidgetPosition) => void;
};

function ResizeHandle({ widget, gridRef, onResize }: ResizeHandleProps) {
  function handlePointerDown(e: React.PointerEvent) {
    e.stopPropagation(); // prevent dnd-kit drag
    e.preventDefault();

    const startX  = e.clientX;
    const startY  = e.clientY;
    const startW  = widget.position.w;
    const startH  = widget.position.h;
    const gridW   = gridRef.current?.getBoundingClientRect().width ?? 800;
    const colPx   = gridW / COLS;
    const rowPx   = ROW_HEIGHT + COL_GAP;

    function onPointerMove(ev: PointerEvent) {
      const dw = Math.round((ev.clientX - startX) / colPx);
      const dh = Math.round((ev.clientY - startY) / rowPx);

      const newW = Math.max(MIN_W, Math.min(COLS - widget.position.x, startW + dw));
      const newH = Math.max(MIN_H, startH + dh);

      onResize(widget.id, { ...widget.position, w: newW, h: newH });
    }

    function onPointerUp() {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup",   onPointerUp);
      document.body.style.cursor  = "";
      document.body.style.userSelect = "";
    }

    document.body.style.cursor     = "se-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup",   onPointerUp);
  }

  return (
    <div className="widget-resize-handle" onPointerDown={handlePointerDown}>
      <GripHorizontal size={12} strokeWidth={2} />
    </div>
  );
}

// ─── Draggable widget ─────────────────────────────────────────────────────────

type DraggableWidgetProps = {
  widget:   Widget;
  gridRef:  React.RefObject<HTMLDivElement | null>;
  onEdit?:  (widget: Widget) => void;
  onDelete?:(id: string) => void;
  onResize: (id: string, position: WidgetPosition) => void;
};

function DraggableWidget({ widget, gridRef, onEdit, onDelete, onResize }: DraggableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: widget.id,
  });
  const dataState = useWidgetData(widget);

  const { x, y, w, h } = widget.position;
  const style: React.CSSProperties = {
    position:   "absolute",
    left:       colToPercent(x),
    top:        y * (ROW_HEIGHT + COL_GAP),
    width:      widthPercent(w),
    height:     h * ROW_HEIGHT + (h - 1) * COL_GAP,
    transform:  transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex:     isDragging ? 10 : 1,
    opacity:    isDragging ? 0.85 : 1,
    transition: isDragging ? "none" : "transform 200ms ease",
    cursor:     isDragging ? "grabbing" : "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <WidgetCard widget={widget} dataState={dataState} onEdit={onEdit} onDelete={onDelete} />
      <ResizeHandle widget={widget} gridRef={gridRef} onResize={onResize} />
    </div>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

type Props = {
  widgets:  Widget[];
  onMove:   (id: string, position: WidgetPosition) => void;
  onEdit?:  (widget: Widget) => void;
  onDelete?:(id: string) => void;
};

export default function DashboardGrid({ widgets, onMove, onEdit, onDelete }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const maxRow     = widgets.reduce((max, w) => Math.max(max, w.position.y + w.position.h), 4);
  const gridHeight = maxRow * (ROW_HEIGHT + COL_GAP) + COL_GAP;

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;
    const widget = widgets.find((w) => w.id === active.id);
    if (!widget || (!delta.x && !delta.y)) return;

    const gridW = gridRef.current?.getBoundingClientRect().width ?? 800;
    const colPx = gridW / COLS;
    const dx    = Math.round(delta.x / colPx);
    const dy    = Math.round(delta.y / (ROW_HEIGHT + COL_GAP));

    const newX = Math.max(0, Math.min(COLS - widget.position.w, widget.position.x + dx));
    const newY = Math.max(0, widget.position.y + dy);

    onMove(widget.id, { ...widget.position, x: newX, y: newY });
  }

  if (widgets.length === 0) {
    return (
      <div className="dashboard-grid__empty">
        <p>No widgets yet. Click <strong>Add widget</strong> to get started.</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        ref={gridRef}
        className="dashboard-grid"
        style={{ position: "relative", height: gridHeight, width: "100%" }}
      >
        {widgets.map((w) => (
          <DraggableWidget
            key={w.id}
            widget={w}
            gridRef={gridRef}
            onEdit={onEdit}
            onDelete={onDelete}
            onResize={onMove}
          />
        ))}
      </div>
    </DndContext>
  );
}
