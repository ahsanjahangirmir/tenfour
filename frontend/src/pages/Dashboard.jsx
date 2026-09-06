import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentPosition } from "../lib/geolocation";
import { useHistoryDrawer } from "../lib/historyDrawerStore";
import { listTrips } from "../lib/trips";
import "./dashboard/Dashboard.css";
import DashboardMap from "./dashboard/DashboardMap";
import TripWizard from "./dashboard/TripWizard";

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Dashboard() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { openHistory } = useHistoryDrawer();

  const [tripCount, setTripCount] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    listTrips(getToken)
      .then((trips) => setTripCount(trips.length))
      .catch(() => setTripCount(0));
  }, [getToken]);

  useEffect(() => {
    getCurrentPosition()
      .then(setUserLocation)
      .catch(() => setUserLocation(null));
  }, []);

  return (
    <main className="dashboard-shell">
      <DashboardMap userLocation={userLocation} />

      <div className="dashboard-overlay-top">
        <p className="dashboard-greeting">Where to today?</p>
      </div>

      <div className="dashboard-actions">
        <button
          type="button"
          className="dashboard-action dashboard-action--primary"
          onClick={() => setWizardOpen(true)}
        >
          <span className="dashboard-action__icon">
            <PlusIcon />
          </span>
          New trip
        </button>
        <button
          type="button"
          className="dashboard-action dashboard-action--ghost"
          onClick={openHistory}
        >
          <span className="dashboard-action__icon">
            <HistoryIcon />
          </span>
          History
          {tripCount > 0 && <span className="dashboard-action__badge">{tripCount}</span>}
        </button>
      </div>

      {wizardOpen && (
        <TripWizard
          userLocation={userLocation}
          onCancel={() => setWizardOpen(false)}
          onCreated={(trip) => navigate(`/trips/${trip.id}`)}
        />
      )}
    </main>
  );
}
