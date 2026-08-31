# Calendar integration

**Status:** Planned. Not implemented.

## Purpose

Surface deadlines and meetings as inputs to WorkItems and daily/weekly review.

## System of record

The calendar provider is canonical for events. JS OS does not become a second calendar.

## Data JS OS may read

Event ids, titles, times, and attendees as needed for scheduling WorkItems (`sourceType = CALENDAR`).

## Actions JS OS may eventually request

Create or update events only through a future tool. Inviting external attendees is a communication-like action.

## Expected approval considerations

Internal holds: lower risk. External invites and cancellations: approval policy TBD with the tool.

## Implementation status

Planned. Enum `CALENDAR` is reserved. No provider chosen.
