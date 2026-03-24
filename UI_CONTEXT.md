# PickleMatch VN UI Context

## Product Summary

PickleMatch VN is a mobile app for finding, creating, joining, approving, and managing pickleball sessions in Vietnam.

Core stack:

- React Native + Expo Router
- Supabase Auth + Postgres
- TypeScript

Primary user goals:

- Browse available sessions
- Filter and find suitable sessions
- Create a new session
- Request to join or directly join a session
- Approve or reject join requests as host
- Track notifications
- Manage player profile

## Navigation Structure

Bottom tabs live in [`app/(tabs)/_layout.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/_layout.tsx):

- `Home` / [`app/(tabs)/index.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/index.tsx)
- `My Sessions` / [`app/(tabs)/my-sessions.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/my-sessions.tsx)
- `Find Session` / [`app/(tabs)/find-session.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/find-session.tsx)
- `Notifications` / [`app/(tabs)/notifications.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/notifications.tsx)
- `Profile` / [`app/(tabs)/profile.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/profile.tsx)

Non-tab screens:

- [`app/create-session.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/create-session.tsx)
- [`app/session/[id].tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/session/[id].tsx)
- [`app/player/[id].tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/player/[id].tsx)
- [`app/rate-session/[id].tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/rate-session/[id].tsx)
- [`app/login.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/login.tsx)
- [`app/profile-setup.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/profile-setup.tsx)
- [`app/edit-profile.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/edit-profile.tsx)

## Main Screens

### 1. Home

File: [`app/(tabs)/index.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/index.tsx)

Purpose:

- Landing screen after login
- Shows session cards with tabs:
  - open
  - full
  - done
  - all

Current card content:

- court name
- address + city
- time range
- session status
- participation status
- price
- host name
- court booking status:
  - `Sân đã xác nhận`
  - `Sân chưa xác nhận`

Tone:

- functional
- card-based
- fast scanning

### 2. Find Session

File: [`app/(tabs)/find-session.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/find-session.tsx)

Purpose:

- more advanced discovery screen
- filterable session list

Current filters:

- city
- skill level
- date
- remaining spots only

Current card content is similar to Home:

- court name
- city
- address
- time
- skill
- player count
- price
- host
- court booking status

### 3. My Sessions

File: [`app/(tabs)/my-sessions.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/my-sessions.tsx)

Purpose:

- combines sessions where user is host and sessions where user joined

Current card content:

- court name
- overall session status
- time + city
- role:
  - host
  - joined player
- player count
- court booking status

### 4. Session Detail

File: [`app/session/[id].tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/session/[id].tsx)

This is the most important action screen.

Current content:

- back button
- share action
- court name + address
- manual approval badge if enabled
- court booking status badge
- booking info block if any exists
- time
- skill range
- price
- player list
- pending join requests for host

Role-specific actions:

- non-host:
  - join session
  - request to join
  - leave session
- host:
  - approve request
  - reject request
  - cancel session
  - confirm court booking later by entering booking info

State-heavy areas:

- joined vs not joined
- host vs player
- open vs full vs done vs cancelled
- approval required vs direct join
- court confirmed vs unconfirmed

### 5. Create Session

File: [`app/create-session.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/create-session.tsx)

3-step flow:

#### Step 1: Choose court + time

- nearby courts or fallback search
- date picker
- free-form start/end time

#### Step 2: Configure session

- max players
- elo min / max
- fill deadline
- approval requirement
- total court cost
- court booking confirmation flow

New booking flow:

- user must declare whether court is already booked/confirmed
- if not confirmed, app asks whether they want to book now
- if they book now, app can open court booking link
- booking info fields:
  - booking reference
  - booking name
  - booking phone
  - booking notes
- confirmed state requires booking info
- unconfirmed state can still publish, but host must update later

#### Step 3: Review + publish

- summary card
- booking status summary
- optional booking summary
- submit CTA

### 6. Notifications

