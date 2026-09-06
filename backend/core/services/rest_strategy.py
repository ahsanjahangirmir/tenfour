"""Rest Strategy (Strategy pattern) — docs/spec.md section 7. The
simulation service asks this layer to pick whichever qualifying-rest
approach produces a valid, more time-efficient trip once either the
11-hour driving limit or the 14-hour window forces a stop.
"""

from abc import ABC, abstractmethod

FULL_RESET_MINUTES = 10 * 60
SPLIT_FIRST_HALF_MINUTES = 7 * 60
SPLIT_SECOND_HALF_MINUTES = 2 * 60 + 30  # comfortably clears the 2-hour minimum


class RestStrategy(ABC):
    name = None

    @abstractmethod
    def apply(self, builder, state):
        """Inserts the rest block(s) via `builder` and mutates `state`
        (core.services.trip_simulation.SimulationState) so the caller's
        loop sees the clocks it left behind."""


class FullResetStrategy(RestStrategy):
    """One continuous 10-hour block. Fully resets the 11-hour driving
    clock, the 14-hour window, and the 30-minute-break clock."""

    name = "full_reset"

    def apply(self, builder, state):
        builder.add("sleeper_berth", FULL_RESET_MINUTES, stop_type="10hr_rest")
        state.driving_since_reset = 0
        state.driving_since_break = 0
        state.window_start = None


class SplitSleeperStrategy(RestStrategy):
    """Only the first (7-hour) half. Neither half counts against the
    14-hour window, so the caller keeps the window closed and tracks an
    "in-between" stretch bounded only by the 11-hour driving clock, until
    it calls `complete()` to insert the second (>=2-hour) half and fully
    reset all three clocks."""

    name = "split_sleeper"

    def apply(self, builder, state):
        builder.add(
            "sleeper_berth", SPLIT_FIRST_HALF_MINUTES, stop_type="10hr_rest", is_split_sleeper=True
        )
        state.driving_since_reset = 0
        state.driving_since_break = 0
        state.window_start = None
        state.in_split_between = True
        state.split_pending_second_half = True

    def complete(self, builder, state):
        builder.add(
            "sleeper_berth", SPLIT_SECOND_HALF_MINUTES, stop_type="10hr_rest", is_split_sleeper=True
        )
        state.driving_since_reset = 0
        state.driving_since_break = 0
        state.window_start = None
        state.in_split_between = False
        state.split_pending_second_half = False


def choose_strategy(binding_constraint):
    """binding_constraint is "window" when the 14-hour window expired
    while driving-hour budget was still available, or "driving" when the
    11-hour driving cap itself was reached.

    A full reset always resets both clocks, so when the driving cap is
    what's binding there's nothing left for a split to save — the driving
    clock needs zeroing either way, and a split only adds a second stop.
    When the window is what's binding, the driver still has driving
    budget left that a full 10-hour block would waste; a 7-hour sleeper
    break (which doesn't count against the window) lets driving resume
    sooner and use that leftover budget before a second, shorter break.
    """
    if binding_constraint == "window":
        return SplitSleeperStrategy()
    return FullResetStrategy()
