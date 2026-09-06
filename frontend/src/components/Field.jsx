export default function Field({ label, tooltip, htmlFor, children, error }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor} className="field__label">
        {label}
        {tooltip && (
          <span className="field__tooltip" tabIndex={0}>
            <span className="field__tooltip-icon" aria-hidden="true">
              i
            </span>
            <span className="field__tooltip-text" role="tooltip">
              {tooltip}
            </span>
          </span>
        )}
      </label>
      {children}
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}
