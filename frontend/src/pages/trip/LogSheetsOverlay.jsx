import { useEffect, useRef, useState } from "react";
import LogSheetCard from "../../components/LogSheetCard";
import { exportAllPdf, exportAllPng } from "../../lib/exportLogSheets";

const CLOSE_ANIMATION_MS = 380;

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MultiDaySummary({ trip }) {
  const sheets = trip.log_sheets;
  if (sheets.length < 2) return null;

  const dates = sheets.map((s) => s.log_date).sort();
  const totalDriving = sheets.reduce((sum, s) => sum + s.driving_minutes, 0);
  const totalMiles = sheets.reduce((sum, s) => sum + s.driving_miles_today, 0);

  return (
    <div className="logs-overlay__summary">
      <h3>Across all {sheets.length} log sheets</h3>
      <p>
        {dates[0]} &ndash; {dates[dates.length - 1]} &middot; {(totalDriving / 60).toFixed(1)}h driving &middot;{" "}
        {totalMiles.toFixed(0)} mi total
      </p>
    </div>
  );
}

function ExportAllToolbar({ trip, sheetRefs }) {
  const [exporting, setExporting] = useState(false);
  const sheets = trip.log_sheets;

  if (sheets.length < 2) return null;

  const dates = sheets.map((s) => s.log_date).sort();
  const filename = `log-sheets-${dates[0]}-to-${dates[dates.length - 1]}`;

  async function handleExportAll(kind) {
    setExporting(true);
    try {
      const nodes = sheets.map((sheet) => sheetRefs.current[sheet.id]);
      if (kind === "png") await exportAllPng(nodes, filename);
      else await exportAllPdf(nodes, filename);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="logs-overlay__export-all">
      <button
        type="button"
        className="button button--ghost"
        onClick={() => handleExportAll("png")}
        disabled={exporting}
      >
        {exporting ? "Exporting…" : "Export all as PNG"}
      </button>
      <button
        type="button"
        className="button button--ghost"
        onClick={() => handleExportAll("pdf")}
        disabled={exporting}
      >
        {exporting ? "Exporting…" : "Export all as PDF"}
      </button>
    </div>
  );
}

export default function LogSheetsOverlay({ trip, onCancel }) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const sheetRefs = useRef({});

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setClosing(true);
    setTimeout(onCancel, CLOSE_ANIMATION_MS);
  }

  return (
    <div className={`wizard-overlay${mounted && !closing ? " wizard-overlay--visible" : ""}`}>
      <div className="wizard-overlay__backdrop" onClick={handleClose} />
      <div className="wizard-panel logs-overlay__panel">
        <div className="wizard-panel__top">
          <p className="wizard-eyebrow" style={{ margin: 0 }}>
            Daily log sheets
          </p>
          <button type="button" className="wizard-close" aria-label="Close" onClick={handleClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="logs-overlay__body">
          <MultiDaySummary trip={trip} />
          <ExportAllToolbar trip={trip} sheetRefs={sheetRefs} />
          {trip.log_sheets.map((sheet) => (
            <LogSheetCard
              key={sheet.id}
              trip={trip}
              logSheet={sheet}
              ref={(el) => {
                sheetRefs.current[sheet.id] = el;
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
