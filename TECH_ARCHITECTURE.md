# PickleMatch VN Technical Architecture

## 1. Stack

### Frontend

- React Native
- Expo Router
- TypeScript
- NativeWind
- lucide-react-native

### Backend

- Supabase Auth
- Supabase Postgres
- SQL migrations
- RPC functions
- RLS policies

## 2. Cấu trúc codebase

Các thư mục chính:

- `app/`
- `components/`
- `lib/`
- `hooks/`
- `supabase/migrations/`
- `supabase/functions/`
- `scripts/`

### Navigation

Tab screens:

- `app/(tabs)/index.tsx`
- `app/(tabs)/find-session.tsx`
- `app/(tabs)/my-sessions.tsx`
- `app/(tabs)/notifications.tsx`
- `app/(tabs)/profile.tsx`

Main non-tab screens:

- `app/login.tsx`
- `app/profile-setup.tsx`
- `app/skill-assessment.tsx`
- `app/create-session.tsx`
- `app/session/[id].tsx`
- `app/player/[id].tsx`
- `app/edit-profile.tsx`
- `app/rate-session/[id].tsx`

## 3. Shared UI layer

Design system primitives:

- `components/design/AppButton.tsx`
- `components/design/AppChip.tsx`
- `components/design/AppInput.tsx`
- `components/design/AppStatCard.tsx`
- `components/design/EmptyState.tsx`
- `components/design/ScreenHeader.tsx`
- `components/design/SectionCard.tsx`
- `components/design/StatusBadge.tsx`
- `lib/designSystem.ts`

Session-specific components:

- `components/session/FeedMatchCard.tsx`
- `components/session/SmartJoinButton.tsx`
- `components/session/JoinRequestModal.tsx`
- `components/session/HostRequestReview.tsx`

Profile-specific component:

- `components/profile/TrophyRoom.tsx`

## 4. Core data model

### Main tables

- `players`
- `sessions`
- `session_players`
- `join_requests`
- `courts`
- `court_slots`
- `ratings`
- `notifications`
- `player_stats`
- `player_achievements`

### `players`

Vai trò:

- thông tin public profile
- self-assessed level
- current Elo
- reliability
- host reputation
- provisional state
- placement progress
- earned badges mirror

Một số cột quan trọng:

- `self_assessed_level`
- `skill_label`
- `elo`
- `current_elo`
- `is_provisional`
- `placement_matches_played`
- `reliability_score`
- `host_reputation`
- `earned_badges`

### `sessions`

Vai trò:

- host ownership
- cấu hình kèo
- booking state
- result confirmation state

Một số cột quan trọng:

- `host_id`
- `slot_id`
- `elo_min`
- `elo_max`
- `max_players`
- `status`
- `require_approval`
- `court_booking_status`
- `results_status`
- `results_submitted_at`
- `results_confirmation_deadline`

### `session_players`

Vai trò:

- membership của session
- join status
- match result
- proposed result
- confirmation/dispute state

Một số cột quan trọng:

- `session_id`
- `player_id`
- `status`
- `match_result`
- `proposed_result`
- `result_confirmation_status`
- `result_confirmed_at`
- `result_disputed_at`
- `result_dispute_note`

### `join_requests`

Vai trò:

- approval-based join flow
- intro note
- host reply template

### `ratings`

Vai trò:

- player conduct
- host quality
- skill validation
- hidden/double-blind reveal
- reliability update
- Elo calibration input

### `notifications`

Vai trò:

- inbox trong app
- unread badge
- deep link

### `player_stats`

Vai trò:

- total matches
- total wins
- current streak
- max streak
- host average rating
- streak decay metadata

### `player_achievements`

Vai trò:

- lưu badge unlock thật
- earned date
- category
- icon
- metadata

## 5. Business logic ownership

### Frontend-heavy orchestration screens

Các màn đang giữ nhiều orchestration logic nhất:

- `app/create-session.tsx`
- `app/session/[id].tsx`
- `app/rate-session/[id].tsx`
- `app/(tabs)/profile.tsx`

### Core helpers

Các helper quan trọng:

- `lib/skillAssessment.ts`
- `lib/matchmaking.ts`
- `lib/notifications.ts`
- `lib/supabase.ts`

## 6. Matchmaking architecture

Smart join hiện dùng:

- self-assessed level mapping
- Elo range mapping
- số chỗ còn lại
- auto-accept / require approval

Current match statuses:

- `MATCHED`
- `LOWER_SKILL`
- `WAITLIST`

Logic này được dùng chủ yếu ở `app/session/[id].tsx`.

## 7. Skill calibration architecture

### Frontend input

`app/rate-session/[id].tsx` gửi `skill_validation` với 3 trạng thái:

- `weaker`
- `matched`
- `outclass`

### Backend source of truth

Migration chính:

- `20260324_upgrade_rating_system.sql`
- `20260324_update_skill_calibration_engine.sql`

