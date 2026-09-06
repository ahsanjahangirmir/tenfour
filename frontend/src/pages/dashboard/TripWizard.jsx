import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import Field from "../../components/Field";
import LocationAutocomplete from "../../components/LocationAutocomplete";
import { defaultTripStart, localDatetimeToIso } from "../../lib/datetime";
import { getCurrentPosition, reverseGeocode } from "../../lib/geolocation";
import { createTrip } from "../../lib/trips";

const STEPS = ["current", "pickup", "dropoff", "cycle", "start", "review"];

const EMPTY_FORM = {
  current_location_text: "",
  pickup_location_text: "",
  dropoff_location_text: "",
  current_cycle_used_hours: 0,
  trip_start_datetime: defaultTripStart(),
};

const CLOSE_ANIMATION_MS = 380;

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LocateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default function TripWizard({ userLocation, onCancel, onCreated }) {
  const { getToken } = useAuth();

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState("forward");
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") handleCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleCancel() {
    setClosing(true);
    setTimeout(onCancel, CLOSE_ANIMATION_MS);
  }

  function validateStep(step) {
    const errors = {};
    if (step === "current" && !form.current_location_text.trim()) {
      errors.current_location_text = "Required.";
    }
    if (step === "pickup" && !form.pickup_location_text.trim()) {
      errors.pickup_location_text = "Required.";
    }
    if (step === "dropoff" && !form.dropoff_location_text.trim()) {
      errors.dropoff_location_text = "Required.";
    }
    if (step === "cycle") {
      const cycle = Number(form.current_cycle_used_hours);
      if (Number.isNaN(cycle) || cycle < 0 || cycle > 70) {
        errors.current_cycle_used_hours = "Must be between 0 and 70 hours.";
      }
    }
    if (step === "start" && !form.trip_start_datetime) {
      errors.trip_start_datetime = "Required.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function goNext() {
    const step = STEPS[stepIndex];
    if (!validateStep(step)) return;
    setDirection("forward");
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setDirection("back");
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function jumpTo(index) {
    setDirection(index > stepIndex ? "forward" : "back");
    setStepIndex(index);
  }

  async function handleUseCurrentLocation() {
    setLocateError(null);
    setLocating(true);
    try {
      const coords = userLocation ?? (await getCurrentPosition());
      const label = await reverseGeocode(coords.lat, coords.lon);
      updateField("current_location_text", label);
      setTimeout(goNext, 450);
    } catch {
      setLocateError("Couldn't detect your location — enter it manually.");
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const trip = await createTrip(getToken, {
        ...form,
        current_cycle_used_hours: Number(form.current_cycle_used_hours),
        trip_start_datetime: localDatetimeToIso(form.trip_start_datetime),
      });
      onCreated(trip);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    if (STEPS[stepIndex] === "review") {
      handleSubmit();
    } else {
      goNext();
    }
  }

  const step = STEPS[stepIndex];

  return (
    <div className={`wizard-overlay${mounted && !closing ? " wizard-overlay--visible" : ""}`}>
      <div className="wizard-overlay__backdrop" onClick={handleCancel} />
      <div className="wizard-panel">
        <div className="wizard-panel__top">
          <div className="wizard-progress">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`wizard-progress__dot${i <= stepIndex ? " wizard-progress__dot--active" : ""}`}
              />
            ))}
          </div>
          <button
            type="button"
            className="wizard-close"
            aria-label="Cancel and return to dashboard"
            onClick={handleCancel}
          >
            <CloseIcon />
          </button>
        </div>

        <form className="wizard-body" onSubmit={handleFormSubmit}>
          <div key={step} className={`wizard-step wizard-step--${direction}`}>
            {step === "current" && (
              <>
                <p className="wizard-eyebrow">Step 1 of 5</p>
                <h2 className="wizard-question">What is your current location?</h2>
                <p className="wizard-subtext">
                  Where you and the truck are right now, before heading to pickup.
                </p>
                <Field htmlFor="wizard-current" error={fieldErrors.current_location_text}>
                  <LocationAutocomplete
                    id="wizard-current"
                    placeholder="e.g. Dallas, TX"
                    value={form.current_location_text}
                    onChange={(value) => updateField("current_location_text", value)}
                  />
                </Field>
                <button
                  type="button"
                  className="wizard-locate"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                >
                  <LocateIcon />
                  {locating ? "Locating…" : "Use my current location"}
                </button>
                {locateError && <p className="field__error">{locateError}</p>}
              </>
            )}

            {step === "pickup" && (
              <>
                <p className="wizard-eyebrow">Step 2 of 5</p>
                <h2 className="wizard-question">Where are you picking up the load?</h2>
                <p className="wizard-subtext">This counts as a fixed 1-hour on-duty stop.</p>
                <Field htmlFor="wizard-pickup" error={fieldErrors.pickup_location_text}>
                  <LocationAutocomplete
                    id="wizard-pickup"
                    placeholder="e.g. Fort Worth, TX"
                    value={form.pickup_location_text}
                    onChange={(value) => updateField("pickup_location_text", value)}
                  />
                </Field>
              </>
            )}

            {step === "dropoff" && (
              <>
                <p className="wizard-eyebrow">Step 3 of 5</p>
                <h2 className="wizard-question">Where are you dropping it off?</h2>
                <p className="wizard-subtext">Also a fixed 1-hour on-duty stop.</p>
                <Field htmlFor="wizard-dropoff" error={fieldErrors.dropoff_location_text}>
                  <LocationAutocomplete
                    id="wizard-dropoff"
                    placeholder="e.g. Waco, TX"
                    value={form.dropoff_location_text}
                    onChange={(value) => updateField("dropoff_location_text", value)}
                  />
                </Field>
              </>
            )}

            {step === "cycle" && (
              <>
                <p className="wizard-eyebrow">Step 4 of 5</p>
                <h2 className="wizard-question">How many hours have you used in your cycle?</h2>
                <p className="wizard-subtext">
                  Hours already used in your rolling 70-hour/8-day on-duty cycle. 0 means a fresh cycle.
                </p>
                <div className="wizard-cycle">
                  <span className="wizard-cycle__value">
                    {form.current_cycle_used_hours}
                    <small>hrs</small>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={70}
                    step={0.5}
                    value={form.current_cycle_used_hours}
                    onChange={(e) => updateField("current_cycle_used_hours", e.target.value)}
                  />
                </div>
                {fieldErrors.current_cycle_used_hours && (
                  <p className="field__error">{fieldErrors.current_cycle_used_hours}</p>
                )}
              </>
            )}

            {step === "start" && (
              <>
                <p className="wizard-eyebrow">Step 5 of 5</p>
                <h2 className="wizard-question">When does the trip start?</h2>
                <p className="wizard-subtext">Defaults to 6:00 AM today — change it if needed.</p>
                <Field htmlFor="wizard-start" error={fieldErrors.trip_start_datetime}>
                  <input
                    id="wizard-start"
                    type="datetime-local"
                    value={form.trip_start_datetime}
                    onChange={(e) => updateField("trip_start_datetime", e.target.value)}
                  />
                </Field>
              </>
            )}

            {step === "review" && (
              <>
                <p className="wizard-eyebrow">Ready?</p>
                <h2 className="wizard-question">Let's check this trip.</h2>
                <p className="wizard-subtext">Review the details, or jump back to change anything.</p>

                <ul className="wizard-review">
                  <li className="wizard-review__item">
                    <button type="button" onClick={() => jumpTo(0)}>
                      <span>Current location</span>
                      <strong>{form.current_location_text}</strong>
                    </button>
                  </li>
                  <li className="wizard-review__item">
                    <button type="button" onClick={() => jumpTo(1)}>
                      <span>Pickup</span>
                      <strong>{form.pickup_location_text}</strong>
                    </button>
                  </li>
                  <li className="wizard-review__item">
                    <button type="button" onClick={() => jumpTo(2)}>
                      <span>Dropoff</span>
                      <strong>{form.dropoff_location_text}</strong>
                    </button>
                  </li>
                  <li className="wizard-review__item">
                    <button type="button" onClick={() => jumpTo(3)}>
                      <span>Cycle used</span>
                      <strong>{form.current_cycle_used_hours} hrs</strong>
                    </button>
                  </li>
                  <li className="wizard-review__item">
                    <button type="button" onClick={() => jumpTo(4)}>
                      <span>Start</span>
                      <strong>{new Date(form.trip_start_datetime).toLocaleString()}</strong>
                    </button>
                  </li>
                </ul>

                {submitError && <p className="trip-form__submit-error">{submitError}</p>}
              </>
            )}
          </div>

          <div className="wizard-actions">
            {stepIndex > 0 && (
              <button type="button" className="wizard-btn wizard-btn--ghost" onClick={goBack}>
                Back
              </button>
            )}
            <button type="submit" className="wizard-btn wizard-btn--primary" disabled={submitting}>
              {step === "review" ? (submitting ? "Checking the route…" : "Generate trip") : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
