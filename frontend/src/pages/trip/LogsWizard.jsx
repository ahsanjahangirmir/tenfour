import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import Field from "../../components/Field";
import { generateLogs } from "../../lib/trips";

const STEPS = ["driver_number", "driver_name", "vehicle", "carrier", "time_base", "shipping", "co_driver", "review"];

const DRIVER_NUMBER_RE = /^\d{7}$/;
const TRUCK_RE = /^P\d+$/;
const TRAILER_RE = /^T\d+$/;

const EMPTY_FORM = {
  driver_number: "",
  driver_full_name: "",
  truck_number: "",
  trailer_number: "",
  carrier_name: "",
  carrier_address: "",
  time_base: "",
  shipping_document_number: "",
  shipper_name: "",
  commodity: "",
  co_driver_name: "",
};

const CLOSE_ANIMATION_MS = 380;

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function LogsWizard({ tripId, onCancel, onGenerated }) {
  const { getToken } = useAuth();

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState("forward");
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

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

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleCancel() {
    setClosing(true);
    setTimeout(onCancel, CLOSE_ANIMATION_MS);
  }

  function validateStep(step) {
    const errors = {};
    if (step === "driver_number") {
      if (!form.driver_number.trim()) errors.driver_number = "Required.";
      else if (!DRIVER_NUMBER_RE.test(form.driver_number)) errors.driver_number = "Must be exactly 7 digits.";
    }
    if (step === "driver_name" && !form.driver_full_name.trim()) {
      errors.driver_full_name = "Required.";
    }
    if (step === "vehicle") {
      if (!form.truck_number.trim()) errors.truck_number = "Required.";
      else if (!TRUCK_RE.test(form.truck_number)) errors.truck_number = "Must be in P__ format, e.g. P123456.";
      if (!form.trailer_number.trim()) errors.trailer_number = "Required.";
      else if (!TRAILER_RE.test(form.trailer_number)) errors.trailer_number = "Must be in T__ format, e.g. T123456.";
    }
    if (step === "carrier") {
      if (!form.carrier_name.trim()) errors.carrier_name = "Required.";
      if (!form.carrier_address.trim()) errors.carrier_address = "Required.";
    }
    if (step === "time_base" && !form.time_base.trim()) {
      errors.time_base = "Required.";
    }
    if (step === "shipping") {
      const hasShippingDoc = form.shipping_document_number.trim().length > 0;
      const hasShipperInfo = form.shipper_name.trim().length > 0 && form.commodity.trim().length > 0;
      if (!hasShippingDoc && !hasShipperInfo) {
        errors.shipping_document_number = "Enter a shipping document number, or both shipper name and commodity.";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateAll() {
    return STEPS.filter((s) => s !== "review" && s !== "co_driver").every((s) => validateStep(s));
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

  async function handleSubmit() {
    setSubmitError(null);
    if (!validateAll()) {
      setSubmitError("Some details need fixing — check the steps above.");
      return;
    }
    setSubmitting(true);
    try {
      const trip = await generateLogs(getToken, tripId, form);
      onGenerated(trip);
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
  const questionSteps = STEPS.length - 1;

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
            aria-label="Cancel and return to the trip"
            onClick={handleCancel}
          >
            <CloseIcon />
          </button>
        </div>

        <form className="wizard-body" onSubmit={handleFormSubmit}>
          <div key={step} className={`wizard-step wizard-step--${direction}`}>
            {step === "driver_number" && (
              <>
                <p className="wizard-eyebrow">Step 1 of {questionSteps}</p>
                <h2 className="wizard-question">What's your driver number?</h2>
                <p className="wizard-subtext">Exactly 7 digits — this goes on the printed log.</p>
                <Field htmlFor="lw-driver-number" error={fieldErrors.driver_number}>
                  <input
                    id="lw-driver-number"
                    type="text"
                    placeholder="1234567"
                    value={form.driver_number}
                    onChange={(e) => update("driver_number", e.target.value)}
                  />
                </Field>
              </>
            )}

            {step === "driver_name" && (
              <>
                <p className="wizard-eyebrow">Step 2 of {questionSteps}</p>
                <h2 className="wizard-question">What's your full name?</h2>
                <p className="wizard-subtext">Used to derive your initials and as the signature on the log.</p>
                <Field htmlFor="lw-driver-name" error={fieldErrors.driver_full_name}>
                  <input
                    id="lw-driver-name"
                    type="text"
                    placeholder="Jane Doe"
                    value={form.driver_full_name}
                    onChange={(e) => update("driver_full_name", e.target.value)}
                  />
                </Field>
              </>
            )}

            {step === "vehicle" && (
              <>
                <p className="wizard-eyebrow">Step 3 of {questionSteps}</p>
                <h2 className="wizard-question">What's your truck and trailer number?</h2>
                <p className="wizard-subtext">In P__ / T__ format, as shown on the units.</p>
                <Field label="Truck/tractor number" htmlFor="lw-truck" error={fieldErrors.truck_number}>
                  <input
                    id="lw-truck"
                    type="text"
                    placeholder="P123456"
                    value={form.truck_number}
                    onChange={(e) => update("truck_number", e.target.value)}
                  />
                </Field>
                <Field label="Trailer number" htmlFor="lw-trailer" error={fieldErrors.trailer_number}>
                  <input
                    id="lw-trailer"
                    type="text"
                    placeholder="T123456"
                    value={form.trailer_number}
                    onChange={(e) => update("trailer_number", e.target.value)}
                  />
                </Field>
              </>
            )}

            {step === "carrier" && (
              <>
                <p className="wizard-eyebrow">Step 4 of {questionSteps}</p>
                <h2 className="wizard-question">Who's the carrier?</h2>
                <p className="wizard-subtext">Name and main office address, exactly as they should appear on the log.</p>
                <Field label="Carrier name" htmlFor="lw-carrier-name" error={fieldErrors.carrier_name}>
                  <input
                    id="lw-carrier-name"
                    type="text"
                    value={form.carrier_name}
                    onChange={(e) => update("carrier_name", e.target.value)}
                  />
                </Field>
                <Field label="Carrier main office address" htmlFor="lw-carrier-address" error={fieldErrors.carrier_address}>
                  <input
                    id="lw-carrier-address"
                    type="text"
                    value={form.carrier_address}
                    onChange={(e) => update("carrier_address", e.target.value)}
                  />
                </Field>
              </>
            )}

            {step === "time_base" && (
              <>
                <p className="wizard-eyebrow">Step 5 of {questionSteps}</p>
                <h2 className="wizard-question">What time zone should the logs use?</h2>
                <p className="wizard-subtext">This is the time base printed on each log sheet.</p>
                <Field htmlFor="lw-time-base" error={fieldErrors.time_base}>
                  <input
                    id="lw-time-base"
                    type="text"
                    placeholder="Central"
                    value={form.time_base}
                    onChange={(e) => update("time_base", e.target.value)}
                  />
                </Field>
              </>
            )}

            {step === "shipping" && (
              <>
                <p className="wizard-eyebrow">Step 6 of {questionSteps}</p>
                <h2 className="wizard-question">What's being shipped?</h2>
                <p className="wizard-subtext">
                  Enter a shipping document number, or a shipper name and commodity — whichever you have.
                </p>
                <Field
                  label="Shipping document number"
                  htmlFor="lw-shipping-doc"
                  error={fieldErrors.shipping_document_number}
                >
                  <input
                    id="lw-shipping-doc"
                    type="text"
                    value={form.shipping_document_number}
                    onChange={(e) => update("shipping_document_number", e.target.value)}
                  />
                </Field>
                <p className="wizard-or">or</p>
                <Field label="Shipper name" htmlFor="lw-shipper-name">
                  <input
                    id="lw-shipper-name"
                    type="text"
                    value={form.shipper_name}
                    onChange={(e) => update("shipper_name", e.target.value)}
                  />
                </Field>
                <Field label="Commodity" htmlFor="lw-commodity">
                  <input
                    id="lw-commodity"
                    type="text"
                    value={form.commodity}
                    onChange={(e) => update("commodity", e.target.value)}
                  />
                </Field>
              </>
            )}

            {step === "co_driver" && (
              <>
                <p className="wizard-eyebrow">Step 7 of {questionSteps}</p>
                <h2 className="wizard-question">Riding with a co-driver?</h2>
                <p className="wizard-subtext">Optional — leave blank if you're driving solo.</p>
                <Field htmlFor="lw-co-driver">
                  <input
                    id="lw-co-driver"
                    type="text"
                    placeholder="N/A"
                    value={form.co_driver_name}
                    onChange={(e) => update("co_driver_name", e.target.value)}
                  />
                </Field>
              </>
            )}

            {step === "review" && (
              <>
                <p className="wizard-eyebrow">Ready?</p>
                <h2 className="wizard-question">Let's generate the paperwork.</h2>
                <p className="wizard-subtext">Review the details, or jump back to change anything.</p>

                <ul className="wizard-review">
                  <li className="wizard-review__item">
                    <button type="button" onClick={() => jumpTo(0)}>
                      <span>Driver number</span>
                      <strong>{form.driver_number}</strong>
                    </button>
                  </li>
                  <li className="wizard-review__item">
                    <button type="button" onClick={() => jumpTo(1)}>
                      <span>Driver name</span>
                      <strong>{form.driver_full_name}</strong>
                    </button>
                  </li>
                  <li className="wizard-review__item">
                    <button type="button" onClick={() => jumpTo(2)}>
                      <span>Truck / trailer</span>
                      <strong>{form.truck_number} / {form.trailer_number}</strong>
                    </button>
                  </li>
                  <li className="wizard-review__item">
                    <button type="button" onClick={() => jumpTo(3)}>
                      <span>Carrier</span>
                      <strong>{form.carrier_name}</strong>
                    </button>
                  </li>
                  <li className="wizard-review__item">
                    <button type="button" onClick={() => jumpTo(4)}>
                      <span>Time base</span>
                      <strong>{form.time_base}</strong>
                    </button>
                  </li>
                  <li className="wizard-review__item">
                    <button type="button" onClick={() => jumpTo(5)}>
                      <span>Shipping</span>
                      <strong>
                        {form.shipping_document_number || `${form.shipper_name} / ${form.commodity}`}
                      </strong>
                    </button>
                  </li>
                  <li className="wizard-review__item">
                    <button type="button" onClick={() => jumpTo(6)}>
                      <span>Co-driver</span>
                      <strong>{form.co_driver_name || "N/A"}</strong>
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
              {step === "review" ? (submitting ? "Generating logs…" : "Generate logs") : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
