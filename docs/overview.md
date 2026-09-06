# Overview

## Purpose

This app helps a truck driver figure out, before a trip even starts, whether a trip from their current location to a pickup point and then to a dropoff point is legally possible under US trucking Hours of Service (HOS) rules, and if so, exactly how the trip should be broken up across days with rest, breaks, and fuel stops.

Truck drivers are legally required to record what they are doing every minute of the day (driving, working but not driving, resting in the sleeper berth, or fully off duty) on a daily log sheet, and they are legally limited in how many hours they can drive and work before they must rest. These are the Hours of Service rules. This app takes a trip's details, simulates the trip hour by hour against those rules, and produces two things: a route map showing where the driver needs to stop along the way, and a set of daily log sheets, already filled out, showing exactly what the driver was doing at every point of the trip.

The app has user accounts, so a driver's trips and generated logs are saved to their history and can be revisited later, and their own driver/carrier details only need to be entered once rather than retyped for every trip.

In short: the user signs in, describes a trip, and immediately sees whether it's legal and where the mandatory stops are. If they want the official paperwork for that trip, they can generate it, export it, and find it again later in their history.

## Accounts

Users sign up and sign in with either an email address and password, or with Google sign-in. An account holds: first name, last name, email, and the driver/carrier profile defaults described below. Authentication is handled by Clerk.

## The two-phase trip flow

Generating a trip happens in two steps, so the user isn't forced to fill in every field just to see the route.

**Phase 1 — Generate Trip.** The user provides only the trip-specific inputs that affect where the truck goes: current location, pickup location, dropoff location, current cycle used hours, and the trip start date/time (defaults to 6:00 AM, editable). The user can also skip manual entry by picking from a list of popular preset trips, which pre-fill these fields. This alone is enough to produce the route map, the color-coded stops, and the trip breakdown (distance, driving hours, days, time in each duty status, number of rests, number of fuel stops).

**Phase 2 — Generate Logs.** If the user wants the official daily log paperwork, they confirm or edit their driver/carrier profile and provide two remaining trip-specific fields, and the app generates the full log sheets.

## Inputs

**Driver/carrier profile (set once per account, editable any time, reused across trips):**

- Driver number (7 digits)
- Driver's full name (used to derive initials and as the signature on the log)
- Truck/tractor number and trailer number, in P__/T__ format
- Name of carrier
- Main office address of the carrier
- Time base (time zone) to be used on the logs

**Per-trip inputs, entered in Phase 1:**

- Current location
- Pickup location
- Dropoff location
- Current Cycle Used (Hrs) — how many hours the driver has already used in their rolling 70-hour/8-day cycle
- Trip start date and time — defaults to 6:00 AM on the current date, but the user can change it

**Per-trip inputs, entered in Phase 2 (only if the user generates logs):**

- Shipping document number, or shipper name and commodity (at least one of the two)
- Name of co-driver (optional — defaults to "N/A" if left blank)

## Values the app calculates on its own

The user does not provide these. The app works them out from the inputs above, from the map API, and from the driver profile:

- The driving route and its distance and duration
- How many calendar days the trip will span, and how many log sheets are needed
- The exact schedule of driving, on-duty-not-driving, sleeper berth, and off-duty blocks across the whole trip
- Where mandatory 30-minute breaks, fueling stops, rest periods, and any 34-hour restart fall along the trip
- The date shown on each log sheet
- The driver's initials, from the full name on the profile
- Total driving miles and total truck mileage for each day (the app treats these as the same value, since it does not track separate vehicle odometer history)
- The total hours and minutes recorded for each duty status on each day (these always add up to 24)
- Whether the Multi-Day Log box is checked on a given log sheet
- The city/state (or highway/milepost) remarks recorded at every duty status change

## Outputs

1. A map showing the calculated driving route from current location to pickup to dropoff, with all mandatory stops (rests, breaks, fueling stops) marked along the way and a legend explaining each marker.
2. A trip breakdown summary: distance, driving hours, number of days, time in each duty status, number of rests, number of fuel stops.
3. One or more daily log sheets, one per calendar day the trip spans, each fully filled out and formatted as an official document, exportable as PNG or PDF.
4. A history of the user's past trips and generated logs, each reopenable.
