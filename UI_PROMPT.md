# PickleMatch VN - Full UI Mockup Prompt

Use this prompt directly with a UI design AI tool.

---

Design UI mockups for all screens of a mobile pickleball matchmaking app called "PickleMatch VN".

Follow the exact color scheme, typography, and visual style from the onboarding screen, which uses:

Colors:
- ELECTRIC.smoke background
- rgba(3,8,23,0.72) overlay
- nested circular borders (320px and 228px)
- app-specific accents like ELECTRIC COURT badge

Fonts:
- PlusJakartaSans-Regular
- PlusJakartaSans-Bold
- PlusJakartaSans-ExtraBoldItalic

Style elements:
- hero sections with ImageBackground (opacity 0.55)
- dark/light overlays
- circular decorative motifs
- progress bars
- cards with rounded corners
- light status bar
- translucent elements
- clean, modern Vietnamese-first UI

Create high-fidelity UI designs (Figma-style mockups or detailed implementation-ready specs) for each screen below.

Critical requirement:
- Home screen must be included with all required sections and cannot be skipped.

Global constraints:
- Keep the Vietnamese language and pickleball context.
- Maintain consistent onboarding visual language across all screens.
- Prioritize usability, accessibility, and mobile-first layout.

## Screens and Elements to Design

1) Login Screen
- Container: KeyboardAvoidingView (flex: 1, ELECTRIC.smoke bg)
- StatusBar: light, translucent
- Hero section: ImageBackground (opacity 0.62), gradient overlays, nested circular borders, dot grid, phone silhouette
- Form steps: Phone/OTP with TextInput, OTPDots component
- Buttons: Primary/secondary TouchableOpacity ("Gửi mã", "Xác thực")
- Alerts and DevLoginSection

2) Modal Screen
- ThemedView (flex: 1, centered, padding 20)
- ThemedText title ("Đây là màn hình hộp thoại")
- Link and ThemedText link ("Về trang chủ")

3) Create Session Wizard (3-step)
- SafeAreaView (flex: 1)
- ScrollView with WizardHeader (eyebrow "Tạo kèo", dynamic titles/subtitles), BackLink with ArrowLeft
- Step 1: Court selection with search, cards, date/time pickers
- Step 2: Max players, ELO sliders, toggles, cost input
- Step 3: Booking status, reference/name/phone/notes inputs
- Icons: CalendarDays, Clock, MapPin, Users, TrendingUp
- Loading states

4) Profile Setup Screen
- SafeAreaView (flex: 1, bg-stone-100)
- ScrollView with ScreenHeader (eyebrow "Bắt đầu", title "Tạo hồ sơ của bạn")
- SectionCard "Thông tin cơ bản" with AppInput fields ("Tên / Nickname", "Bạn ở thành phố nào?")
- SectionCard "Bước tiếp theo" with description
- AppButton "Tiếp tục", TouchableOpacity "Quay lại"

5) Profile Preview Screen
- Delegates to ProfileScreenContent design language

6) Edit Profile Screen
- SafeAreaView (flex: 1, bg-stone-100)
- ScrollView with ScreenHeader (eyebrow "Cá nhân hóa", title "Chỉnh sửa hồ sơ")
- SectionCard "Thông tin cơ bản" with AppInput (display name, city), quick city buttons
- SectionCard "Mức chơi hiện tại" with skill display, ELO info, "Làm lại bài đánh giá" button
- SectionCard "Ghép nhanh" with Switch toggle
- SectionCard "Sân ưa thích" with court list, search, add/remove buttons
- EmptyState, save AppButton, loading states

7) Tab Navigation Layout
- 5 tabs: Home (Home), My Sessions (CalendarDays), Find Session (Search), Notifications (Bell + badge), Profile (User)
- TabIcon with scale transforms
- NotificationIcon with red badge
- Tab bar styling (height 72, spacing, fontSize 11)

