import { ScreenHeader } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'

import { CREATE_SESSION_SKILL_OPTIONS } from './skillLevelOptions'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'
import { SectionDivider } from './SectionDivider'
import { SkillRangeSelector } from './SkillRangeSelector'
import { PlayerCountSelector } from './PlayerCountSelector'
import { SessionToggles } from './SessionToggles'
import { CostInput } from './CostInput'
import { BookingStatusSection } from './BookingStatusSection'
import type { NearByCourt } from '@/lib/useNearbyCourts'

type Props = {
  selectedCourt: NearByCourt | null
  onBack: () => void
  maxPlayers: number
  setMaxPlayers: (n: number) => void
  minSkill: number
  setMinSkill: (n: number) => void
  maxSkill: number
  setMaxSkill: (n: number) => void
  bookingStatus: 'confirmed' | 'unconfirmed'
  setBookingStatus: (s: 'confirmed' | 'unconfirmed') => void
  wantsBookingNow: boolean | null
  setWantsBookingNow: (value: boolean | null) => void
  bookingReference: string
  setBookingReference: (value: string) => void
  bookingName: string
  setBookingName: (value: string) => void
  bookingPhone: string
  setBookingPhone: (value: string) => void
  bookingNotes: string
  setBookingNotes: (value: string) => void
  canOpenBookingLink: boolean
  onOpenBookingLink: () => void
  deadlineMinutes: number
  setDeadlineMinutes: (minutes: number) => void
  requireApproval: boolean
  setRequireApproval: (value: boolean) => void
  isRanked: boolean
  setIsRanked: (value: boolean) => void
  canToggleRanked: boolean
  rankedHelperText: string | null
  totalCostStr: string
  setTotalCostStr: (value: string) => void
  costPerPerson: number
  onContinue: () => void
  hideHeader?: boolean
}

