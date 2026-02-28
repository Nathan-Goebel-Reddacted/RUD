import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import type { Widget, WidgetPosition } from "@/types/widget";
import { useWidgetData } from "@/hooks/useWidgetData";
import WidgetCard from "./WidgetCard";

const COLS        = 12;
const ROW_HEIGHT  = 80; // px
const COL_GAP     = 8;  // px

function colToPercent(x: number): string {
  const colW = 100 / COLS;
  return `calc(${x * colW}% + ${COL_GAP / 2}px)`;
}
function widthPercent(w: number): string {
  const colW = 100 / COLS;
  return `calc(${w * colW}% - ${COL_GAP}px)`;
}

type DraggableWidgetProps = {
  widget:   Widget;
  onEdit?:  (widget: Widget) => void;
  onDelete?:(id: string) => void;
};

function DraggableWidget({ widget, onEdit, onDelete }: DraggableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: widget.id,
  });
  const dataState = useWidgetData(widget);

  const { x, y, w, h } = widget.position;
  const style: React.CSSProperties = {
    position: "absolute",
    left:     colToPercent(x),
    top:      y * (ROW_HEIGHT + COL_GAP),
    width:    widthPercent(w),
    height:   h * ROW_HEIGHT + (h - 1) * COL_GAP,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex:  isDragging ? 10 : 1,
    opacity: isDragging ? 0.85 : 1,
    transition: isDragging ? "none" : "transform 200ms ease",
    cursor: isDragging ? "grabbing" : "default",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag handle — only the header is draggable */}
      <div {...listeners} {...attributes} className="widget-drag-handle" />
      <WidgetCard widget={widget} dataState={dataState} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

type Props = {
  widgets:  Widget[];
  onMove:   (id: string, position: WidgetPosition) => void;
  onEdit?:  (widget: Widget) => void;
  onDelete?:(id: string) => void;
};

export default function DashboardGrid({ widgets, onMove, onEdit, onDelete }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const maxRow = widgets.reduce((max, w) => Math.max(max, w.position.y + w.position.h), 4);
  const gridHeight = maxRow * (ROW_HEIGHT + COL_GAP) + COL_GAP;

  function handleDragEnd(event: DragEndEvent) {
    const { active, delta } = event;
    const widget = widgets.find((w) => w.id === active.id);
    if (!widget || (!delta.x && !delta.y)) return;

    const colW = (window.innerWidth - 32) / COLS; // approximate
    const dx   = Math.round(delta.x / colW);
    const dy   = Math.round(delta.y / (ROW_HEIGHT + COL_GAP));

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
        className="dashboard-grid"
        style={{ position: "relative", height: gridHeight, width: "100%" }}
      >
        {widgets.map((w) => (
          <DraggableWidget key={w.id} widget={w} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </DndContext>
  );
}
