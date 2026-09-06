import { STOP_STYLES } from "../../lib/stopStyles";

function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export default function TripPanel({ trip }) {
  const b = trip.breakdown;

  const primaryStats = [
    { label: "Distance", value: `${b.distance_miles.toFixed(0)} mi` },
    { label: "Driving time", value: formatHours(b.driving_hours) },
    { label: "Trip length", value: `${b.total_days} day${b.total_days === 1 ? "" : "s"}` },
    { label: "Rest periods", value: b.num_rests },
  ];

  const secondaryStats = [
    { label: "Fuel stops", value: b.num_fuel_stops },
    { label: "Off duty", value: formatHours(b.off_duty_hours) },
    { label: "Sleeper berth", value: formatHours(b.sleeper_berth_hours) },
    { label: "On duty", value: formatHours(b.on_duty_not_driving_hours) },
  ];

  return (
    <div className="trip-panel">
      <div className="trip-panel__inner">
        <p className="trip-panel__eyebrow">Trip breakdown</p>

        <dl className="trip-panel__stats">
          {[...primaryStats, ...secondaryStats].map((stat) => (
            <div key={stat.label} className="trip-panel__stat">
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="trip-panel__divider" />

        <ul className="trip-panel__legend">
          {Object.values(STOP_STYLES).map((style) => (
            <li key={style.label}>
              <span className="trip-panel__swatch" style={{ background: style.color }} />
              {style.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
