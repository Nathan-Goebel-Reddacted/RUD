import { useState } from "react";
import Profile, { type DisplayMode } from "@/class/Profiles";
import Modal from "@/components/tool/Modal";
import { useProfileStore } from "@/stores/profileStore";
import { useApiStore } from "@/stores/apiStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useNavigate } from "react-router";
import { Language, type Language as LanguageType } from "@/enum/language";
import { useTranslation } from "react-i18next";
import { applyColors } from "@/utils/colors";
import { applyLanguage } from "@/translations/i18n";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { Dashboard } from "@/types/widget";

type Tab = "profile" | "dashboards" | "display";

// ---------------------------------------------------------------------------
// SortableDashboardItem
// ---------------------------------------------------------------------------

function SortableDashboardItem({
  dashboard,
  index,
  isActive,
  onRename,
  onDelete,
  onToggleDisplay,
  canDelete,
}: {
  dashboard:       Dashboard;
  index:           number;
  isActive:        boolean;
  onRename:        (index: number, title: string) => void;
  onDelete:        (index: number) => void;
  onToggleDisplay: (index: number, value: boolean) => void;
  canDelete:       boolean;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: dashboard.id });
  const [editing, setEditing] = useState(dashboard.title);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`profile-dash-item${isActive ? " profile-dash-item--active" : ""}`}
    >
      <span className="profile-dash-grip" {...attributes} {...listeners}>
        <GripVertical size={14} />
      </span>
      <input
        className="profile-dash-name"
        value={editing}
        onChange={(e) => setEditing(e.target.value)}
        onBlur={() => onRename(index, editing)}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      />
      <label
        className="toggle"
        onPointerDown={(e) => e.stopPropagation()}
        title={t("profileSettings.dashboards.showInDisplay")}
      >
        <input
          type="checkbox"
          checked={dashboard.showInDisplay}
          onChange={(e) => onToggleDisplay(index, e.target.checked)}
        />
        <span className="toggle__track" />
      </label>
      <button
        className="profile-dash-delete"
        disabled={!canDelete}
        onClick={() => onDelete(index)}
        onPointerDown={(e) => e.stopPropagation()}
        title={t("profileSettings.dashboards.delete")}
        type="button"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DashboardsTab
// ---------------------------------------------------------------------------

