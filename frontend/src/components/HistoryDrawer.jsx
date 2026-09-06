import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HistoryDrawer.css";
import { formatUtcDate } from "../lib/datetime";
import { deleteTrip, listTrips } from "../lib/trips";

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.8 12.2a2 2 0 0 1-2 1.8H9.8a2 2 0 0 1-2-1.8L7 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HistoryDrawer({ open, onClose }) {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState(null);
  const [error, setError] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deletingInFlight, setDeletingInFlight] = useState(false);

  // Fetches on every open (not just the first), but never clears the existing
  // list first — so a reopen shows cached data instantly and only quietly
  // refreshes in the background instead of flashing back to a loading state.
  useEffect(() => {
    if (!open) return;
    listTrips(getToken)
      .then(setTrips)
      .catch((err) => setError(err.message));
  }, [open, getToken]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  function openTrip(id) {
    onClose();
    navigate(`/trips/${id}`);
  }

  function startDelete(id) {
    setDeleteError(null);
    setDeletingId(id);
  }

  function cancelDelete() {
    setDeletingId(null);
    setDeleteError(null);
  }

  async function confirmDelete(id) {
    setDeletingInFlight(true);
    setDeleteError(null);
    try {
      await deleteTrip(getToken, id);
      setTrips((prev) => prev.filter((trip) => trip.id !== id));
      setDeletingId(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeletingInFlight(false);
    }
  }

  return (
    <div className={`history-drawer${open ? " history-drawer--visible" : ""}`}>
      <div className="history-drawer__backdrop" onClick={onClose} />
      <aside className="history-drawer__panel">
        <div className="history-drawer__top">
          <p className="history-drawer__eyebrow">Trip history</p>
          <button type="button" className="history-drawer__close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="history-drawer__body">
          {error && <p className="history-drawer__hint history-drawer__hint--error">{error}</p>}
          {!error && trips === null && (
            <div className="history-drawer__loading">
              <span className="history-drawer__spinner" aria-hidden="true" />
            </div>
          )}
          {!error && trips?.length === 0 && (
            <p className="history-drawer__hint">No trips yet. Plan your first one from the dashboard.</p>
          )}
          {trips?.map((trip) =>
            deletingId === trip.id ? (
              <div key={trip.id} className="history-drawer__confirm">
                <span>Delete this trip? This can't be undone.</span>
                <div className="history-drawer__confirm-actions">
                  <button
                    type="button"
                    className="history-drawer__confirm-btn history-drawer__confirm-btn--danger"
                    onClick={() => confirmDelete(trip.id)}
                    disabled={deletingInFlight}
                  >
                    {deletingInFlight ? "Deleting…" : "Delete"}
                  </button>
                  <button
                    type="button"
                    className="history-drawer__confirm-btn"
                    onClick={cancelDelete}
                    disabled={deletingInFlight}
                  >
                    Cancel
                  </button>
                </div>
                {deleteError && <p className="history-drawer__hint history-drawer__hint--error">{deleteError}</p>}
              </div>
            ) : (
              <div key={trip.id} className="history-drawer__item">
                <button type="button" className="history-drawer__item-main" onClick={() => openTrip(trip.id)}>
                  <span className="history-drawer__route">
                    {trip.current_location_text} &rarr; {trip.pickup_location_text} &rarr; {trip.dropoff_location_text}
                  </span>
                  <span className="history-drawer__meta">
                    {formatUtcDate(trip.trip_start_datetime)} &middot;{" "}
                    {trip.distance_miles.toFixed(0)} mi &middot; {trip.total_days} day
                    {trip.total_days === 1 ? "" : "s"} &middot;{" "}
                    {trip.logs_generated ? "Logs generated" : "Route only"}
                  </span>
                </button>
                <button
                  type="button"
                  className="history-drawer__delete"
                  aria-label="Delete trip"
                  onClick={() => startDelete(trip.id)}
                >
                  <TrashIcon />
                </button>
              </div>
            ),
          )}
        </div>
      </aside>
    </div>
  );
}
