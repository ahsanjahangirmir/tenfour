import { useEffect, useRef, useState } from "react";
import { ensureLoaded, isLoaded, searchCities } from "../lib/citySearch";

const MIN_CHARS = 2;
const BLUR_COMMIT_DELAY_MS = 120; // lets a suggestion's onClick land before we revert on blur

/**
 * A location field that only accepts a value the user picked from the
 * suggestion list — typed text that was never selected is discarded when
 * the field loses focus, so the trip form can never submit a free-typed,
 * unvalidated location string. Suggestions come from an in-memory
 * dataset (see lib/citySearch.js), so there is no network round-trip
 * while typing — every keystroke is a synchronous, local array scan.
 */
export default function LocationAutocomplete({ id, value, onChange, placeholder }) {
  const [draft, setDraft] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [datasetReady, setDatasetReady] = useState(isLoaded());

  const blurTimeoutRef = useRef(null);

  // Keep the draft in sync if the parent resets/changes the committed
  // value programmatically (e.g. clearing the whole form).
  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (!datasetReady) {
      ensureLoaded().then(() => setDatasetReady(true));
    }
  }, [datasetReady]);

  useEffect(() => () => clearTimeout(blurTimeoutRef.current), []);

  function handleInput(text) {
    setDraft(text);
    const results = searchCities(text);
    setSuggestions(results);
    setOpen(results.length > 0);
    setHighlighted(-1);
  }

  function selectSuggestion(suggestion) {
    clearTimeout(blurTimeoutRef.current);
    setDraft(suggestion.label);
    onChange(suggestion.label);
    setSuggestions([]);
    setOpen(false);
  }

  function handleBlur() {
    // Deferred so a suggestion's onClick (which fires after blur) still
    // gets a chance to commit a real selection first.
    blurTimeoutRef.current = setTimeout(() => {
      setDraft((currentDraft) => {
        if (currentDraft.trim() === "") {
          if (value !== "") onChange("");
          return currentDraft;
        }
        return currentDraft === value ? currentDraft : value;
      });
      setOpen(false);
    }, BLUR_COMMIT_DELAY_MS);
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown" && open && suggestions.length > 0) {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && open && suggestions.length > 0) {
      e.preventDefault();
      setHighlighted((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (open && highlighted >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[highlighted]);
      } else {
        e.preventDefault();
      }
    } else if (e.key === "Escape") {
      setDraft(value);
      setOpen(false);
    }
  }

  const needsSelection = draft.trim().length >= MIN_CHARS && draft !== value && !open;

  return (
    <div className="autocomplete">
      <input
        id={id}
        type="text"
        autoComplete="off"
        placeholder={datasetReady ? placeholder : "Loading places…"}
        value={draft}
        disabled={!datasetReady}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <ul className="autocomplete__list">
          {suggestions.map((s, i) => (
            <li
              key={s.label}
              className={i === highlighted ? "autocomplete__item autocomplete__item--active" : "autocomplete__item"}
              onClick={() => selectSuggestion(s)}
              onMouseEnter={() => setHighlighted(i)}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
      {needsSelection && <p className="field__error">Select a location from the list.</p>}
    </div>
  );
}