Các function chính:

- `process_final_ratings(uuid)`
- `apply_session_skill_calibration(uuid, uuid)`
- `get_skill_label_for_elo(integer)`

### Current behavior

- rating sau trận tạo dữ liệu peer review
- kết quả trận đã finalize cung cấp `match_result`
- backend dùng cả hai tín hiệu để hiệu chỉnh Elo
- nếu player còn provisional và chưa đủ 5 trận:
  - dùng placement multiplier mạnh hơn
  - tăng `placement_matches_played`
  - tự tắt `is_provisional` khi đủ ngưỡng
- `skill_label` được sync lại theo Elo

### UI rendering

Hiện `Profile` và `Player Profile` ưu tiên đọc level theo Elo thực tế.

## 8. Rating pipeline

### Frontend

`app/rate-session/[id].tsx`:

- load danh sách người có thể rate
- thu positive / negative tags
- hỗ trợ no-show
- hỗ trợ skill validation
- submit hidden ratings

### Backend

`process_final_ratings(...)`:

- set `reveal_at`
- mở rating khi đủ điều kiện
- update reliability
- update host reputation
- apply calibration cho từng player
- update badge mirror

### Reveal model

- hidden on insert
- visible khi rate hai chiều hoặc sau 24 giờ

### Deferred item

Auto-processing bằng cron đã chuẩn bị nhưng chưa rollout:

- `supabase/functions/process-pending-ratings/index.ts`
- `supabase/migrations/20260324_add_pending_ratings_processor.sql`

## 9. Result confirmation pipeline

### Purpose

Ngăn host tự chốt kết quả một chiều.

### Flow

1. Host submit proposed results.
2. Player confirm hoặc dispute.
3. Backend chỉ finalize khi:
   - tất cả player confirm
   - hoặc hết deadline mà không có dispute
4. Achievement và calibration chỉ chạy sau khi finalize.

### Backend functions

Trong `20260324_add_result_confirmation_flow.sql`:

- `submit_session_results(uuid, jsonb)`
- `respond_to_session_result(uuid, text, text)`
- `finalize_session_results(uuid)`

### Frontend

`app/session/[id].tsx`:

- host submit proposed results
- player confirm/dispute
- có fallback query để màn không chết nếu DB schema local chưa theo kịp

## 10. Achievement pipeline

### Backend

Trong `20260324_add_achievement_system.sql`:

- `recompute_player_stats(uuid)`
- `award_achievement(...)`
- `check_achievements(uuid)`
- `send_push_notification(...)`

### Trigger points

- session completion
- result finalization
- stats recomputation

### Streak decay

Nếu `last_match_at` cũ hơn 14 ngày:

- `current_win_streak = 0`
- fire inactive
- fire level reset

### Frontend

`components/profile/TrophyRoom.tsx`

Hiện tại đã mount lên profile nhưng vẫn đang mock-driven.

## 11. Booking pipeline

Booking là first-class domain concept.

### Create Session

Host phải khai báo trạng thái booking sân.

### Session Detail

Host có thể:

- confirm booking sau
- mở booking link
- lưu booking info

### Edit constraints

Nếu sân đã confirmed:

- date/time editing bị khóa

## 12. Notification pipeline

Nguồn notification hiện tại gồm:

- app-driven inserts qua `lib/notifications.ts`
- backend-triggered inserts qua SQL functions như achievement unlock

Một số loại notification:

- `join_request`
- `join_approved`
- `join_rejected`
- `join_request_reply`
- `player_left`
- `session_cancelled`
- `session_updated`
- `achievement_unlocked`
- `session_results_submitted`
- `session_results_disputed`

## 13. Security model

App dựa trên:

- RLS policies
- ownership checks
- `security definer` RPCs cho logic đa bảng

Các khu nhạy cảm:

- join requests
- host update sessions/slots
- achievements
- result confirmation
- ratings processing

## 14. Migration notes

Các migration quan trọng hiện có:

- `20260323_add_skill_assessment_fields.sql`
- `20260323_add_court_booking_status.sql`
- `20260323_add_smart_join_flow.sql`
- `20260324_upgrade_rating_system.sql`
- `20260324_add_achievement_system.sql`
- `20260324_add_result_confirmation_flow.sql`
- `20260324_update_skill_calibration_engine.sql`

## 15. Testing support

Seed và test support:

- `scripts/seed-dummy-data.mjs`
- `scripts/DUMMY_DATA.md`
- `TEST_CHECKLIST.md`
- `SKILL_CALIBRATION_TEST.md`

## 16. Current technical caveats

- `app/session/[id].tsx` vẫn là màn orchestration nặng nhất.
- `TrophyRoom` chưa nối data thật 100%.
- Cron auto-finalize rating vẫn đang hold.
- Một số màn có fallback query để tránh runtime breakage khi code local đi trước DB schema.
