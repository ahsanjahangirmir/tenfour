# Rulebook

This document lists every rule the app's business logic follows. Every rule here respects the assumptions in assumptions.md. For example, because the driver is property-carrying and on the 70-hour/8-day cycle, no passenger-carrying or 60-hour/7-day rules appear anywhere below, and no short-haul or adverse-conditions exceptions appear either.

## Duty statuses

- There are exactly four duty statuses: Off Duty, Sleeper Berth, Driving, and On Duty (Not Driving).
- Off Duty means the driver is completely relieved of all work and is free to leave the vehicle.
- Sleeper Berth means the driver is resting in the truck's sleeper compartment. It counts as off-duty rest.
- Driving means the driver is at the physical controls of the truck while it is in operation.
- On Duty (Not Driving) covers all other work time: waiting to be dispatched, inspecting or fueling the truck, loading/unloading, handling paperwork, and yard moves.
- Every minute of the trip is assigned exactly one of these four statuses. There is no unassigned time.

## Trip structure

- The trip consists of two driving legs: current location to pickup location, and pickup location to dropoff location.
- The 1-hour pickup event happens after the driver arrives at the pickup location and before driving toward the dropoff begins. It is logged as On Duty (Not Driving).
- The 1-hour dropoff event happens after the driver arrives at the dropoff location. It is logged as On Duty (Not Driving).

## 11-hour driving limit

- A driver can drive a maximum of 11 cumulative hours before a qualifying reset is required.
- Only actual driving time counts toward this 11-hour total. On-duty-not-driving time does not count toward it.
- Once 11 hours of driving is reached, the app cannot schedule further driving until a qualifying reset happens.

## 14-hour driving window

- A driver can only drive within a 14-consecutive-hour window that starts the moment the driver first goes on duty after a qualifying reset.
- The 14-hour window includes all on-duty time, both driving and on-duty-not-driving. It does not pause for breaks.
- Once 14 hours have passed since the window started, the driver cannot drive again until a qualifying reset happens, even if they have not yet used all 11 hours of driving.
- Exception: when a valid sleeper-berth split pairing is used (see below), neither of the two rest periods counts against the 14-hour window.

## Qualifying reset

- A qualifying reset of both the 11-hour and 14-hour clocks requires 10 consecutive hours of Off Duty and/or Sleeper Berth time, or a combination of the two.
- After a qualifying reset, both the 11-hour driving clock and the 14-hour window clock go back to zero.

## Sleeper berth split

- The app's scheduling logic is allowed to split the driver's required 10-hour rest into two separate periods, instead of always using one continuous 10-hour block, whenever a split makes the trip more time-efficient.
- A valid split needs one period of at least 7 consecutive hours in the sleeper berth, and a second period of at least 2 consecutive hours spent in the sleeper berth or otherwise off duty.
- The two periods together must add up to at least 10 hours.
- When a valid split pair is used, neither rest period counts against the 14-hour driving window.
- The 11-hour and 14-hour limits are recalculated using only the driving and on-duty time that falls between the end of the first qualifying rest period and the start of the second qualifying rest period. The first rest period itself is excluded from that count.
- Each time a new qualifying rest period is completed, the calculation restarts from the end of that period.
- The app is not required to use a split. It can also use one continuous 10-hour reset when that is simpler or just as efficient.

## 30-minute break

- A driver cannot keep driving once more than 8 cumulative hours of driving have passed since the end of their last break of at least 30 consecutive minutes.
- This break does not have to be Off Duty. It can be logged as On Duty (Not Driving), Off Duty, Sleeper Berth, or a consecutive combination of these, as long as it adds up to 30 minutes.
- The app schedules a 30-minute break after every 8 cumulative hours of driving.

## 70-hour / 8-day cycle limit

- A driver cannot drive once their on-duty time, driving plus on-duty-not-driving, over the trailing 8 consecutive days reaches 70 hours.
- The 8-day total is a rolling window. Each day, the oldest day's hours drop out of the total, and the newest day's hours are added in.
- The trip's starting point for this rolling total is the Current Cycle Used (Hrs) value the user enters.
- If the 70-hour limit is reached mid-trip, the driver cannot drive, but can still do on-duty-not-driving work. Driving cannot resume until the rolling total drops back below 70 hours, or the driver takes a 34-hour restart.

## 34-hour restart

- A driver can reset their rolling 8-day on-duty total to zero by taking 34 or more consecutive hours off duty and/or in the sleeper berth.
- The app inserts a 34-hour restart into the schedule only when the 70-hour limit would otherwise make it impossible to complete the trip.

## Fueling stops

- The truck must stop to refuel at least once every 1,000 miles of driving.
- Each fueling stop takes 30 minutes and is logged as On Duty (Not Driving).

## Ruleset scope

- Only the property-carrying driver ruleset applies. Passenger-carrying rules are never used.
- Only the 70-hour/8-day cycle applies. The 60-hour/7-day cycle is never used.
- The adverse driving conditions exception never applies.
- The CDL short-haul exception, the non-CDL short-haul exception, and the 16-hour short-haul exception never apply.
- No other exception listed in Appendix A of the FMCSA guide applies to this app's scenario.

## Daily log sheet structure

- One log sheet covers exactly one calendar day, midnight to midnight.
- A trip spanning more than one calendar day needs one separate log sheet per day.
- Each log sheet has a 24-hour graph grid with four rows, one per duty status.
- A status is drawn as a horizontal line for as long as it lasts, connected by a vertical line at the moment the driver switches to a different status.
- A remark showing the city and state, or the nearest highway and milepost, is recorded every time the duty status changes.
- The four duty-status totals on a given log sheet always add up to exactly 24 hours.
- The Multi-Day Log box is automatically checked on every log sheet that belongs to a trip spanning more than one day.

## Log sheet header fields

- Each log sheet includes: 7-digit driver number, driver initials, the log's date in MM/DD/YYYY format, total driving miles for that day, total truck mileage for that day, truck/tractor and trailer number(s) in P__/T__ format, carrier name, main office address, driver's signature, time base used, total hours and minutes per duty status, shipping document number or shipper name and commodity, and co-driver name.
- Driver number, driver name, truck/trailer numbers, carrier name, main office address, time base, shipping document/shipper info, and co-driver name are entered once by the user on the trip form and reused on every log sheet generated for that trip.
- Driver initials are derived automatically from the driver's entered full name.
- Total driving miles for a given day come from the portion of the route actually driven on that calendar day.
- Total truck mileage for a given day is treated as equal to total driving miles for that day.
- Total hours and minutes per duty status are calculated by adding up the time blocks assigned to that status on that day's grid.
- Co-driver name defaults to "N/A" if the user leaves it blank.

## Trip start time

- The trip's start date and time default to 6:00 AM on the current date.
- The user can change the trip start date and time to a different value before submitting the trip.
