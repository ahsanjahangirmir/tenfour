import { forwardRef } from "react";
import { blocksForDay, buildRemarkSpans, DUTY_ROWS } from "../lib/logSheetLayout";

const FONT_FAMILY = "'Helvetica Neue', Arial, sans-serif";

// Left margin is sized to comfortably fit the longest row label
// ("On Duty (Not Driving)") right-aligned without it running off the
// left edge of the SVG's coordinate space and getting clipped.
const GRID_X0 = 140;
const GRID_X1 = 910;
const HOUR_W = (GRID_X1 - GRID_X0) / 24;
const ROW_H = 32;
const GRID_Y0 = 20;
const GRID_Y1 = GRID_Y0 + DUTY_ROWS.length * ROW_H;

// Remarks sit in their own band below the grid: a short vertical tick marks
// the exact time of each duty-status change, and the location label reads
// horizontally beside it (staggered across two rows so nearby change points
// don't overlap) rather than running diagonally back up across the grid.
const TICK_DROP = 10;
const REMARKS_Y0 = GRID_Y1 + TICK_DROP;
const REMARKS_ROW_GAP = 15;
const REMARKS_BAND_H = 44;
const SVG_HEIGHT = REMARKS_Y0 + REMARKS_BAND_H;

// Remark labels are centered under the midpoint of their span and truncated
// to whatever width is actually available before the next label in the same
// row — this is what keeps adjacent (or just plain long) remarks from
// overlapping instead of relying on one fixed character cap for everything.
const CHAR_WIDTH_PX = 5;
const LABEL_GAP_PX = 10;
const MIN_REMARK_CHARS = 4;
const MAX_REMARK_CHARS = 26;

function x(hour) {
  return GRID_X0 + hour * HOUR_W;
}

function rowCenterY(rowIndex) {
  return GRID_Y0 + rowIndex * ROW_H + ROW_H / 2;
}

function rowIndexFor(dutyStatus) {
  return DUTY_ROWS.findIndex((row) => row.key === dutyStatus);
}

function formatHourLabel(hour) {
  const h24 = hour % 24;
  if (h24 === 0) return "Mid";
  if (h24 === 12) return "Noon";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return String(h12);
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split("-");
  return `${m}/${d}/${y}`;
}

