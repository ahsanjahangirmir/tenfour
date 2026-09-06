import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useHistoryDrawer } from "../lib/historyDrawerStore";

const SIGNED_IN_LINKS = [{ to: "/dashboard", label: "New trip" }];

function BrandMark() {
  return (
    <span className="navbar__mark" aria-hidden="true">
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
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const { openHistory } = useHistoryDrawer();
  const location = useLocation();
  const onDashboard = location.pathname === "/dashboard";

  function handleOpenHistory() {
    close();
    openHistory();
  }

  return (
    <header className="navbar">
      <div className="navbar__pill">
        <SignedIn>
          <Link to="/dashboard" className="navbar__brand" onClick={close}>
            <BrandMark />
            TenFour
          </Link>
        </SignedIn>
        <SignedOut>
          <Link to="/" className="navbar__brand" onClick={close}>
            <BrandMark />
            TenFour
          </Link>
        </SignedOut>

        <nav className="navbar__actions">
          <SignedOut>
            <Link to="/sign-in" className="navbar__link">
              Sign in
            </Link>
            <Link to="/sign-up" className="navbar__cta">
              Get started
            </Link>
          </SignedOut>
          <SignedIn>
            {!onDashboard && (
              <>
                {SIGNED_IN_LINKS.map((link) => (
                  <Link key={link.to} to={link.to} className="navbar__link">
                    {link.label}
                  </Link>
                ))}
                <button type="button" className="navbar__link" onClick={handleOpenHistory}>
                  History
                </button>
              </>
            )}
            <span className="navbar__user">
              <UserButton afterSignOutUrl="/" />
            </span>
          </SignedIn>
        </nav>

        <button
          type="button"
          className={`navbar__toggle${open ? " navbar__toggle--open" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
        </button>
      </div>

      <div className={`navbar__mobile${open ? " navbar__mobile--open" : ""}`}>
        <SignedOut>
          <Link to="/sign-in" className="navbar__mobile-link" style={{ transitionDelay: "0.05s" }} onClick={close}>
            Sign in
          </Link>
          <Link to="/sign-up" className="navbar__mobile-link" style={{ transitionDelay: "0.1s" }} onClick={close}>
            Get started
          </Link>
        </SignedOut>
        <SignedIn>
          {!onDashboard &&
            SIGNED_IN_LINKS.map((link, index) => (
              <Link
                key={link.to}
                to={link.to}
                className="navbar__mobile-link"
                style={{ transitionDelay: `${0.05 + index * 0.05}s` }}
                onClick={close}
              >
                {link.label}
              </Link>
            ))}
          {!onDashboard && (
            <button
              type="button"
              className="navbar__mobile-link"
              style={{ transitionDelay: `${0.05 + SIGNED_IN_LINKS.length * 0.05}s` }}
              onClick={handleOpenHistory}
            >
              History
            </button>
          )}
          <span
            className="navbar__mobile-user"
            style={{
              transitionDelay: `${0.05 + (onDashboard ? 0 : SIGNED_IN_LINKS.length + 1) * 0.05}s`,
            }}
          >
            <UserButton afterSignOutUrl="/" />
          </span>
        </SignedIn>
      </div>
    </header>
  );
}
