# PickleMatch VN Product Spec

## 1. Product positioning

PickleMatch VN là ứng dụng giúp cộng đồng pickleball tại Việt Nam:

- tìm đúng kèo
- ghép đúng người
- chơi đúng trình
- giảm no-show
- tăng niềm tin cộng đồng
- tạo động lực quay lại bằng progression và gamification

## 2. Core value proposition

### Với player

- tìm kèo nhanh hơn
- thấy rõ sân, giờ, trình độ và trạng thái booking
- tránh vào nhầm kèo lệch trình
- có profile, streak và danh hiệu để theo dõi tiến bộ

### Với host

- tạo kèo nhanh
- quản lý join request tốt hơn
- có flow booking sân rõ ràng
- có notification khi session thay đổi
- có lớp xác nhận kết quả để tăng độ tin cậy

## 3. Product pillars

### Pillar 1: Matchmaking theo độ phù hợp

- self-assessment 5 mức
- starting Elo
- placement mode
- smart join flow

### Pillar 2: Community trust

- reliability score
- no-show tracking
- hidden rating
- dispute-aware result confirmation

### Pillar 3: Host operation quality

- host reputation
- booking confirmation
- join approval tools
- session update notifications

### Pillar 4: Retention through progression

- achievements
- streak
- trophy room
- profile identity

## 4. Main features

### Login và onboarding

- OTP login
- profile setup
- 5-level skill assessment
- auto route completion nếu onboarding chưa đủ

### Profile và progression

- player identity
- Elo
- reliability
- placement progress
- session history
- achievements và streak

### Session discovery

- Home feed
- Find Session
- filters
- ưu tiên kèo đã chốt sân

### Session creation

- chọn sân và giờ
- cấu hình số người và dải trình độ
- chọn approval mode
- khai báo booking state
- publish session

### Smart join

- instant join
- request join
- waitlist
- intro note
- host reply template

### Session operations

- host review requests
- player leave session
- host cancel session
- host edit session
- session update notifications

### Match closure

- rate players
- rate host quality
- validate perceived skill
- report no-show

### Result confirmation

- host submit proposed results
- players confirm/dispute
- only finalized results become official

### Achievement system

- match-count achievements
- performance achievements
- streak achievements
- conduct achievements

## 5. Skill model

App hiện dùng 5 mức tự đánh giá:

1. Mới bóc tem
2. Biết điều bóng
3. Chiến thần cọ xát
4. Tay vợt phong trào
5. Thợ săn giải thưởng

Model này được dùng để:

- seed starting Elo
- đưa user vào provisional mode
- hỗ trợ matchmaking bước đầu

## 6. Placement model

Người chơi mới vào `placement mode`.

Hệ thống theo dõi:

- `placement_matches_played`
- `is_provisional`

Placement ảnh hưởng đến:

- thông điệp trên profile
- độ tin cậy của Elo đầu vào
- tốc độ calibration trong 5 trận đầu

## 7. Skill calibration model

### Peer review

Sau trận, người chơi đánh giá đối thủ:

- yếu hơn mác
- đúng trình
- out trình

### Placement K-factor

Trong 5 trận đầu:

- Elo biến động mạnh hơn
- hệ thống dùng cả match result và peer review để đưa user nhanh về đúng trình

### Label sync

Nhãn trình độ hiển thị trên profile được sync theo Elo hiện tại, không chỉ dựa vào self-assessment ban đầu.

## 8. Session lifecycle

### Main states

- `open`
- `done`
- `cancelled`

### Related operational states

- booking confirmed / unconfirmed
- approval required / direct join
- results not submitted / pending confirmation / disputed / finalized

## 9. Booking logic

Booking được làm rõ ngay từ lúc tạo kèo vì đây là yếu tố quan trọng với trải nghiệm thực tế.

App hỏi host:

- sân đã đặt chưa
- nếu chưa, có muốn đặt luôn không

Mục tiêu:

- tăng niềm tin vào session
- giảm mơ hồ cho player
- giúp feed ưu tiên kèo chắc chắn hơn

## 10. Community trust logic

### Reliability

Người chơi bắt đầu với trust cao và có thể bị trừ bởi:

- no-show
- late
- toxic behavior
- dishonest scoring behavior

### Host reputation

Host được cộng hoặc trừ qua feedback:

- đúng mô tả
- tổ chức tốt
- xếp cặp công bằng
- sân sai mô tả
- tổ chức kém

## 11. Rating visibility logic

Rating không hiển thị ngay lập tức.

Chúng chỉ hiển thị khi:

- cả hai bên đều đã rate
- hoặc sau 24 giờ

Lý do:

- giảm revenge rating
- giảm áp lực xã hội
- tăng tính trung thực

## 12. Anti-abuse logic cho kết quả trận

App không tin hoàn toàn vào kết quả host nhập.

Rule hiện tại:

- host chỉ được submit proposed results
- player phải confirm hoặc dispute
- chỉ khi finalized thì kết quả mới ảnh hưởng:
  - streak
  - achievements
  - Elo calibration

Lý do:

- ngăn host tự tăng win
- ngăn fake streak
- giữ giá trị danh hiệu đáng tin

## 13. Achievement categories

### Progression

- Hội viên tích cực
- Chiến thần sân bãi

### Performance

- Giant Slayer
- Tốt nghiệp xuất sắc

### Momentum

- Win Streak

### Conduct

- Đồng hồ Thụy Sĩ
- Host Vàng

## 14. Win streak product rule

Streak chỉ có giá trị nếu còn “nóng”.

Nếu người chơi không chơi quá 14 ngày:

- current streak reset
- fire icon tắt

Lý do:

- giữ đúng cảm giác momentum hiện tại
- tránh streak cũ làm profile “ảo”

## 15. Key notifications

Các event quan trọng đang được communicate qua notification:

- join request
- approval / rejection
- player left
- session cancelled
- session updated
- host reply
- achievement unlocked
- result submitted
- result disputed

## 16. UX tone

Hướng UX hiện tại:

- hiện đại
- card-based
- sạch
- thân thiện
- có yếu tố gamified vừa phải

Design direction gần đây:

- premium nhưng dễ dùng
- state communication rõ
- hierarchy mạnh
- badge mềm và dễ scan

## 17. Current product risks

- `Session Detail` là màn phức tạp nhất, dễ phát sinh state bug
- Trophy Room hiện chưa nối data thật hoàn toàn
- trust systems đã có nền tảng nhưng chưa có moderation tooling sâu
- auto-finalize rating bằng cron vẫn đang hold

## 18. Deferred / on hold

Hạng mục đang chuẩn bị code nhưng chưa rollout:

- cron-based auto-finalize cho hidden ratings sau 24 giờ

Điều này vẫn đang intentionally deferred cho tới khi chốt build.

## 19. Recommended next product steps

1. Nối Trophy Room với dữ liệu thật.
2. Làm checklist QA riêng cho achievement và calibration.
3. Chốt có rollout cron auto-finalize rating hay không.
4. Thêm dispute/admin tools mạnh hơn nếu cộng đồng tăng nhanh.
