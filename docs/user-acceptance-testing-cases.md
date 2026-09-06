# User Acceptance Testing Cases

Each case below describes a scenario to test, how to trigger it, what should happen, and why, when the reasoning is not obvious from the rulebook alone.

## Case 1: Short trip, well within all limits

Explanation: A trip short enough that the driver never comes close to any HOS limit.

How the user arrives at this case: Enter a current location, pickup location, and dropoff location that are close together (for example, a total drive time under 4 hours), and a Current Cycle Used value of 0.

Expected output: One log sheet only. The grid shows Off Duty at the start, then a 1-hour On Duty (Not Driving) block for pickup, then Driving, then a 1-hour On Duty (Not Driving) block for dropoff, then Off Duty for the rest of the day. No breaks, resets, or restarts are needed. The four status totals sum to 24 hours.

## Case 2: Trip requiring one 30-minute break

Explanation: A trip long enough that the driver crosses 8 cumulative hours of driving.

How the user arrives at this case: Enter locations whose total driving time is more than 8 hours but still fits within the 11-hour driving limit and the 14-hour window.

Expected output: A 30-minute On Duty (Not Driving) or Off Duty block appears in the schedule at the 8-hour driving mark, before driving resumes.

Why: The 30-minute break rule triggers purely off cumulative driving time, not off elapsed trip time, so this case checks that the app is counting driving minutes specifically, not just wall-clock time.

## Case 3: Trip requiring a full 10-hour reset

Explanation: A trip long enough that the driver would exceed either the 11-hour driving limit or the 14-hour window in a single day.

How the user arrives at this case: Enter locations whose total drive time exceeds what can be completed within one 14-hour window.

Expected output: The schedule shows a 10-consecutive-hour Off Duty and/or Sleeper Berth block before driving resumes, and the 11-hour and 14-hour clocks restart at zero afterward. This pushes part of the trip into a second calendar day, producing a second log sheet.

## Case 4: Trip spanning multiple calendar days

Explanation: A trip long enough to span three or more calendar days.

How the user arrives at this case: Enter a very long trip, for example a cross-country route.

Expected output: One log sheet is generated per calendar day the trip touches, each with its own date, its own remarks, and its own status totals summing to 24 hours. The Multi-Day Log box is checked on every one of these sheets.

## Case 5: Trip requiring a fueling stop

Explanation: A trip long enough that the total driving distance passes 1,000 miles.

How the user arrives at this case: Enter locations more than 1,000 miles apart by road.

Expected output: A 30-minute On Duty (Not Driving) fueling stop appears in the schedule at or before the 1,000-mile mark, and is also marked on the route map.

## Case 6: Algorithm chooses a split sleeper-berth rest

Explanation: A trip where splitting the required rest into a 7-hour and a 2-3 hour block completes the trip faster than a single continuous 10-hour block.

How the user arrives at this case: Enter a trip whose total driving and on-duty time is just over what a single reset cycle would allow, in a way that a split rest would let the driver finish a day earlier.

Expected output: The schedule shows two separate rest periods (one of at least 7 consecutive hours in the sleeper berth, one of at least 2 consecutive hours off duty or in the sleeper berth) instead of one 10-hour block, and the 11-hour/14-hour totals around them are calculated using only the time between the two rest periods.

Why: This is the one case that specifically tests the split sleeper-berth rule, since the assessment's stated inputs give no direct way to request a split. It only shows up when the scheduling algorithm decides it is the more efficient option.

## Case 7: Driver hits the 70-hour cycle limit mid-trip

Explanation: A trip long enough, combined with a high enough Current Cycle Used value, that the rolling 8-day total reaches 70 hours before the trip is finished.

How the user arrives at this case: Enter a Current Cycle Used value close to 70 (for example, 65), together with a multi-day trip.

Expected output: The schedule shows the driver stopping all driving once the rolling total hits 70 hours, followed by a 34-consecutive-hour restart, after which the rolling total resets to zero and driving resumes.

## Case 8: Current Cycle Used entered as exactly 70

Explanation: The driver is already at the legal limit before the trip starts.

How the user arrives at this case: Enter 70 in the Current Cycle Used field.

Expected output: The schedule cannot include any driving until a 34-hour restart is completed first, since the driver has zero hours of cycle capacity left.

## Case 9: Current Cycle Used entered as 0

Explanation: The driver is starting a completely fresh 8-day cycle.

