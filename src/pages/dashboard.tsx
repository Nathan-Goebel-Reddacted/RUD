import { useState } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import DashboardToolbar from "@/components/Widget/DashboardToolbar";
import DashboardGrid from "@/components/Widget/DashboardGrid";
import WidgetConfigPanel from "@/components/Widget/config/WidgetConfigPanel";
import Modal, { openModal, closeModal } from "@/components/tool/Modal";
import type { Widget, WidgetPosition } from "@/types/widget";

const ADD_MODAL    = "widget-add";
const EDIT_MODAL   = "widget-edit";

function Dashboard() {
  const currentDashboard  = useDashboardStore((state) => state.currentDashboard);
  const setTitle          = useDashboardStore((state) => state.setTitle);
  const setRefreshInterval = useDashboardStore((state) => state.setRefreshInterval);
  const addWidget         = useDashboardStore((state) => state.addWidget);
  const updateWidget      = useDashboardStore((state) => state.updateWidget);
  const removeWidget      = useDashboardStore((state) => state.removeWidget);
  const moveWidget        = useDashboardStore((state) => state.moveWidget);

  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);

  function handleAddWidget() {
    openModal(ADD_MODAL);
  }

  function handleEditWidget(widget: Widget) {
    setEditingWidget(widget);
    openModal(EDIT_MODAL);
  }

  function handleSaveNew(partial: Omit<Widget, "id" | "position"> & { id?: string }) {
    // Place new widget at next available row
    const maxY = currentDashboard.widgets.reduce(
      (max, w) => Math.max(max, w.position.y + w.position.h),
      0
    );
    const position: WidgetPosition = { x: 0, y: maxY, w: 4, h: 3 };
    const widget: Widget = {
      ...partial,
      id:       crypto.randomUUID(),
      position,
      config:   partial.config,
    } as Widget;
    addWidget(widget);
    closeModal(ADD_MODAL);
  }

  function handleSaveEdit(partial: Omit<Widget, "id" | "position"> & { id?: string }) {
    if (!editingWidget) return;
    updateWidget({ ...editingWidget, ...partial, id: editingWidget.id } as Widget);
    setEditingWidget(null);
    closeModal(EDIT_MODAL);
  }

  function handleMove(id: string, position: WidgetPosition) {
    moveWidget(id, position);
  }

  return (
    <div className="page-with-nav dashboard-editor">
      <DashboardToolbar
        title={currentDashboard.title}
        refreshInterval={currentDashboard.refreshInterval}
        onTitleChange={setTitle}
        onRefreshChange={setRefreshInterval}
        onAddWidget={handleAddWidget}
      />

      <div className="dashboard-editor__canvas">
        <DashboardGrid
          widgets={currentDashboard.widgets}
          onMove={handleMove}
          onEdit={handleEditWidget}
          onDelete={removeWidget}
        />
      </div>

      {/* Add Widget Modal */}
      <Modal id={ADD_MODAL} width={520}>
        <WidgetConfigPanel
          onSave={handleSaveNew}
          onCancel={() => closeModal(ADD_MODAL)}
        />
      </Modal>

      {/* Edit Widget Modal */}
      <Modal id={EDIT_MODAL} width={520}>
        {editingWidget && (
          <WidgetConfigPanel
            initial={editingWidget}
            onSave={handleSaveEdit}
            onCancel={() => { setEditingWidget(null); closeModal(EDIT_MODAL); }}
          />
        )}
      </Modal>
    </div>
  );
}

export default Dashboard;
