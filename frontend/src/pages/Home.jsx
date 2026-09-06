import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import "./home/Home.css";
import useInView from "./home/useInView";

function Reveal({ as: Tag = "div", delay, className = "", children, ...rest }) {
  const [ref, inView] = useInView();
  const delayClass = delay ? ` landing-reveal--${delay}` : "";
  return (
    <Tag
      ref={ref}
      className={`landing-reveal${delayClass}${inView ? " landing-reveal--visible" : ""} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 17 17 7M9 7h8v8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STEPS = [
  {
    title: "Describe the trip",
    body: "Current location, pickup, dropoff, and how many hours you've already used in your cycle. Four fields — no paperwork yet.",
  },
  {
    title: "See if it's legal, instantly",
    body: "TenFour simulates the trip hour by hour against Hours of Service rules and shows the route, every mandatory stop, and a full breakdown before you commit.",
  },
  {
    title: "Generate the paperwork",
    body: "Confirm your driver and carrier details once, and get properly formatted daily log sheets — one per day of the trip, ready to export.",
  },
];

const FEATURES = [
  {
    key: "a",
    title: "Route + mandatory stops",
    body: "A color-coded map from current location to pickup to dropoff, with every 30-minute break, fuel stop, rest period, and 34-hour restart marked and explained.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 19c3-6 6-9 8-9s3 3 3 6 2 4 5-2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="4" cy="19" r="1.6" fill="currentColor" />
        <circle cx="20" cy="14" r="1.6" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "b",
    title: "Trip breakdown",
    body: "Distance, driving hours, days on the road, time in each duty status, number of rests and fuel stops — the whole shape of the trip at a glance.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 18V11M12 18V6M19 18v-8"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "c",
    title: "DOT-style daily logs",
    body: "One fully filled-out log sheet per calendar day, formatted like the official form, ready to export as PNG or PDF.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="3.5" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "d",
    title: "History that remembers you",
    body: "Every trip and every log you generate is saved to your account. Driver and carrier details are entered once, not retyped for every trip.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M12 8v4l3 2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main className="landing">
      <section className="landing-hero">
        <div className="landing__container landing-hero__inner">
          <div className="landing-hero__content">
            <p className="landing-eyebrow">Hours-of-service trip planning</p>
            <h1 className="landing-hero__title">
              Know your trip is legal
              <br />
              <em>before you turn the key.</em>
            </h1>
            <p className="landing-hero__lede">
              TenFour takes your current location, pickup, and dropoff, and
              simulates the trip hour by hour against Hours of Service rules
              — before you commit to it. See the route, every mandatory
              stop, and the full breakdown in seconds.
            </p>

            <div className="landing-hero__actions">
              <SignedOut>
                <Link to="/sign-up" className="landing-btn landing-btn--primary">
                  Plan your first trip
                  <span className="landing-btn__icon">
                    <ArrowIcon />
                  </span>
                </Link>
                <Link to="/sign-in" className="landing-btn landing-btn--ghost">
                  Sign in
                  <span className="landing-btn__icon">
                    <ArrowIcon />
                  </span>
                </Link>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard" className="landing-btn landing-btn--primary">
                  Go to your dashboard
                  <span className="landing-btn__icon">
                    <ArrowIcon />
                  </span>
                </Link>
              </SignedIn>
            </div>

            <p className="landing-hero__note">
              Free to start. Email and password, or Google sign-in.
            </p>
          </div>

          <div className="landing-hero__visual">
            <div className="landing-visual-card">
              <div className="landing-visual-card__inner">
                <p className="landing-visual-card__label">Today's route</p>
                <svg
                  className="landing-route-svg"
                  viewBox="0 0 320 150"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M18,118 C70,118 70,50 130,48 S 190,96 255,60 S 290,26 302,22"
                    stroke="rgba(238,248,247,0.35)"
                    strokeWidth="2"
                    strokeDasharray="1 9"
                    strokeLinecap="round"
                  />
                  <circle cx="18" cy="118" r="4" fill="#eef8f7" />
                  <circle cx="102" cy="58" r="6" fill="#bbdddb" />
                  <circle cx="196" cy="86" r="6" fill="#ff4162" />
                  <circle cx="270" cy="42" r="6" fill="#ffffff" />
                  <path d="M296,26 302,22 296,18" stroke="#eef8f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <ul className="landing-legend">
                  <li className="landing-legend__item">
                    <span className="landing-legend__swatch" style={{ background: "#bbdddb" }} />
                    Rest period
                  </li>
                  <li className="landing-legend__item">
                    <span className="landing-legend__swatch" style={{ background: "#ff4162" }} />
                    Fuel stop
                  </li>
                  <li className="landing-legend__item">
                    <span className="landing-legend__swatch" style={{ background: "#ffffff" }} />
                    30-min break
                  </li>
                </ul>
              </div>
            </div>

            <div className="landing-log-peek" aria-hidden="true">
              <p className="landing-log-peek__title">Daily log — Day 2</p>
              <div className="landing-log-peek__bars">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>

        <svg
          className="landing-hero__divider"
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,64 C240,10 480,90 720,50 C960,10 1200,90 1440,40 L1440,90 L0,90 Z"
            fill="#bbdddb"
          />
        </svg>
      </section>

      <section className="landing-section landing-section--mint">
        <div className="landing__container">
          <Reveal className="landing-section__head">
            <p className="landing-section__eyebrow">How it works</p>
            <h2 className="landing-section__title">
              Two steps, in the order that matters
            </h2>
            <p className="landing-section__lede">
              You shouldn't have to fill out a full driver profile just to
              see if a route is even possible. TenFour splits trip planning
              from paperwork on purpose.
            </p>
          </Reveal>

          <ol className="landing-steps">
            {STEPS.map((step, index) => (
              <Reveal
                as="li"
                key={step.title}
                delay={index === 1 ? "d1" : index === 2 ? "d2" : undefined}
                className="landing-step"
              >
                <div className="landing-step__inner">
                  <span className="landing-step__index">{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-section landing-section--white">
        <div className="landing__container">
          <Reveal className="landing-section__head">
            <p className="landing-section__eyebrow">What you get</p>
            <h2 className="landing-section__title">Everything a trip needs</h2>
          </Reveal>

          <div className="landing-bento">
            {FEATURES.map((feature) => (
              <Reveal
                key={feature.key}
                className={`landing-bento__card landing-bento__card--${feature.key}`}
              >
                <div className="landing-bento__inner">
                  <span className="landing-bento__icon">{feature.icon}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--white">
        <div className="landing__container">
          <Reveal className="landing-cta__banner">
            <div className="landing-cta__glow" aria-hidden="true" />
            <h2>Stop guessing where you'll have to stop.</h2>
            <p>
              Sign up, describe a trip, and see whether it's legal in the
              time it takes to fill out four fields.
            </p>
            <SignedOut>
              <Link to="/sign-up" className="landing-btn landing-btn--light landing-btn--solo">
                Create your free account
                <span className="landing-btn__icon">
                  <ArrowIcon />
                </span>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard" className="landing-btn landing-btn--light landing-btn--solo">
                Go to your dashboard
                <span className="landing-btn__icon">
                  <ArrowIcon />
                </span>
              </Link>
            </SignedIn>
          </Reveal>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing__container landing-footer__inner">
          <div>
            <div className="landing-footer__brand">
              <span className="landing-footer__mark" aria-hidden="true">
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
            </div>
            <p className="landing-footer__tagline">
              Trip planning and HOS logs for truck drivers.
            </p>
          </div>
          <p className="landing-footer__meta">© 2026 TenFour.</p>
        </div>
      </footer>
    </main>
  );
}