How the user arrives at this case: Enter 0 in the Current Cycle Used field.

Expected output: The full 70 hours are available for the trip, and the 70-hour limit is unlikely to affect the schedule unless the trip itself is very long.

## Case 10: Current location is the same as pickup location

Explanation: The driver is already at the pickup point when the trip starts.

How the user arrives at this case: Enter the same value for current location and pickup location.

Expected output: The schedule skips the first driving leg entirely and starts directly with the 1-hour pickup event.

## Case 11: Pickup location is the same as dropoff location

Explanation: A degenerate trip where no delivery driving is actually needed.

How the user arrives at this case: Enter the same value for pickup location and dropoff location.

Expected output: This should be flagged to the user as an invalid trip, since a pickup and dropoff at the same place is not a real trip to plan.

## Case 12: An unresolvable location is entered

Explanation: A location that the map API cannot geocode.

How the user arrives at this case: Enter a nonsense value, or a real place name that is too ambiguous to resolve, in the current, pickup, or dropoff location field.

Expected output: The form does not submit, and the user sees a clear message that the location could not be found.

## Case 13: Current Cycle Used entered as a negative number

Explanation: An invalid input value.

How the user arrives at this case: Enter a negative number, for example -5, in the Current Cycle Used field.

Expected output: The form does not submit, and the user sees a validation message.

## Case 14: Current Cycle Used entered as greater than 70

Explanation: An invalid input value, since 70 hours is the maximum the rolling cycle can hold.

How the user arrives at this case: Enter a number greater than 70, for example 80, in the Current Cycle Used field.

Expected output: The form does not submit, and the user sees a validation message.

## Case 15: Driver number entered with the wrong number of digits

Explanation: An invalid input value.

How the user arrives at this case: Enter a driver number with fewer or more than 7 digits.

Expected output: The form does not submit, and the user sees a validation message asking for exactly 7 digits.

## Case 16: Truck/trailer number entered in the wrong format

Explanation: An invalid input value.

How the user arrives at this case: Enter a truck/trailer number that does not follow the P__/T__ format, for example just "123456".

Expected output: The form does not submit, and the user sees a validation message showing the expected format.

## Case 17: Both shipping document number and shipper/commodity left blank

Explanation: At least one of these two fields is required for the log sheet to be complete.

How the user arrives at this case: Leave both the shipping document number field and the shipper name/commodity field empty, then try to submit.

Expected output: The form does not submit, and the user sees a validation message asking for at least one of the two.

## Case 18: Co-driver name left blank

Explanation: This field is genuinely optional.

How the user arrives at this case: Leave the co-driver name field empty and submit the form.

Expected output: The form submits successfully, and every generated log sheet shows "N/A" in the co-driver field.

## Case 19: Trip start time changed from the default

Explanation: The user overrides the default 6:00 AM start time.

How the user arrives at this case: Change the trip start date/time field to a different value, for example 2:00 PM, before submitting.

Expected output: The very first block on the first log sheet begins at the time the user entered, not at 6:00 AM, and the rest of the schedule is built from that starting point.

## Case 20: Trip distance lands exactly on the 1,000-mile fueling boundary

Explanation: A boundary condition for the fueling rule.

How the user arrives at this case: Enter locations whose route distance is as close to exactly 1,000 miles as can be arranged.

Expected output: A fueling stop is scheduled at or before the 1,000-mile mark, not after it. This confirms the rule is applied as "at least once every 1,000 miles" rather than only after the fact.

## Case 21: Daily log totals always sum to 24 hours

Explanation: A consistency check that applies to every log sheet the app ever generates, not just one scenario.

How the user arrives at this case: Generate log sheets for any of the trips above, especially the multi-day and split-rest cases, and check the total hours and minutes shown for each of the four duty statuses on every sheet.

Expected output: On every single log sheet, the four duty-status totals add up to exactly 24 hours, with no gaps and no overlaps.

## Case 22: Map shows all mandatory stops

Explanation: A check that the map output reflects the same schedule as the log sheets, not a separate or inconsistent calculation.

How the user arrives at this case: Generate a long trip that includes at least one rest period and one fueling stop, then view the map.

Expected output: Every rest period, break, and fueling stop that appears on the log sheets also appears as a marked stop on the map, at a location and time consistent with the log.

## Case 23: Sign up with email and password

