# Acceptance Criteria

## Deliverables and submission

- The system can be accessed via a live hosted URL.
- I can watch a 3-5 minute Loom video walking through the app and code.
- I can access the complete source code via a shared GitHub repository.

## Accounts

- I can sign up for an account using my email and password.
- I can sign up for an account using my Google account.
- I can sign in using my email and password.
- I can sign in using my Google account.
- I can sign out of my account.
- The system cannot let me view or generate any trip without being signed in.

## Driver/carrier profile

- I can view my saved driver/carrier profile.
- I can edit my driver number, driver full name, truck/trailer numbers, carrier name, main office address, and time base at any time.
- The system cannot accept a driver number that is not exactly 7 digits.
- The system cannot accept a truck/trailer number that does not follow the P__/T__ format.
- The system can pre-fill these fields from my profile whenever I generate logs for a trip.
- I can override a profile field for a single trip without changing my saved profile.

## Trip generation — Phase 1 (route and breakdown)

- I can enter a current location for the trip.
- I can enter a pickup location for the trip.
- I can enter a dropoff location for the trip.
- I can enter the number of hours already used in my current 70-hour/8-day cycle.
- I can accept a default trip start date and time of 6:00 AM on the current date.
- I can change the trip start date and time to a different value.
- I can select a preset trip to pre-fill the current location, pickup location, dropoff location, and current cycle used.
- I can still edit any preset's pre-filled values before generating the trip.
- The system cannot require driver, carrier, or vehicle details before showing me the route map.
- The system cannot submit the trip form if any required field is missing or invalid.
- The system cannot accept a Current Cycle Used value that is negative or greater than 70 hours.
- The system can save a generated trip to my history as soon as it's created, even if I never generate logs for it.
- I can see a trip breakdown after generating a trip: distance, driving hours, number of days, time spent in each duty status, number of rest periods, and number of fuel stops.

## Trip generation — Phase 2 (logs)

- I can generate logs for a previously created trip by confirming or editing my profile.
- I can enter a shipping document number, or alternatively a shipper name and commodity description.
- I can enter the name of a co-driver.
- I can leave the co-driver field blank, and the system defaults it to "N/A".
- The system cannot let me generate logs without at least one of shipping document number or shipper name and commodity.
- The system can copy my profile's values, as they exist at that moment, onto the trip's log sheets permanently.
- I cannot see a previously generated log sheet change if I edit my profile after the fact.

## Route and map output

- The system can calculate a driving route between the current location, pickup location, and dropoff location using a free map API.
- I can view the calculated route on a map.
- I can see the locations of all mandatory stops, including rest breaks, fueling stops, and overnight rests, marked on the map.
- I can see a color-coded legend on the map explaining each marker: current location, pickup, dropoff, fuel stop, 30-minute break, 10-hour sleeper rest, and 34-hour cycle reset.
- I can see a distinct marker or label for a split sleeper-berth rest, separate from a full 10-hour rest.
- The system cannot generate a route if any of the three locations cannot be resolved to a valid place.

## Hours of Service simulation and scheduling

- The system can simulate the entire trip hour by hour, starting from the trip start date/time, and assign one of the four duty statuses to every block of time.
- The system can insert a 1-hour On Duty (Not Driving) block at the start of the trip for pickup.
- The system can insert a 1-hour On Duty (Not Driving) block at the end of the trip for dropoff.
- The system can insert a 30-minute fueling stop, logged as On Duty (Not Driving), at least once every 1,000 miles of driving.
- The system can insert a 30-minute break after 8 cumulative hours of driving.
- The system cannot schedule driving past 11 cumulative hours of driving without a qualifying reset in between.
- The system cannot schedule driving past 14 hours elapsed since the driver came on duty, without a qualifying reset in between.
- The system can reset the 11-hour and 14-hour clocks after 10 consecutive hours of Off Duty and/or Sleeper Berth time.
- The system can generate a split sleeper-berth rest schedule instead of a single 10-hour block, when doing so results in a more time-efficient trip.
- The system can recalculate the 11-hour and 14-hour limits around a valid split sleeper-berth rest pairing, following the qualifying-break recalculation rule.
- The system can track the driver's Current Cycle Used hours as a rolling 8-day total, starting from the value the user entered.
- The system cannot schedule driving once the rolling 8-day on-duty total reaches 70 hours.
- The system can allow the driver to continue non-driving on-duty work even after the 70-hour cycle limit is reached.
- The system can insert a 34-consecutive-hour restart to reset the rolling cycle total to zero, when needed to continue the trip.
- The system cannot apply any short-haul, adverse-driving-conditions, or other regulatory exception to the simulation.

## Daily log sheet output

- The system can generate one daily log sheet per calendar day the trip spans.
- I can view a 24-hour graph grid on each log sheet, with the four duty statuses drawn as connected horizontal and vertical lines.
- I can see remarks on each log sheet showing the city and state, or the highway and milepost, for every duty status change.
- I can see the date of each log sheet in MM/DD/YYYY format.
- I can see my 7-digit driver number and derived initials on each log sheet.
- I can see the total driving miles and total truck mileage for that day on each log sheet.
- I can see the truck/tractor and trailer number(s) in P__/T__ format on each log sheet.
- I can see the carrier name and main office address on each log sheet.
- I can see my typed name as the driver's signature on each log sheet.
- I can see the time base used on each log sheet.
- I can see the total hours and minutes for each of the four duty statuses on each log sheet.
- I cannot see a log sheet where the four duty status totals do not add up to exactly 24 hours.
- I can see the shipping document number, or the shipper name and commodity, on each log sheet.
- I can see the co-driver's name, or "N/A" if none was entered, on each log sheet.
- I can see a Multi-Day Log indicator marked automatically on each log sheet when the trip spans more than one day.

## Log sheet formatting

- I can see each log sheet formatted as an official document, with the grid, header fields, and remarks laid out like a real DOT daily log.
- I can see remarks text on each log sheet rendered at a 45-degree angle.
- I can see summary statistics across all log sheets when a trip spans multiple days: date range, total driving time, total distance covered.

## Export

- I can export any single log sheet as a PNG image.
- I can export any single log sheet as a PDF.

## Trip history

- I can view a list of my past trips.
- I can reopen any past trip to see its route and breakdown again.
- I can reopen a trip with generated logs to see its log sheets again.
- I can export a log sheet again from a past trip in my history.
