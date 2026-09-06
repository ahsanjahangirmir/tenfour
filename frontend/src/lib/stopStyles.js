/** Shared between RouteMap and MapLegend so the map and its key never drift apart. */
export const STOP_STYLES = {
  current: { label: "Current location", color: "#64748b" },
  pickup: { label: "Pickup", color: "#22c55e" },
  dropoff: { label: "Dropoff", color: "#ef4444" },
  fuel_stop: { label: "Fuel stop", color: "#f59e0b" },
  "30min_break": { label: "30-minute break", color: "#3b82f6" },
  "10hr_rest": { label: "10-hour rest", color: "#8b5cf6" },
  "10hr_rest_split": { label: "10-hour rest (split sleeper)", color: "#ec4899" },
  "34hr_restart": { label: "34-hour restart", color: "#b91c1c" },
};

export function styleForBlock(block) {
  if (block.stop_type === "10hr_rest" && block.is_split_sleeper) {
    return STOP_STYLES["10hr_rest_split"];
  }
  return STOP_STYLES[block.stop_type];
}