Explanation: A new user creates an account the standard way.

How the user arrives at this case: On the sign-up screen, enter first name, last name, email, and password, then submit.

Expected output: An account is created and the user is signed in, landing on an empty trip history.

## Case 24: Sign up with Google

Explanation: A new user creates an account without setting a password.

How the user arrives at this case: On the sign-up screen, choose "Sign up with Google" and complete the Google flow.

Expected output: An account is created using the name and email from the Google account, and the user is signed in.

## Case 25: Signing in returns a user to their existing history

Explanation: A returning user's data persists across sessions.

How the user arrives at this case: Sign out, then sign back in with the same credentials.

Expected output: The user's previously generated trips and logs are still present in their history, unchanged.

## Case 26: Signing out

Explanation: A basic session-ending action.

How the user arrives at this case: Select "sign out" from the account menu.

Expected output: The user is returned to the sign-in screen and cannot view trip data until signing in again.

## Case 27: Attempting to generate a trip while signed out

Explanation: Trip generation is an account-gated action.

How the user arrives at this case: Without signing in, try to submit the trip form directly (for example, by navigating to the form URL).

Expected output: The user is redirected to sign in before the trip form can be submitted.

## Case 28: Generating a trip without any log header details

Explanation: Confirms the two-phase flow actually works as designed — Phase 1 should never ask for driver/carrier details.

How the user arrives at this case: Sign in with a fresh account that has never filled in a driver/carrier profile, and generate a trip using only current location, pickup, dropoff, and Current Cycle Used.

Expected output: The route map and trip breakdown are shown successfully, with no prompt for driver number, truck number, carrier name, or any other profile field.

## Case 29: Using a preset trip

Explanation: A user who doesn't want to type in locations manually.

How the user arrives at this case: On the trip form, select one of the listed preset trips instead of typing locations.

Expected output: Current location, pickup location, dropoff location, and Current Cycle Used are pre-filled from the preset. The user can still edit any of these fields before generating the trip.

## Case 30: Adjusting the Current Cycle Used slider

Explanation: Confirms the slider and the numeric field for this input stay in sync.

How the user arrives at this case: Drag the Current Cycle Used slider to a new value.

Expected output: The numeric field updates to match the slider position, and vice versa if the numeric field is edited directly.

## Case 31: Editing the driver/carrier profile before generating logs

Explanation: Profile fields should genuinely reduce repeated typing.

How the user arrives at this case: Fill in the driver/carrier profile once in account settings, then generate logs for two separate trips without re-entering those fields either time.

Expected output: Both trips' log sheets show the same driver number, driver name, truck/trailer numbers, carrier name, main office address, and time base, taken from the profile without being retyped.

## Case 32: Editing the profile after a trip's logs were already generated

Explanation: This is the key test of the snapshot behavior described in assumptions.md — a generated log sheet must not retroactively change.

How the user arrives at this case: Generate logs for a trip, note the truck number shown on the log sheet, then go to account settings and change the truck number on the profile, then reopen the same trip from history.

Expected output: The trip's log sheets still show the original truck number that was in effect when the logs were generated, not the newly updated one. A brand-new trip generated after the profile change does show the updated truck number.

## Case 33: Exporting a log sheet as PNG

Explanation: One of the two supported export formats.

How the user arrives at this case: On a generated log sheet, select "Export as PNG."

Expected output: A PNG image file downloads, visually matching the on-screen log sheet, including the 45-degree remarks text.

## Case 34: Exporting a log sheet as PDF

Explanation: The other supported export format.

How the user arrives at this case: On a generated log sheet, select "Export as PDF."

Expected output: A PDF file downloads, visually matching the on-screen log sheet.

## Case 35: Reopening a Phase-1-only trip from history

Explanation: A trip the user previewed but never generated logs for should still be reachable.

How the user arrives at this case: Generate a trip (Phase 1 only, no logs), then navigate away, then open it again from the trip history list.

Expected output: The route map and trip breakdown reload exactly as before. There are no log sheets to view, and the option to generate logs is still available.

## Case 36: Reopening a trip with generated logs from history

Explanation: A fully completed trip should be reachable with all of its output intact.

How the user arrives at this case: Generate logs for a trip, then navigate away, then open it again from the trip history list.

Expected output: The route map, trip breakdown, and all of that trip's log sheets reload exactly as they were generated, and each log sheet can be exported again.