function DashboardsTab({
  dashboards,
  activeDashboardIndex,
  renameDashboard,
  reorderDashboards,
  removeDashboard,
  setDashboardShowInDisplay,
}: {
  dashboards:                Dashboard[];
  activeDashboardIndex:      number;
  renameDashboard:           (index: number, title: string) => void;
  reorderDashboards:         (fromIndex: number, toIndex: number) => void;
  removeDashboard:           (index: number) => void;
  setDashboardShowInDisplay: (index: number, value: boolean) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = dashboards.findIndex((d) => d.id === active.id);
    const toIndex   = dashboards.findIndex((d) => d.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) reorderDashboards(fromIndex, toIndex);
  }

  return (
    <DndContext
      id="profile-dash-dnd"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={dashboards.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div className="profile-dash-list">
          {dashboards.map((d, i) => (
            <SortableDashboardItem
              key={d.id}
              dashboard={d}
              index={i}
              isActive={i === activeDashboardIndex}
              onRename={renameDashboard}
              onDelete={removeDashboard}
              onToggleDisplay={setDashboardShowInDisplay}
              canDelete={dashboards.length > 1}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ---------------------------------------------------------------------------
// ProfileSettings (main component)
// ---------------------------------------------------------------------------

function ProfileSettings({
  onClose,
  initialProfile,
  modalId = "ProfileSetting",
}: {
  onClose:         () => void;
  initialProfile?: Profile;
  modalId?:        string;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("profile");

  // Profile tab state
  const [profileName,     setProfileName]     = useState(initialProfile?.getProfileName() ?? "");
  const [errors,          setErrors]          = useState<Record<string, string>>({});
  const [language,        setLanguage]        = useState<LanguageType>(initialProfile?.getLanguage() ?? Language.EN);
  const [backgroundColor, setBackgroundColor] = useState<string>(initialProfile?.getBackgroundColor() ?? "#242424");
  const [borderColor,     setBorderColor]     = useState<string>(initialProfile?.getBorderColor()     ?? "#888888");
  const [textColor,       setTextColor]       = useState<string>(initialProfile?.getTextColor()       ?? "#646cff");
  const [textHoverColor,  setTextHoverColor]  = useState<string>(initialProfile?.getTextHoverColor()  ?? "#535bf2");

  // Display tab state
  const [displayMode,     setDisplayMode]     = useState<DisplayMode>(initialProfile?.getDisplayMode()     ?? "timer");
  const [displayInterval, setDisplayInterval] = useState<number>(initialProfile?.getDisplayInterval() ?? 30);
  const [scrollSpeed,     setScrollSpeed]     = useState<number>(initialProfile?.getScrollSpeed()     ?? 0);
  const [loopPauseMs,     setLoopPauseMs]     = useState<number>(initialProfile?.getLoopPauseMs()     ?? 2000);

  const setProfile        = useProfileStore((state) => state.setProfile);
  const clearConnections  = useApiStore((state) => state.clearConnections);
  const resetDashboard    = useDashboardStore((state) => state.resetDashboard);
  const dashboards        = useDashboardStore((state) => state.dashboards);
  const activeDashboardIndex = useDashboardStore((state) => state.activeDashboardIndex);
  const renameDashboard   = useDashboardStore((state) => state.renameDashboard);
  const reorderDashboards = useDashboardStore((state) => state.reorderDashboards);
  const removeDashboard             = useDashboardStore((state) => state.removeDashboard);
  const setDashboardShowInDisplay   = useDashboardStore((state) => state.setDashboardShowInDisplay);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProfile = new Profile();
    newProfile.createAProfile(profileName);
    newProfile.setLanguage(language);
    newProfile.setBackgroundColor(backgroundColor);
    newProfile.setBorderColor(borderColor);
    newProfile.setTextColor(textColor);
    newProfile.setTextHoverColor(textHoverColor);
    newProfile.setDisplayMode(displayMode);
    newProfile.setDisplayInterval(displayInterval);
    newProfile.setScrollSpeed(scrollSpeed);
    newProfile.setLoopPauseMs(loopPauseMs);
    const result = newProfile.IsProfileValid();
    if (result.isSuccess()) {
      setErrors({});
      applyColors(newProfile);
      applyLanguage(language);
      if (!initialProfile) {
        clearConnections();
        resetDashboard();
      }
      setProfile(newProfile);
      onClose();
      if (!initialProfile) navigate("/dashboard");
    } else {
      const errs: Record<string, string> = {};
      result.getAllReason().forEach(r => {
        errs[r.getreasonCode()] = r.getreasonMessage();
      });
      setErrors(errs);
      // Switch to profile tab to show errors
      setTab("profile");
    }
  };

  return (
    <Modal id={modalId}>
      <div className="profileSettings">
        {/* Tabs */}
        <div className="profile-tabs">
          {(["profile", "dashboards", "display"] as const).map((tabKey) => (
            <button
              key={tabKey}
              className={`profile-tab${tab === tabKey ? " profile-tab--active" : ""}`}
              onClick={() => setTab(tabKey)}
              type="button"
            >
              {t(`profileSettings.tabs.${tabKey}`)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Profile tab */}
          {tab === "profile" && (
            <div className="profile-tab-content">
              <input
                name="Profile Name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder={t("profileSettings.profileName")}
                minLength={5}
                className="display-block margin-10"
                required
              />
              {errors["Profile.name.tooShort"] && (
                <span className="form-error">{t(errors["Profile.name.tooShort"])}</span>
              )}
              <select
                name="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageType)}
                className="display-block margin-10"
                required
              >
                <option value={Language.EN}>English</option>
                <option value={Language.FR}>Français</option>
              </select>
              {errors["Profile.invalidLanguage"] && (
                <span className="form-error">{t(errors["Profile.invalidLanguage"])}</span>
              )}
              <div className="d-flex flex-col gap-2 margin-10">
                <label className="d-flex align-center gap-2">
                  <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
                  {t("profileSettings.colors.background")}
                </label>
                <label className="d-flex align-center gap-2">
                  <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} />
                  {t("profileSettings.colors.border")}
                </label>
                <label className="d-flex align-center gap-2">
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                  {t("profileSettings.colors.text")}
                </label>
                <label className="d-flex align-center gap-2">
                  <input type="color" value={textHoverColor} onChange={(e) => setTextHoverColor(e.target.value)} />
                  {t("profileSettings.colors.textHover")}
                </label>
              </div>
            </div>
          )}

          {/* Dashboards tab — actions are immediate, no submit needed */}
          {tab === "dashboards" && (
            <div className="profile-tab-content">
              <DashboardsTab
                dashboards={dashboards}
                activeDashboardIndex={activeDashboardIndex}
                renameDashboard={renameDashboard}
                reorderDashboards={reorderDashboards}
                removeDashboard={removeDashboard}
                setDashboardShowInDisplay={setDashboardShowInDisplay}
              />
            </div>
          )}

          {/* Display tab */}
          {tab === "display" && (
            <div className="profile-tab-content">
              <label className="d-flex align-center gap-2 margin-10">
                {t("profileSettings.display.mode")}
                <select
                  value={displayMode}
                  onChange={(e) => setDisplayMode(e.target.value as DisplayMode)}
                >
                  <option value="disabled">{t("profileSettings.display.modeDisabled")}</option>
                  <option value="timer">{t("profileSettings.display.modeTimer")}</option>
                  <option value="scroll-end">{t("profileSettings.display.modeScrollEnd")}</option>
                </select>
              </label>
              <label
                className="d-flex align-center gap-2 margin-10"
                style={{ opacity: displayMode === "timer" ? 1 : 0.4 }}
              >
                {t("profileSettings.display.interval")}
                <input
                  type="number"
                  min={5}
                  max={3600}
                  value={displayInterval}
                  onChange={(e) => setDisplayInterval(Number(e.target.value))}
                  style={{ width: "80px" }}
                  disabled={displayMode !== "timer"}
                />
              </label>
              <label className="d-flex align-center gap-2 margin-10">
                {t("profileSettings.display.scrollSpeed")}
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={scrollSpeed}
                  onChange={(e) => setScrollSpeed(Number(e.target.value))}
                  style={{ width: "80px" }}
                />
              </label>
              <label className="d-flex align-center gap-2 margin-10">
                {t("profileSettings.display.loopPauseMs")}
                <input
                  type="number"
                  min={0}
                  max={10000}
                  step={100}
                  value={loopPauseMs}
                  onChange={(e) => setLoopPauseMs(Number(e.target.value))}
                  style={{ width: "80px" }}
                />
              </label>
            </div>
          )}

          {/* Submit — hidden on Dashboards tab (actions are immediate) */}
          {tab !== "dashboards" && (
            <button type="submit" className="display-block margin-10">
              {initialProfile ? t("profileSettings.saveProfile") : t("profileSettings.loadProfile")}
            </button>
          )}
        </form>
      </div>
    </Modal>
  );
}

export default ProfileSettings;