8) Home Screen / Dashboard (required, detailed)
- SafeAreaView (flex: 1, theme.backgroundMuted)
- ScrollView with:
	- HomeGreetingHeader
	- DashboardStatsStrip
	- HomePendingMatchResultCarousel
	- PostMatchActionsSection
	- HeroThemeCard
	- 3 HomeCarouselSections:
		- "Gợi ý hợp gu"
		- "Cứu nét khẩn cấp"
		- "Sân quen"
- FAB button with Plus icon and text "TẠO KÈO MỚI"

9) Find Session / Search Screen
- SafeAreaView (flex: 1, bg-stone-100)
- ScrollView with RefreshControl, TextInput search, Pressable filter, quick filter chips, sort selector, map button
- SearchResultCard with booking/time/compatibility badges, court info, skill/ELO badges, host info, "Vào kèo" button
- EmptyState and loading ActivityIndicator

10) My Sessions Screen
- SafeAreaView (flex: 1, bg-stone-100)
- TabButtons (upcoming, pending, history)
- FlatList with MySessionCard (status badges, court info, meta cards, action buttons)
- EmptyState and RefreshControl

11) Notifications Screen
- SafeAreaView (flex: 1, bg-stone-100)
- ScreenHeader ("Thông báo", "Hộp thư", "Mark all as read")
- EmptyState or FlatList with notification cards:
	- unread dot
	- icon badges by type
	- title/time/body
	- dividers

12) Profile Screen
- Delegates to ProfileScreenContent (player profile visual language)

13) Session Detail Screen
- SafeAreaView (flex: 1, bg-slate-50)
- ScrollView with sticky header (back/share, title "Chi tiết kèo")
- SessionMetaCard, BookingDetailsCard, Result Confirmation Card
- PlayerRosterSection (team cards, auto-balance)
- SessionBottomBar, JoinRequestModal

14) Host Review Center Screen
- SafeAreaView (flex: 1, bg-white)
- ScrollView with header (back, session info, pending count)
- RequestCard:
	- avatar
	- reliability badge
	- name/ELO
	- match score
	- warning card
	- intro note
	- reject/accept buttons
	- quick reply buttons
- EmptyState

15) Confirm Session Result Screen
- SafeAreaView (flex: 1, bg-slate-50)
- Sticky header (back, title "Xác nhận kết quả")
- ScrollView with Status Card, Deadline Card, Team Composition Card, Dispute Card (TextInput), action buttons

16) Match Result Entry Screen
- SafeAreaView (flex: 1, bg-slate-50)
- Header (back, formatted date/time)
- ScrollView with ScorePanel (team sections, score controls)
- Player Roster (PlayerChip)
- Stats section
- Submit/Cancel buttons
- Loading + animation states

17) Player Profile Screen
- SafeAreaView (flex: 1, bg-stone-100)
- ScrollView with ScreenHeader ("Hồ sơ công khai", player name, "Đây là bạn" badge)
- ProfileIdentityCard
- ProfileSkillHero
- ProfileStatsGrid
- Favorite Courts section
- CommunityFeedbackPanel
- ProfileHistoryList
- Empty states

18) Rate Session Screen
- SafeAreaView (flex: 1, bg-stone-100)
- ScrollView with header (progress, title "Đánh giá trận")
- Player card
- Rating sections:
	- no-show toggle
	- skill validation options
	- positive/warning chips
- Action buttons
- Completion screens
- Loading states

## Delivery Requirements

- Make designs cohesive and implementation-oriented.
- Reuse onboarding motifs (hero overlays, circular rings, translucent layers) where suitable (especially login and home).
- Ensure all text is in Vietnamese unless technical labels are required.
- Include responsive behavior notes for small/large phones.
- Include accessibility notes (contrast, minimum tap target, readable type scale).
- Include loading, empty, error, and success states for each core flow.

Output in one of these formats:
- Figma-style frame breakdown with component list and token map.
- Detailed per-screen mockup spec ready for React Native implementation.

---
