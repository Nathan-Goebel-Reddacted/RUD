import { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDashboardStore } from "@/stores/dashboardStore";

// ─── Single bubble ─────────────────────────────────────────────────────────────

type BubbleProps = {
  id:             string;
  index:          number;
  label:          string;
  isActive:       boolean;
  canDelete:      boolean;
  dragStartedRef: React.RefObject<boolean>;
};

function Bubble({ id, index, label, isActive, canDelete, dragStartedRef }: BubbleProps) {
  const { t } = useTranslation();
  const setActive = useDashboardStore((s) => s.setActiveDashboardIndex);
  const remove    = useDashboardStore((s) => s.removeDashboard);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style: React.CSSProperties = {
    transform:  CSS.Transform.toString(transform),
    transition,
  };

  function handleClick() {
    if (dragStartedRef.current) return;
    setActive(index);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`db-bubble${isActive ? " db-bubble--active" : ""}`}
      onClick={handleClick}
      {...attributes}
      {...listeners}
    >
      <span className="db-bubble__label">{label}</span>
      {isActive && canDelete && (
        <button
          className="db-bubble__delete"
          onClick={(e) => { e.stopPropagation(); remove(index); }}
          title={t("bubbles.delete")}
          aria-label={t("bubbles.delete")}
        >
          ×
        </button>
      )}
    </div>
  );
}

// ─── Bubbles bar ───────────────────────────────────────────────────────────────

export default function DashboardBubbles() {
  const { t } = useTranslation();
  const dashboards           = useDashboardStore((s) => s.dashboards);
  const activeDashboardIndex = useDashboardStore((s) => s.activeDashboardIndex);
  const addDashboard         = useDashboardStore((s) => s.addDashboard);
  const reorderDashboards    = useDashboardStore((s) => s.reorderDashboards);

  // Track drag to prevent click-after-drag triggering setActive
  const dragStartedRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart() {
    dragStartedRef.current = true;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const fromIndex = dashboards.findIndex((d) => d.id === active.id);
      const toIndex   = dashboards.findIndex((d) => d.id === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        reorderDashboards(fromIndex, toIndex);
      }
    }
    // Defer reset so onClick fires first and sees dragStartedRef = true
    setTimeout(() => { dragStartedRef.current = false; }, 0);
  }

  return (
    <div className="db-bubbles-bar">
      <DndContext
        id="bubbles-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={dashboards.map((d) => d.id)}
          strategy={horizontalListSortingStrategy}
        >
          {dashboards.map((d, i) => (
            <Bubble
              key={d.id}
              id={d.id}
              index={i}
              label={d.title}
              isActive={i === activeDashboardIndex}
              canDelete={dashboards.length > 1}
              dragStartedRef={dragStartedRef}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        className="db-bubble db-bubble--add"
        onClick={() => addDashboard()}
        title={t("bubbles.add")}
        aria-label={t("bubbles.add")}
      >
        +
      </button>
    </div>
  );
}
