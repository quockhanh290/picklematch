# PickleMatch VN Design System

## Mục tiêu

Tài liệu này là nguồn tham chiếu chung cho style UI hiện tại của app.

Design direction đang bám theo:
- màn `Skill Assessment`
- card system mới ở feed
- shared components trong `components/design`

Mục tiêu chính:
- sáng, sạch, hiện đại
- mobile-first
- card bo lớn, thoáng
- hierarchy rõ
- badge mềm, dễ scan
- CTA mạnh, rõ hành động

## Nguồn code chính

- Tokens: [lib/designSystem.ts](/c:/Users/quock/OneDrive/picklematch-vn/lib/designSystem.ts)
- Shared exports: [components/design/index.ts](/c:/Users/quock/OneDrive/picklematch-vn/components/design/index.ts)
- Visual direction tham chiếu: [app/skill-assessment.tsx](/c:/Users/quock/OneDrive/picklematch-vn/app/skill-assessment.tsx)

## Visual Direction

- Nền app: sáng nhưng không trắng phẳng hoàn toàn
- Bề mặt chính: card trắng nổi trên nền đá nhạt
- Accent: emerald/green
- Typography: title đậm, subtitle nhẹ và thoáng
- Spacing: rộng, tránh cảm giác chật
- Corners: bo lớn, cảm giác mềm và premium

## Color Tokens

Đang được định nghĩa ở [lib/designSystem.ts](/c:/Users/quock/OneDrive/picklematch-vn/lib/designSystem.ts):

- `bg`: `bg-stone-100`
- `surface`: `bg-white`
- `surfaceMuted`: `bg-slate-50`
- `ink`: `text-slate-900`
- `inkSoft`: `text-slate-600`
- `line`: `border-slate-200`
- `brand`: `bg-emerald-600`
- `brandSoft`: `bg-emerald-50`
- `brandText`: `text-emerald-700`

## Badge Tones

Các tone badge chuẩn:

- `success`: emerald
- `warning`: amber
- `danger`: rose
- `info`: sky
- `neutral`: slate

Quy ước dùng:

- `success`: trạng thái tốt, đã xác nhận, đã chốt
- `warning`: cần chú ý, pending, booking chưa xác nhận
- `danger`: huỷ, đầy, lỗi, trạng thái xấu
- `info`: placement, thông tin phụ, state trung lập tích cực
- `neutral`: metadata, loại trình độ, tag không ưu tiên

## Typography

### Screen Header

Định nghĩa ở [components/design/ScreenHeader.tsx](/c:/Users/quock/OneDrive/picklematch-vn/components/design/ScreenHeader.tsx)

- Eyebrow:
  - `text-sm`
  - `font-medium`
  - `text-slate-500`
- Title:
  - `text-3xl`
  - `font-black`
  - `text-slate-950`
- Subtitle:
  - `text-sm`
  - `leading-6`
  - `text-slate-500`

### Section Title

Định nghĩa ở [components/design/SectionCard.tsx](/c:/Users/quock/OneDrive/picklematch-vn/components/design/SectionCard.tsx)

- `text-lg`
- `font-extrabold`
- `text-slate-900`

### Body Copy

Chuẩn dùng trong app:

- copy chính: `text-sm text-slate-700`
- copy phụ: `text-sm leading-6 text-slate-500`
- label nhỏ: `text-xs font-bold uppercase tracking-wide text-slate-500`

## Radius

Quy ước bo góc:

- Card lớn: `rounded-[28px]`
- Button/Input: `rounded-2xl`
- Badge/Chip: `rounded-full`
- Surface nhỏ bên trong card: `rounded-3xl`

## Elevation

Hiện tại ưu tiên nhẹ:

- card chính: `shadow-sm`
- tránh shadow nặng
- phân tầng chủ yếu bằng:
  - nền
  - radius
  - spacing
  - border nhạt

## Spacing

Quy ước thực tế đang dùng:

- padding ngang màn: `px-5`
- top screen spacing: `pt-4`
- gap section lớn: `mb-4`
- gap trong card: `gap-3`, `gap-4`
- padding card: `p-4`

Nguyên tắc:

- ưu tiên ít section nhưng mỗi section rõ
- không nhồi nhiều thông tin sát nhau
- CTA thường có khoảng thở riêng bên dưới

## Shared Components

### AppButton

File: [components/design/AppButton.tsx](/c:/Users/quock/OneDrive/picklematch-vn/components/design/AppButton.tsx)

Variants:

- `primary`
  - nền emerald
  - text trắng
  - dùng cho CTA chính
- `secondary`
  - nền trắng
  - viền emerald
  - text emerald
  - dùng cho action phụ nhưng vẫn quan trọng
- `ghost`
  - nền trong
  - text slate
  - dùng cho action nhẹ

Quy ước:

- chiều cao chuẩn: `h-14`
- chữ CTA: `text-base font-extrabold`
- dùng full width mặc định

### AppChip

File: [components/design/AppChip.tsx](/c:/Users/quock/OneDrive/picklematch-vn/components/design/AppChip.tsx)

Dùng cho:

- filter chips
- option chips nhanh

Quy ước:

- active state luôn rõ hơn tone thường
- không dùng chip cho hành động quan trọng

### AppInput

File: [components/design/AppInput.tsx](/c:/Users/quock/OneDrive/picklematch-vn/components/design/AppInput.tsx)

Quy ước:

