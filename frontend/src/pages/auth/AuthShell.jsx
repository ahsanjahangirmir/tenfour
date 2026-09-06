import { Link } from "react-router-dom";
import "./Auth.css";

export default function AuthShell({ eyebrow, children }) {
  return (
    <main className="auth-shell">
      <div className="auth-shell__glow" aria-hidden="true" />
      <div className="auth-shell__inner">
        <Link to="/" className="auth-shell__brand">
          <span className="auth-shell__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12h4l2-5 4 10 2-5h6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          TenFour
        </Link>
        <p className="auth-shell__eyebrow">{eyebrow}</p>
        <div className="auth-shell__card">{children}</div>
      </div>
    </main>
  );
}
