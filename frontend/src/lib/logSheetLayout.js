const DAY_MINUTES = 24 * 60;

/** Clips a trip's full schedule_blocks list down to the portion that
 * falls on `logDate` (a "YYYY-MM-DD" string), expressed as hour-of-day
 * floats (0-24) so the SVG grid can place them directly. */
export function blocksForDay(scheduleBlocks, logDate) {
  // Both `logDate` and every block's start/end datetime are wall-clock
  // values labeled UTC (see lib/datetime.js) — parsing the day boundary as
  // UTC here, instead of the browser's local timezone, is what keeps this
  // lined up with those values for any viewer, regardless of where they are.
  const dayStart = new Date(`${logDate}T00:00:00Z`);
  const dayEnd = new Date(dayStart.getTime() + DAY_MINUTES * 60 * 1000);

  const clipped = [];
  for (const block of scheduleBlocks) {
    const start = new Date(block.start_datetime);
    const end = new Date(block.end_datetime);
    const clippedStart = start < dayStart ? dayStart : start;
    const clippedEnd = end > dayEnd ? dayEnd : end;
    if (clippedStart >= clippedEnd) continue;

    clipped.push({
      duty_status: block.duty_status,
      stop_type: block.stop_type,
      remark: block.remark_location_text,
      startHour: (clippedStart - dayStart) / (1000 * 60 * 60),
      endHour: (clippedEnd - dayStart) / (1000 * 60 * 60),
    });
  }
  return clipped;
}

/** Collapses consecutive blocks that share the exact same remark (e.g. the
 * duty-status change on arrival and the separate one on departure from the
 * same stop) into a single span covering their combined time range, so the
 * location is written once per visit instead of once per status change. */
export function buildRemarkSpans(dayBlocks) {
  const spans = [];
  for (const block of dayBlocks) {
    const last = spans[spans.length - 1];
    if (last && last.remark === block.remark) {
      last.endHour = block.endHour;
    } else {
      spans.push({ startHour: block.startHour, endHour: block.endHour, remark: block.remark });
    }
  }
  return spans.filter((span) => span.remark);
}

export const DUTY_ROWS = [
  { key: "off_duty", label: "Off Duty" },
  { key: "sleeper_berth", label: "Sleeper Berth" },
  { key: "driving", label: "Driving" },
  { key: "on_duty_not_driving", label: "On Duty (Not Driving)" },
];
