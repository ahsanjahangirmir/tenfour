import { forwardRef, useRef } from "react";
import ExportButtons from "./ExportButtons";
import LogSheetSVG from "./LogSheetSVG";

function mergeRefs(...refs) {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
}

const LogSheetCard = forwardRef(function LogSheetCard({ trip, logSheet }, forwardedRef) {
  const localRef = useRef(null);

  return (
    <div className="log-sheet-card">
      <LogSheetSVG ref={mergeRefs(localRef, forwardedRef)} trip={trip} logSheet={logSheet} />
      <ExportButtons targetRef={localRef} filename={`log-sheet-day-${logSheet.day_number}-${logSheet.log_date}`} />
    </div>
  );
});

export default LogSheetCard;