export function CreateSessionStep2({
  selectedCourt,
  onBack,
  maxPlayers,
  setMaxPlayers,
  minSkill,
  setMinSkill,
  maxSkill,
  setMaxSkill,
  bookingStatus,
  setBookingStatus,
  wantsBookingNow,
  setWantsBookingNow,
  bookingReference,
  setBookingReference,
  bookingName,
  setBookingName,
  bookingPhone,
  setBookingPhone,
  bookingNotes,
  setBookingNotes,
  canOpenBookingLink,
  onOpenBookingLink,
  deadlineMinutes,
  setDeadlineMinutes,
  requireApproval,
  setRequireApproval,
  isRanked,
  setIsRanked,
  canToggleRanked,
  rankedHelperText,
  totalCostStr,
  setTotalCostStr,
  costPerPerson,
  onContinue,
  hideHeader = false,
}: Props) {
  const minSkillOption = CREATE_SESSION_SKILL_OPTIONS.find((o) => o.id === minSkill)
  const maxSkillOption = CREATE_SESSION_SKILL_OPTIONS.find((o) => o.id === maxSkill)
  const showBookingLinkCta = bookingStatus === 'unconfirmed' && wantsBookingNow === true && canOpenBookingLink
  const shouldShowBookingDetails =
    bookingStatus === 'confirmed' ||
    (bookingStatus === 'unconfirmed' && wantsBookingNow === true)

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          style={{ flex: 1 }}
        >
          {!hideHeader && (
            <>
              <ScreenHeader
                variant="brand"
                title="KINETIC"
                onBackPress={onBack}
                style={{ marginHorizontal: -20, marginTop: -12 }}
                rightSlot={<View style={{ width: 32, height: 32 }} />}
              />

              {/* Progress bar */}
              <View style={{ height: 3, backgroundColor: PROFILE_THEME_COLORS.outlineVariant, borderRadius: RADIUS.full, marginTop: 12, marginBottom: 24, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: '66%', backgroundColor: PROFILE_THEME_COLORS.primary, borderRadius: RADIUS.full }} />
              </View>
            </>
          )}

          {/* Step title */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}>
              <Text style={{ fontFamily: SCREEN_FONTS.headlineItalic, fontSize: 52, color: PROFILE_THEME_COLORS.primary, lineHeight: 54, opacity: 0.2, letterSpacing: -1, paddingRight: 6, paddingTop: 6 }}>
                02
              </Text>
              <Text
                style={{ fontFamily: SCREEN_FONTS.headlineItalic, fontSize: 28, color: PROFILE_THEME_COLORS.primary, lineHeight: 30, letterSpacing: -0.3, flex: 1, paddingBottom: 2 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Cấu hình Trận đấu
              </Text>
            </View>
            <View style={{ width: 32, height: 3, backgroundColor: PROFILE_THEME_COLORS.tertiary, borderRadius: 2 }} />
          </View>

          <SectionDivider index="01" title="Cấu hình trận đấu" />

          <PlayerCountSelector maxPlayers={maxPlayers} setMaxPlayers={setMaxPlayers} />

          <SessionToggles
            isRanked={isRanked}
            setIsRanked={setIsRanked}
            canToggleRanked={canToggleRanked}
            rankedHelperText={rankedHelperText}
            requireApproval={requireApproval}
            setRequireApproval={setRequireApproval}
          />

          {/* Skill range */}
          <View style={{ borderRadius: RADIUS.xl, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, padding: SPACING.lg, marginBottom: 14 }}>
            <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 12, letterSpacing: 1.2, color: PROFILE_THEME_COLORS.primary, marginBottom: 10 }}>
              {'PHẠM VI TRÌNH ĐỘ'}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 24, color: PROFILE_THEME_COLORS.primary }}>{minSkillOption?.label}</Text>
              <Text style={{ fontFamily: SCREEN_FONTS.cta, fontSize: 16, color: PROFILE_THEME_COLORS.secondaryFixedDim }}>{'→'}</Text>
              <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 24, color: PROFILE_THEME_COLORS.primary }}>{maxSkillOption?.label}</Text>
            </View>

            <SkillRangeSelector
              minSkill={minSkill}
              maxSkill={maxSkill}
              setMinSkill={setMinSkill}
              setMaxSkill={setMaxSkill}
            />
          </View>

          <SectionDivider index="02" title="Booking và chi phí" />

          <CostInput
            totalCostStr={totalCostStr}
            setTotalCostStr={setTotalCostStr}
            costPerPerson={costPerPerson}
          />

          {/* Deadline */}
          <View style={{ borderRadius: RADIUS.xl, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, padding: SPACING.lg, marginBottom: 16 }}>
            <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 12, letterSpacing: 1.2, color: PROFILE_THEME_COLORS.primary, marginBottom: 10 }}>
              HẠN CHỐT VÀO KÈO
            </Text>
            <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer, marginBottom: 8 }}>
              Chọn mốc trước giờ bắt đầu
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                { value: 30, label: '30 phút' },
                { value: 45, label: '45 phút' },
                { value: 60, label: '1 giờ' },
                { value: 120, label: '2 giờ' },
              ].map((option) => {
                const active = deadlineMinutes === option.value
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setDeadlineMinutes(option.value)}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 8,
                      borderRadius: RADIUS.md,
                      backgroundColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surface,
                      borderWidth: BORDER.medium,
                      borderColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontFamily: SCREEN_FONTS.label, color: active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurface }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          <BookingStatusSection
            selectedCourt={selectedCourt}
            bookingStatus={bookingStatus}
            setBookingStatus={setBookingStatus}
            wantsBookingNow={wantsBookingNow}
            setWantsBookingNow={setWantsBookingNow}
            showBookingLinkCta={showBookingLinkCta}
            onOpenBookingLink={onOpenBookingLink}
            shouldShowBookingDetails={shouldShowBookingDetails}
            bookingReference={bookingReference}
            setBookingReference={setBookingReference}
            bookingName={bookingName}
            setBookingName={setBookingName}
            bookingPhone={bookingPhone}
            setBookingPhone={setBookingPhone}
            bookingNotes={bookingNotes}
            setBookingNotes={setBookingNotes}
          />
        </ScrollView>

        {/* Bottom bar */}
        <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: -20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, borderTopWidth: 0.5, borderTopColor: PROFILE_THEME_COLORS.outlineVariant }}>
          <TouchableOpacity
            onPress={onBack}
            style={{ flex: 1, borderRadius: RADIUS.md, borderWidth: BORDER.medium, borderColor: PROFILE_THEME_COLORS.outlineVariant, paddingVertical: 13, alignItems: 'center', backgroundColor: PROFILE_THEME_COLORS.surface }}
          >
            <Text style={{ fontSize: 15, color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.cta, textTransform: 'uppercase' }}>Quay lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onContinue}
            style={{ flex: 2, borderRadius: RADIUS.md, backgroundColor: PROFILE_THEME_COLORS.primary, paddingVertical: 13, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 15, color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta, textTransform: 'uppercase' }}>Tiếp tục →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
