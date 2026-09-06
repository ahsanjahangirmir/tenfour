# Assumptions

These are the assumptions the app and its business logic are built on. If any of these change, the underlying logic needs to be revisited.

## From the assessment brief

- The driver is a property-carrying driver, not a passenger-carrying driver.
- The driver operates under the 70-hour/8-day on-duty cycle, not the 60-hour/7-day cycle.
- No adverse driving conditions apply during the trip.
- The truck must refuel at least once every 1,000 miles of driving.
- Pickup takes exactly 1 hour.
- Dropoff takes exactly 1 hour.

## Confirmed from the FMCSA guide, consistent with the assessment brief

- No short-haul exceptions (CDL short-haul, non-CDL short-haul, or 16-hour short-haul) apply to this driver.
- No other regulatory exception in the FMCSA guide's Appendix A applies to this driver's situation.

## Decided while scoping this app

- The trip-scheduling algorithm is allowed to use split sleeper-berth rest periods (for example, 7 hours in the sleeper berth plus 2 hours off duty), not just a single continuous 10-hour rest block, whenever a split produces a more time-efficient trip.
- A fueling stop takes 30 minutes.
- The trip start date and time default to 6:00 AM on the current date, and the user can change it before submitting the trip.
- The trip consists of exactly one pickup and one dropoff. There is no multi-stop routing.
- Log header fields not covered by the assessment's four stated inputs (driver number, driver name, truck/trailer numbers, carrier name, main office address, time base, shipping document/shipper info, co-driver name) are collected as additional input fields, split between the user's account profile and the per-trip form as described below.
- The driver's initials are derived automatically from the driver's entered full name, rather than being entered separately.
- Total truck mileage for a given day is treated as equal to total driving miles for that day, since the app does not track separate vehicle odometer history. This is a simplification worth confirming, since a real ELD may track these as two different numbers.
- Co-driver name defaults to "N/A" if the user leaves it blank.

## Decided while finalizing accounts and architecture

- The app requires user accounts. A user signs up and signs in with either email/password or Google sign-in.
- Driver number, driver full name, truck/trailer numbers, carrier name, main office address, and time base are stored once on the user's account profile, editable at any time, and reused across all of that user's trips.
- Shipping document number (or shipper name and commodity) and co-driver name remain per-trip inputs, entered fresh each time, since they genuinely change from trip to trip.
- Trip generation happens in two phases: a "Generate Trip" step using only the four trip-specific inputs plus trip start time, which produces the map and trip breakdown; and a "Generate Logs" step, which uses the driver/carrier profile plus the two remaining trip-specific fields to produce the official log sheets.
- A "Generate Trip" (Phase 1) is saved to the user's history as soon as it's created, even if the user never proceeds to generate logs for it.
- When logs are generated for a trip, the driver/carrier profile values in effect at that moment are copied onto the trip record permanently, so a previously generated log does not change if the user edits their profile later.
- The user can select from a small set of predefined popular trips to skip manually entering the four trip-specific inputs.
- The app is scoped to United States addresses and routing only.
- No exported log sheet (PNG or PDF) is stored on the server. Exports are generated on demand in the user's browser from the trip's saved data.
