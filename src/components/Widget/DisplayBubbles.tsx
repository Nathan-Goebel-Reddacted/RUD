import { useDashboardStore } from "@/stores/dashboardStore";

export default function DisplayBubbles() {
  const dashboards           = useDashboardStore((s) => s.dashboards);
  const activeDashboardIndex = useDashboardStore((s) => s.activeDashboardIndex);
  const setActive            = useDashboardStore((s) => s.setActiveDashboardIndex);

  if (dashboards.length <= 1) return null;

  return (
    <div className="display-bubbles">
      {dashboards.map((d, i) => (
        <button
          key={d.id}
          className={`display-bubble${i === activeDashboardIndex ? " display-bubble--active" : ""}`}
          onClick={() => setActive(i)}
          title={d.title}
          aria-label={d.title}
        />
      ))}
    </div>
  );
}