- chiều cao chuẩn: `h-14`
- nền trắng
- border slate nhạt
- label phía trên, đậm vừa
- hint nhỏ bên dưới nếu cần

Dùng cho:

- form profile
- booking fields
- cấu hình session

### StatusBadge

File: [components/design/StatusBadge.tsx](/c:/Users/quock/OneDrive/picklematch-vn/components/design/StatusBadge.tsx)

Quy ước:

- badge luôn ngắn, scan nhanh
- không nhồi cả câu dài vào badge nếu có thể
- nếu nội dung giải thích dài, dùng subtitle trong `SectionCard`

### SectionCard

File: [components/design/SectionCard.tsx](/c:/Users/quock/OneDrive/picklematch-vn/components/design/SectionCard.tsx)

Đây là container chuẩn cho:

- hero section
- info section
- host actions
- booking section
- review summary
- profile modules

Quy ước:

- một card = một nhóm ý rõ ràng
- nếu card có action phụ, dùng `rightSlot`
- tránh trộn quá nhiều loại thông tin trong cùng một card

### ScreenHeader

File: [components/design/ScreenHeader.tsx](/c:/Users/quock/OneDrive/picklematch-vn/components/design/ScreenHeader.tsx)

Chuẩn cho các màn:

- tab screens
- detail screens
- wizard steps

Quy ước:

- eyebrow cho context
- title cho nội dung chính
- subtitle cho hướng dẫn ngắn

### EmptyState

File: [components/design/EmptyState.tsx](/c:/Users/quock/OneDrive/picklematch-vn/components/design/EmptyState.tsx)

Chuẩn dùng cho:

- không có dữ liệu
- filter không match
- không tìm thấy sân

Quy ước:

- icon lớn
- title ngắn
- description 1-2 câu

## Card System

### Feed Match Card

File: [components/session/FeedMatchCard.tsx](/c:/Users/quock/OneDrive/picklematch-vn/components/session/FeedMatchCard.tsx)

Structure chuẩn:

1. Top row:
   - tên sân
   - badge trạng thái sân
2. Meta:
   - địa chỉ
   - giờ + ngày
3. Skill + type:
   - trình độ
   - loại kèo / badge phụ
4. Footer:
   - host + provisional icon
   - giá
   - số chỗ

Quy ước:

- card feed là thành phần chuẩn cho `Home`, `Find Session`, `My Sessions`
- mọi thay đổi card feed nên sửa tại component dùng chung này

## Wizard Pattern

Áp dụng cho `Create Session` và có thể tái dùng cho flow onboarding khác.

Pattern:

1. back action
2. `ScreenHeader`
3. context summary card
4. form / selection section cards
5. bottom CTA rõ ràng

Nguyên tắc:

- mỗi bước chỉ nên có một việc chính
- nếu logic phức tạp, tách thành nhiều `SectionCard`
- step label luôn hiển thị rõ

## Profile Pattern

Hướng chuẩn cho profile sau khi refactor xong:

- hero card
- stat cards
- placement/provisional card
- info sections
- settings/actions sections

## Notification Pattern

Hướng chuẩn:

- giữ list nhanh để dễ scan
- mỗi item vẫn phải bám:
  - spacing thoáng
  - icon container rõ
  - unread state dễ nhìn
  - typography đồng nhất với app

## Copy Rules

- tiếng Việt phải đúng dấu, tránh mojibake
- badge ngắn, mạnh
- subtitle mềm, giải thích rõ
- CTA dùng động từ trực tiếp:
  - `Tạo kèo`
  - `Xác nhận đã đặt sân`
  - `Lưu thay đổi`
  - `Đánh giá kèo này`

## Những gì chưa hoàn tất 100%

Hiện design system đã có nền tảng, nhưng app vẫn đang trong quá trình migrate.

Các màn đã bám khá sát:

- [app/skill-assessment.tsx](/c:/Users/quock/OneDrive/picklematch-vn/app/skill-assessment.tsx)
- [app/(tabs)/index.tsx](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/index.tsx)
- [app/(tabs)/find-session.tsx](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/find-session.tsx)
- [app/(tabs)/my-sessions.tsx](/c:/Users/quock/OneDrive/picklematch-vn/app/(tabs)/my-sessions.tsx)
- [app/session/[id].tsx](/c:/Users/quock/OneDrive/picklematch-vn/app/session/[id].tsx)
- [app/create-session.tsx](/c:/Users/quock/OneDrive/picklematch-vn/app/create-session.tsx)

Các màn còn nên đồng bộ tiếp:

- `Profile`
- `Edit Profile`
- `Notifications`

## Quy tắc khi refactor màn mới

1. Ưu tiên dùng shared components trước khi viết style riêng.
2. Nếu cần pattern mới, thêm vào `components/design` thay vì hardcode trong màn.
3. Nếu cần màu/tone mới, thêm vào [lib/designSystem.ts](/c:/Users/quock/OneDrive/picklematch-vn/lib/designSystem.ts).
4. Không copy card/button/badge inline nếu đã có component tương đương.
5. Giữ business logic cũ, chỉ thay presentation nếu không thật sự cần refactor sâu.

## Bước tiếp theo được khuyến nghị

Để đồng nhất hoàn toàn, nên làm tiếp theo thứ tự:

1. `Profile`
2. `Edit Profile`
3. `Notifications`
4. dọn các style cũ còn sót trong `Session Detail` và `Create Session`