function formatMinutes(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

function truncateRemark(text, maxChars) {
  if (!text) return "";
  return text.length > maxChars ? `${text.slice(0, Math.max(1, maxChars - 1))}…` : text;
}

/** How many characters a span's centered label can use before it would run
 * into the nearest label sharing its row (rows alternate, so same-row
 * neighbors are the only ones that can ever collide horizontally). */
function charsAvailableFor(spans, rows, i) {
  const row = rows[i];
  let prev = null;
  for (let j = i - 1; j >= 0; j--) {
    if (rows[j] === row) {
      prev = spans[j];
      break;
    }
  }
  let next = null;
  for (let j = i + 1; j < spans.length; j++) {
    if (rows[j] === row) {
      next = spans[j];
      break;
    }
  }
  const span = spans[i];
  const midX = x((span.startHour + span.endHour) / 2);
  const leftBound = prev ? x(prev.endHour) : GRID_X0;
  const rightBound = next ? x(next.startHour) : GRID_X1;
  const availableWidth = Math.min(midX - leftBound, rightBound - midX) * 2 - LABEL_GAP_PX;
  const chars = Math.floor(Math.max(0, availableWidth) / CHAR_WIDTH_PX);
  return Math.max(MIN_REMARK_CHARS, Math.min(MAX_REMARK_CHARS, chars));
}

const LogSheetSVG = forwardRef(function LogSheetSVG({ trip, logSheet }, ref) {
  const dayBlocks = blocksForDay(trip.schedule_blocks, logSheet.log_date);

  const points = [];
  for (const block of dayBlocks) {
    const rowIndex = rowIndexFor(block.duty_status);
    const y = rowCenterY(rowIndex);
    points.push(`${x(block.startHour)},${y}`);
    points.push(`${x(block.endHour)},${y}`);
  }

  const remarkSpans = buildRemarkSpans(dayBlocks);
  const remarkRows = remarkSpans.map((_, i) => i % 2);

  const rowTotals = {
    off_duty: logSheet.off_duty_minutes,
    sleeper_berth: logSheet.sleeper_berth_minutes,
    driving: logSheet.driving_minutes,
    on_duty_not_driving: logSheet.on_duty_not_driving_minutes,
  };

  return (
    <div className="log-sheet" ref={ref}>
      <div className="log-sheet__header">
        <div className="log-sheet__title-row">
          <h3>Driver's Daily Log</h3>
          <span>{formatDate(logSheet.log_date)}</span>
          {logSheet.multi_day_flag && <span className="log-sheet__badge">Multi-Day Log</span>}
        </div>

        <dl className="log-sheet__fields">
          <div><dt>Driver number</dt><dd>{trip.driver_number_snapshot}</dd></div>
          <div><dt>Driver initials</dt><dd>{initials(trip.driver_name_snapshot)}</dd></div>
          <div><dt>Driving miles today</dt><dd>{logSheet.driving_miles_today}</dd></div>
          <div><dt>Truck mileage today</dt><dd>{logSheet.truck_mileage_today}</dd></div>
          <div><dt>Truck/trailer</dt><dd>{trip.truck_number_snapshot} / {trip.trailer_number_snapshot}</dd></div>
          <div><dt>Carrier</dt><dd>{trip.carrier_name_snapshot}</dd></div>
          <div><dt>Main office address</dt><dd>{trip.carrier_address_snapshot}</dd></div>
          <div><dt>Time base</dt><dd>{trip.time_base_snapshot}</dd></div>
          <div><dt>Shipping doc</dt><dd>{trip.shipping_document_number || `${trip.shipper_name} / ${trip.commodity}`}</dd></div>
          <div><dt>Co-driver</dt><dd>{trip.co_driver_name}</dd></div>
          <div><dt>Driver signature</dt><dd className="log-sheet__signature">{trip.driver_name_snapshot}</dd></div>
        </dl>
      </div>

      <svg
        viewBox={`0 0 960 ${SVG_HEIGHT}`}
        className="log-sheet__svg"
        xmlns="http://www.w3.org/2000/svg"
        fontFamily={FONT_FAMILY}
      >
        {/* Hour labels */}
        {Array.from({ length: 25 }, (_, h) => (
          <text key={h} x={x(h)} y={GRID_Y0 - 6} fontSize="9" textAnchor="middle" fill="#334155">
            {formatHourLabel(h)}
          </text>
        ))}

        {/* Row labels + gridlines */}
        {DUTY_ROWS.map((row, i) => (
          <g key={row.key}>
            <text x={GRID_X0 - 10} y={rowCenterY(i) + 3} fontSize="9.5" textAnchor="end" fill="#0f172a">
              {row.label}
            </text>
            <line x1={GRID_X0} y1={GRID_Y0 + i * ROW_H} x2={GRID_X1} y2={GRID_Y0 + i * ROW_H} stroke="#94a3b8" strokeWidth="1" />
            <text x={GRID_X1 + 8} y={rowCenterY(i) + 3} fontSize="9" fill="#0f172a">
              {formatMinutes(rowTotals[row.key])}
            </text>
          </g>
        ))}
        <line x1={GRID_X0} y1={GRID_Y1} x2={GRID_X1} y2={GRID_Y1} stroke="#94a3b8" strokeWidth="1" />

        {/* Hour + quarter-hour vertical ticks */}
        {Array.from({ length: 24 * 4 + 1 }, (_, q) => {
          const hour = q / 4;
          const isHour = q % 4 === 0;
          return (
            <line
              key={q}
              x1={x(hour)}
              y1={GRID_Y0}
              x2={x(hour)}
              y2={GRID_Y1}
              stroke={isHour ? "#94a3b8" : "#e2e8f0"}
              strokeWidth={isHour ? 1 : 0.5}
            />
          );
        })}

        {/* Duty status polyline */}
        {points.length > 0 && (
          <polyline points={points.join(" ")} fill="none" stroke="#008181" strokeWidth="2.5" />
        )}

        {/* Remarks: each distinct stop gets one bracket spanning the time it
            covers (start tick — bridge — end tick), with the location label
            centered underneath and truncated to whatever room is actually
            available before the next label sharing its row. Rows alternate
            so back-to-back stops never share a text baseline. */}
        {remarkSpans.map((span, i) => {
          const midHour = (span.startHour + span.endHour) / 2;
          const hasDuration = span.endHour > span.startHour;
          return (
            <g key={i}>
              <circle cx={x(span.startHour)} cy={GRID_Y1} r="1.8" fill="#008181" />
              <line
                x1={x(span.startHour)}
                y1={GRID_Y1}
                x2={x(span.startHour)}
                y2={REMARKS_Y0}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              {hasDuration && (
                <>
                  <circle cx={x(span.endHour)} cy={GRID_Y1} r="1.8" fill="#008181" />
                  <line
                    x1={x(span.endHour)}
                    y1={GRID_Y1}
                    x2={x(span.endHour)}
                    y2={REMARKS_Y0}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <line
                    x1={x(span.startHour)}
                    y1={REMARKS_Y0}
                    x2={x(span.endHour)}
                    y2={REMARKS_Y0}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                </>
              )}
              <text
                x={x(midHour)}
                y={REMARKS_Y0 + 11 + remarkRows[i] * REMARKS_ROW_GAP}
                fontSize="8.5"
                fill="#334155"
                textAnchor="middle"
              >
                {truncateRemark(span.remark, charsAvailableFor(remarkSpans, remarkRows, i))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

function initials(fullName) {
  if (!fullName) return "";
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default LogSheetSVG;