File: [`app/(tabs)/notifications.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/notifications.tsx)

Current notification types in app:

- `join_request`
- `join_approved`
- `join_rejected`
- `player_left`
- `session_cancelled`

Behavior:

- unread count badge in tab bar
- tapping a notification deep-links into the session

### 7. Profile

Files:

- [`app/(tabs)/profile.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/profile.tsx)
- [`app/edit-profile.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/edit-profile.tsx)
- [`app/profile-setup.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/profile-setup.tsx)

Current profile areas:

- avatar initials
- city
- phone
- ELO
- reliability
- hosted count
- session history
- favorite courts in edit profile

## Core Entities

### Players

Used for:

- profile
- skill level / ELO
- reliability / no-show tracking
- notifications owner

### Sessions

Important session fields already in use:

- `host_id`
- `slot_id`
- `elo_min`
- `elo_max`
- `max_players`
- `status`
- `require_approval`
- `fill_deadline`
- `total_cost`
- `court_booking_status`
- `booking_reference`
- `booking_name`
- `booking_phone`
- `booking_notes`
- `booking_confirmed_at`

### Courts

Used for:

- court discovery
- address / city
- hours open / close
- pricing
- booking link

Relevant fields:

- `name`
- `address`
- `city`
- `hours_open`
- `hours_close`
- `price_per_hour`
- `booking_url`
- `google_maps_url`

### Court Slots

Used as the actual booked time range for a session.

### Session Requests

Used when host approval is required.

States:

- `pending`
- `approved`
- `rejected`

### Notifications

Used for in-app inbox and badge count.

## Important Product States

These states matter a lot for UI design:

### Session lifecycle

- `open`
- `done`
- `cancelled`

### Join model

- direct join
- approval required

### User role inside a session

- guest / not logged in
- host
- joined player
- requested player
- rejected player

### Court booking state

- confirmed
- unconfirmed

This is now visible on:

- session cards
- session detail
- create session review

## Current UX Style

Current design language in the codebase:

- bright white background
- green as primary accent
- rounded cards
- emoji-supported labels
- straightforward utilitarian layout
- mobile-first density

Patterns already used:

- vertically stacked cards
- pill badges
- large CTA buttons
- inline status chips
- simple segmented filters

## UI Opportunities

If you are redesigning UI, the highest-value areas are:

### Session cards

Opportunity:

- make scanability much stronger
- visually separate match status from court booking status
- improve hierarchy between court, time, and skill

### Session detail

Opportunity:

- this screen does too much right now
- can be reorganized into:
  - summary hero
  - booking state
  - players
  - host actions
  - join actions

### Create session

Opportunity:

- step 2 is now more complex because of booking-state logic
- likely needs better grouping and progressive disclosure
- booking flow should feel trustworthy and low-friction

### Notifications

Opportunity:

- could be much more expressive
- stronger grouping by event type
- clearer CTA affordances

## Constraints For UI Design

- Must work well on mobile first
- App is already using Expo Router file-based navigation
- Existing flows are Supabase-driven and stateful
- Host actions and player actions must remain clearly distinct
- Booking confirmation is now a first-class product concept
- Approval flow is important and should not be buried

## Suggested Design Priorities

If designing from highest impact first:

1. Session card system
2. Session detail information architecture
3. Create session wizard redesign
4. Profile polish
5. Notifications polish

## Useful Files To Review

- [`app/(tabs)/index.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/index.tsx)
- [`app/(tabs)/find-session.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/find-session.tsx)
- [`app/(tabs)/my-sessions.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/my-sessions.tsx)
- [`app/session/[id].tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/session/[id].tsx)
- [`app/create-session.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/create-session.tsx)
- [`app/(tabs)/notifications.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/notifications.tsx)
- [`app/(tabs)/profile.tsx`](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/profile.tsx)
- [`lib/useNearbyCourts.ts`](/c:/Users/quock/OneDrive/picklematch-vn/lib/useNearbyCourts.ts)
- [`lib/notifications.ts`](/c:/Users/quock/OneDrive/picklematch-vn/lib/notifications.ts)
- [`supabase/migrations/20260323_add_court_booking_status.sql`](/c:/Users/quock/OneDrive/picklematch-vn/supabase/migrations/20260323_add_court_booking_status.sql)
