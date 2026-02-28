import { useState } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import DashboardGrid from "@/components/Widget/DashboardGrid";
import WidgetDrawer from "@/components/Widget/WidgetDrawer";
import WidgetConfigPanel from "@/components/Widget/config/WidgetConfigPanel";
import Modal, { openModal, closeModal } from "@/components/tool/Modal";
import type { Widget, WidgetPosition, WidgetType } from "@/types/widget";

const ADD_MODAL  = "widget-add";
const EDIT_MODAL = "widget-edit";

function Dashboard() {
  const currentDashboard   = useDashboardStore((s) => s.currentDashboard);
  const addWidget          = useDashboardStore((s) => s.addWidget);
  const updateWidget       = useDashboardStore((s) => s.updateWidget);
  const removeWidget       = useDashboardStore((s) => s.removeWidget);
  const moveWidget         = useDashboardStore((s) => s.moveWidget);

  const [editingWidget,  setEditingWidget]  = useState<Widget | null>(null);
  const [preselectedType, setPreselectedType] = useState<WidgetType | undefined>();

  function handleDrawerAdd(type: WidgetType) {
    setPreselectedType(type);
    openModal(ADD_MODAL);
  }

  function handleEditWidget(widget: Widget) {
    setEditingWidget(widget);
    openModal(EDIT_MODAL);
  }

  function handleSaveNew(partial: Omit<Widget, "id" | "position"> & { id?: string }) {
    const maxY = currentDashboard.widgets.reduce(
      (max, w) => Math.max(max, w.position.y + w.position.h),
      0
    );
    const position: WidgetPosition = { x: 0, y: maxY, w: 4, h: 3 };
    addWidget({ ...partial, id: crypto.randomUUID(), position } as Widget);
    closeModal(ADD_MODAL);
  }

  function handleSaveEdit(partial: Omit<Widget, "id" | "position"> & { id?: string }) {
    if (!editingWidget) return;
    updateWidget({ ...editingWidget, ...partial, id: editingWidget.id } as Widget);
    setEditingWidget(null);
    closeModal(EDIT_MODAL);
  }

  return (
    <div className="page-with-nav dashboard-editor">
      <div className="dashboard-editor__body">
        <div className="dashboard-editor__canvas">
          <DashboardGrid
            widgets={currentDashboard.widgets}
            onMove={moveWidget}
            onEdit={handleEditWidget}
            onDelete={removeWidget}
          />
        </div>

        <WidgetDrawer onAdd={handleDrawerAdd} />
      </div>

      <Modal id={ADD_MODAL} width={520}>
        <WidgetConfigPanel
          initialType={preselectedType}
          onSave={handleSaveNew}
          onCancel={() => closeModal(ADD_MODAL)}
        />
      </Modal>

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
