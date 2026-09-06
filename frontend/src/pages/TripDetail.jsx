import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTrip } from "../lib/trips";
import "./dashboard/Dashboard.css";
import "./trip/Trip.css";
import LogSheetsOverlay from "./trip/LogSheetsOverlay";
import LogsWizard from "./trip/LogsWizard";
import TripMap from "./trip/TripMap";
import TripPanel from "./trip/TripPanel";

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function TripDetail() {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);

  function reload() {
    getTrip(getToken, id).then(setTrip).catch((err) => setError(err.message));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) {
    return (
      <main className="trip-error">
        <p>{error}</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className="trip-loading">
        <span className="trip-loading__spinner" aria-hidden="true" />
        <p>Loading your trip…</p>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <TripMap trip={trip} />

      <div className="dashboard-overlay-top">
        <p className="dashboard-greeting trip-summary">
          {trip.current_location_text} &rarr; {trip.pickup_location_text} &rarr; {trip.dropoff_location_text}
        </p>
      </div>

      <TripPanel trip={trip} />

      <div className="dashboard-actions">
        {trip.logs_generated ? (
          <button
            type="button"
            className="dashboard-action dashboard-action--ghost"
            onClick={() => setLogsOpen(true)}
          >
            <span className="dashboard-action__icon">
              <DocumentIcon />
            </span>
            View logs
          </button>
        ) : (
          <button
            type="button"
            className="dashboard-action dashboard-action--primary"
            onClick={() => setWizardOpen(true)}
          >
            <span className="dashboard-action__icon">
              <DocumentIcon />
            </span>
            Generate logs
          </button>
        )}
      </div>

      {wizardOpen && (
        <LogsWizard
          tripId={trip.id}
          onCancel={() => setWizardOpen(false)}
          onGenerated={(updated) => {
            setTrip(updated);
            setWizardOpen(false);
            setLogsOpen(true);
          }}
        />
      )}

      {logsOpen && <LogSheetsOverlay trip={trip} onCancel={() => setLogsOpen(false)} />}
    </main>
  );
}
