import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ArrowLeft, CheckCircle2, Sparkles, Swords, Timer } from 'lucide-react-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
    ActivityIndicator,
    ImageBackground,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { getUserDescriptionForTier } from '@/lib/eloSystem'
import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/components/profile/profileTheme'
import {
    calculateInitialElo,
    getLegacySkillLabelForTier,
    getSelfAssessedLevelForElo,
    getSimpleTierLabel,
    ONBOARDING_QUESTIONS,
    type OnboardingQuestionId,
} from '@/lib/onboardingAssessment'
import { supabase } from '@/lib/supabase'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'
import { SecondaryNavbar } from '@/components/design'

type AnswerLabels = Partial<Record<OnboardingQuestionId, string>>
type AnswerScores = Partial<Record<OnboardingQuestionId, number>>
type OnboardingPreview = {
  elo: number
  tier: string
  tierLabel: string
  description: string
  legacySkillLabel: ReturnType<typeof getLegacySkillLabelForTier>
  selfAssessedLevel: ReturnType<typeof getSelfAssessedLevelForElo>
  preference: ReturnType<typeof calculateInitialElo>['preference']
}

const HERO_IMAGE = require('../assets/images/login-electric-court-hero.png')

const ELECTRIC = {
  emerald: PROFILE_THEME_COLORS.surfaceTint,
  emeraldDark: PROFILE_THEME_COLORS.primaryContainer,
  surfaceTint: PROFILE_THEME_COLORS.secondaryContainer,
  panel: PROFILE_THEME_COLORS.surfaceContainerLowest,
  border: PROFILE_THEME_COLORS.outlineVariant,
  borderStrong: PROFILE_THEME_COLORS.outline,
  textStrong: PROFILE_THEME_COLORS.onSurface,
  smoke: PROFILE_THEME_COLORS.background,
  white: PROFILE_THEME_COLORS.onPrimary,
  muted: PROFILE_THEME_COLORS.onSurfaceVariant,
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const advanceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  const [stepIndex, setStepIndex] = useState(0)
  const [scores, setScores] = useState<AnswerScores>({})
  const [labels, setLabels] = useState<AnswerLabels>({})
  const [submitting, setSubmitting] = useState(false)
  const [resultPreview, setResultPreview] = useState<OnboardingPreview | null>(null)
  const [errorVisible, setErrorVisible] = useState(false)

  const currentQuestion = ONBOARDING_QUESTIONS[stepIndex]
  const selectedLabel = labels[currentQuestion.id]
  const progress = ((stepIndex + 1) / ONBOARDING_QUESTIONS.length) * 100
  const isLastQuestion = stepIndex === ONBOARDING_QUESTIONS.length - 1
  const isCurrentAnswerSelected = useMemo(() => Boolean(selectedLabel), [selectedLabel])

  const heroTopPadding = Math.max(insets.top, Platform.OS === 'ios' ? 18 : 14) + 8
  const heroMinHeight = 336 + Math.min(insets.top, 24)
  const questionCardMinHeight = Math.max(420, width * 0.98)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (advanceTimeout.current) clearTimeout(advanceTimeout.current)
    }
  }, [])

  function goToStep(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= ONBOARDING_QUESTIONS.length) return
    setStepIndex(nextIndex)
  }

  function handleAnswerSelect(label: string, score: number) {
    if (submitting) return

    setErrorVisible(false)
    setScores((current) => ({
      ...current,
      [currentQuestion.id]: score,
    }))
    setLabels((current) => ({
      ...current,
      [currentQuestion.id]: label,
    }))

    if (!isLastQuestion) {
      if (advanceTimeout.current) clearTimeout(advanceTimeout.current)
      advanceTimeout.current = setTimeout(() => {
        goToStep(stepIndex + 1)
      }, 180)
    }
  }

  function handleBack() {
    if (submitting) return
    if (resultPreview) {
      setResultPreview(null)
      setErrorVisible(false)
      return
    }
    if (stepIndex === 0) return
    if (advanceTimeout.current) clearTimeout(advanceTimeout.current)
    setErrorVisible(false)
    goToStep(stepIndex - 1)
  }

  function handleNext() {
    if (!isCurrentAnswerSelected || submitting || isLastQuestion) return
    if (advanceTimeout.current) clearTimeout(advanceTimeout.current)
    goToStep(stepIndex + 1)
  }

  function buildPreviewResult(): OnboardingPreview | null {
    const timePlayingAnswer = labels.time_playing
    const preferenceAnswer = labels.play_preference

    if (!timePlayingAnswer || !preferenceAnswer) return null

    const { elo, tier, preference } = calculateInitialElo(scores, timePlayingAnswer, preferenceAnswer)
    const legacySkillLabel = getLegacySkillLabelForTier(tier)
    const selfAssessedLevel = getSelfAssessedLevelForElo(elo)

    return {
      elo,
      tier,
      tierLabel: getSimpleTierLabel(tier),
      description: getUserDescriptionForTier(tier),
      legacySkillLabel,
      selfAssessedLevel,
      preference,
    }
  }

  function openResultPreview() {
    if (submitting) return

    const preview = buildPreviewResult()
    if (!preview) return

    setErrorVisible(false)
    setResultPreview(preview)
  }

  function restartQuiz() {
    if (advanceTimeout.current) clearTimeout(advanceTimeout.current)
    setResultPreview(null)
    setErrorVisible(false)
    setSubmitting(false)
    setScores({})
    setLabels({})
    setStepIndex(0)
  }

  async function confirmOnboardingResult() {
    if (submitting || !resultPreview) return

    setSubmitting(true)
    setErrorVisible(false)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(userError?.message ?? 'Không tìm thấy tài khoản hiện tại.')
      }

      const { error } = await supabase
        .from('players')
        .update({
          elo: resultPreview.elo,
          current_elo: resultPreview.elo,
          elo_matches_played: 0,
          onboarding_completed: true,
          skill_tier: resultPreview.tier,
          play_preference: resultPreview.preference,
          skill_label: resultPreview.legacySkillLabel,
          self_assessed_level: resultPreview.selfAssessedLevel,
          is_provisional: true,
          placement_matches_played: 0,
        })
        .eq('id', user.id)

      if (error) {
        throw new Error(error.message)
      }

      if (!isMountedRef.current) return
      router.replace('/(tabs)')
    } catch (error) {
      console.warn('[Onboarding] submit failed:', error)
      if (!isMountedRef.current) return
      setErrorVisible(true)
      setSubmitting(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: ELECTRIC.smoke }}>
      <StatusBar style="dark" translucent backgroundColor="#F2F0E8" />
      <SecondaryNavbar
        showProgress
        progress={progress / 100}
        onBackPress={handleBack}
      />
      <ScrollView
        bounces={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20), paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ minHeight: heroMinHeight, backgroundColor: ELECTRIC.emeraldDark }}>
          <ImageBackground
            source={HERO_IMAGE}
            resizeMode="cover"
            style={StyleSheet.absoluteFillObject}
            imageStyle={{ opacity: 0.55 }}
          />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,105,72,0.76)' }]} />
          <View
            style={{
              position: 'absolute',
              top: 30,
              alignSelf: 'center',
              width: 320,
              height: 320,
              borderRadius: RADIUS.full,
              borderWidth: BORDER.base,
              borderColor: 'rgba(255,255,255,0.28)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 62,
              alignSelf: 'center',
              width: 228,
              height: 228,
              borderRadius: RADIUS.full,
              borderWidth: BORDER.base,
              borderColor: 'rgba(255,255,255,0.24)',
            }}
          />

          <View style={{ paddingTop: 20, paddingHorizontal: SPACING.xl, paddingBottom: 32 }}>
            <View className="flex-row items-center justify-between">
              {/* Previous header row removed in favor of SecondaryNavbar */}
            </View>

            <View style={{ marginTop: 34 }}>
              <Text
                style={{
                  color: PROFILE_THEME_COLORS.onPrimaryContainer,
                  fontSize: 28,
                  lineHeight: 30,
                  fontFamily: SCREEN_FONTS.boldItalic,
                }}
              >
                BUILD YOUR LEVEL
              </Text>
              <Text
                style={{
                  marginTop: 12,
                  color: PROFILE_THEME_COLORS.onPrimary,
                  fontSize: 12,
                  letterSpacing: 0.5,
                  fontFamily: SCREEN_FONTS.cta,
                }}
              >
                KINETIC ENERGY • PLAYER FIT
              </Text>
              <Text
                style={{
                  marginTop: 14,
                  color: 'rgba(255,255,255,0.78)',
                  fontSize: 14,
                  lineHeight: 22,
                  fontFamily: SCREEN_FONTS.body,
                }}
              >
                7 câu ngắn để hệ thống ước lượng mức khởi điểm và ghép kèo dễ chịu hơn cho bạn.
              </Text>
            </View>

            <View className="mt-5 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View
                  className="mr-2 h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
                >
                  <Sparkles size={18} color={ELECTRIC.white} />
                </View>
                <View>
                  <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontSize: 14, fontFamily: SCREEN_FONTS.cta }}>
                    Bước {stepIndex + 1}/{ONBOARDING_QUESTIONS.length}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.66)', fontSize: 12, fontFamily: SCREEN_FONTS.body }}>
                    Hiệu chỉnh ban đầu
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <Timer size={16} color="rgba(255,255,255,0.72)" />
                <Text
                  style={{
                    marginLeft: 6,
                    color: 'rgba(255,255,255,0.72)',
                    fontSize: 12,
                    fontFamily: SCREEN_FONTS.cta,
                  }}
                >
                  ~1 phút
                </Text>
              </View>
            </View>
            {/* Progress bar moved to SecondaryNavbar */}
          </View>
        </View>

        <View style={{ paddingHorizontal: SPACING.xl, marginTop: -20 }}>
          <View
            style={{
              borderRadius: RADIUS.hero,
              backgroundColor: ELECTRIC.white,
              padding: SPACING.xl,
              minHeight: questionCardMinHeight,
              shadowColor: PROFILE_THEME_COLORS.onBackground,
              shadowOpacity: 0.08,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 16 },
              elevation: 8,
            }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <View className="rounded-full px-4 py-2" style={{ backgroundColor: ELECTRIC.surfaceTint }}>
                <Text style={{ color: ELECTRIC.emeraldDark, fontSize: 12, letterSpacing: 0.8, fontFamily: SCREEN_FONTS.cta }}>
                  CÂU HỎI {stepIndex + 1}
                </Text>
              </View>
              <View className="flex-row items-center rounded-full px-3 py-2" style={{ backgroundColor: ELECTRIC.panel }}>
                <Swords size={14} color={ELECTRIC.emeraldDark} />
                <Text style={{ marginLeft: 6, color: ELECTRIC.muted, fontSize: 12, fontFamily: SCREEN_FONTS.cta }}>
                  Match Fit
                </Text>
              </View>
            </View>

            <Text
              style={{
                color: ELECTRIC.textStrong,
                fontSize: 28,
                lineHeight: 34,
                fontFamily: SCREEN_FONTS.cta,
              }}
            >
              {currentQuestion.question}
            </Text>

            {currentQuestion.subtitle ? (
              <Text
                style={{
                  marginTop: 10,
                  color: ELECTRIC.muted,
                  fontSize: 14,
                  lineHeight: 22,
                  fontFamily: SCREEN_FONTS.body,
                }}
              >
                {currentQuestion.subtitle}
              </Text>
            ) : null}

            <View style={{ marginTop: 20, gap: 12 }}>
              {currentQuestion.options.map((option) => {
                const isSelected = selectedLabel === option.label

                return (
                  <TouchableOpacity
                    key={`${currentQuestion.id}-${option.label}`}
                    activeOpacity={0.92}
                    onPress={() => handleAnswerSelect(option.label, option.score)}
                    disabled={submitting}
                    style={{
                      minHeight: 68,
                      borderRadius: RADIUS.xl,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      justifyContent: 'center',
                      backgroundColor: isSelected ? ELECTRIC.surfaceTint : ELECTRIC.panel,
                      borderWidth: isSelected ? 1.5 : 1,
                      borderColor: isSelected ? ELECTRIC.emerald : ELECTRIC.border,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        style={{
                          flex: 1,
                          color: isSelected ? ELECTRIC.emeraldDark : ELECTRIC.textStrong,
                          fontSize: 15,
                          lineHeight: 22,
                          fontFamily: SCREEN_FONTS.cta,
                          paddingRight: 12,
                        }}
                      >
                        {option.label}
                      </Text>
                      <View
                        className="h-8 w-8 items-center justify-center rounded-full"
                        style={{ backgroundColor: isSelected ? 'rgba(5,150,105,0.14)' : 'rgba(255,255,255,0.92)' }}
                      >
                        {isSelected ? (
                          <CheckCircle2 size={18} color={ELECTRIC.emerald} />
                        ) : (
                          <View style={{ width: 10, height: 10, borderRadius: RADIUS.full, backgroundColor: PROFILE_THEME_COLORS.outlineVariant }} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: SPACING.xl, paddingTop: 16 }}>
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleBack}
              disabled={submitting || stepIndex === 0}
              style={{
                width: 96,
                height: 56,
                borderRadius: RADIUS.hero,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                opacity: stepIndex === 0 ? 0.45 : 1,
              }}
            >
              <Text style={{ color: ELECTRIC.emeraldDark, fontSize: 15, fontFamily: SCREEN_FONTS.cta }}>Quay lại</Text>
            </TouchableOpacity>

            {isLastQuestion ? (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={openResultPreview}
                disabled={!isCurrentAnswerSelected || submitting}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: RADIUS.hero,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ELECTRIC.emerald,
                  opacity: !isCurrentAnswerSelected || submitting ? 0.55 : 1,
                  shadowColor: ELECTRIC.emerald,
                  shadowOpacity: 0.22,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 5,
                }}
              >
                <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontSize: 16, fontFamily: SCREEN_FONTS.cta }}>Xem kết quả</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={handleNext}
                disabled={!isCurrentAnswerSelected || submitting}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: RADIUS.hero,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ELECTRIC.emerald,
                  opacity: !isCurrentAnswerSelected || submitting ? 0.55 : 1,
                  shadowColor: ELECTRIC.emerald,
                  shadowOpacity: 0.22,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 5,
                }}
              >
                <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontSize: 16, fontFamily: SCREEN_FONTS.cta }}>Tiếp theo</Text>
              </TouchableOpacity>
            )}
          </View>

          {!resultPreview && errorVisible ? (
            <View
              style={{
                marginTop: 14,
                borderRadius: RADIUS.xl,
                backgroundColor: PROFILE_THEME_COLORS.errorContainer,
                paddingHorizontal: 16,
                paddingVertical: SPACING.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: PROFILE_THEME_COLORS.error, fontSize: 14, fontFamily: SCREEN_FONTS.cta }}>Có lỗi xảy ra, thử lại nhé</Text>
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={openResultPreview}
                style={{
                  borderRadius: RADIUS.full,
                  backgroundColor: PROFILE_THEME_COLORS.error,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: ELECTRIC.white, fontSize: 13, fontFamily: SCREEN_FONTS.cta }}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {resultPreview ? (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(25,28,30,0.42)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              width: '100%',
              borderRadius: RADIUS.hero,
              backgroundColor: ELECTRIC.white,
              padding: 24,
              alignItems: 'center',
            }}
          >
            <View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: ELECTRIC.surfaceTint }}>
              <CheckCircle2 size={32} color={ELECTRIC.emerald} />
            </View>
            <Text
              style={{
                marginTop: 16,
                color: ELECTRIC.emeraldDark,
                fontSize: 12,
                letterSpacing: 1,
                fontFamily: SCREEN_FONTS.cta,
              }}
            >
              KẾT QUẢ TỰ ĐÁNH GIÁ
            </Text>
            <Text
              style={{
                marginTop: 10,
                color: ELECTRIC.textStrong,
                fontSize: 28,
                lineHeight: 34,
                textAlign: 'center',
                fontFamily: SCREEN_FONTS.cta,
              }}
            >
              {resultPreview.tierLabel}
            </Text>
            <Text
              style={{
                marginTop: 8,
                color: PROFILE_THEME_COLORS.onSurfaceVariant,
                fontSize: 15,
                lineHeight: 22,
                textAlign: 'center',
                fontFamily: SCREEN_FONTS.body,
              }}
            >
              {resultPreview.description}
            </Text>
            <Text
              style={{
                marginTop: 14,
                color: ELECTRIC.muted,
                fontSize: 14,
                lineHeight: 22,
                textAlign: 'center',
                fontFamily: SCREEN_FONTS.body,
              }}
            >
              Đây là mức khởi điểm để hệ thống ghép kèo dễ chịu hơn cho bạn. Bạn có thể xác nhận mức này hoặc làm lại quiz nếu thấy chưa đúng.
            </Text>

            <View
              className="mt-4 rounded-2xl px-4 py-3"
              style={{ backgroundColor: ELECTRIC.panel, borderWidth: BORDER.base, borderColor: ELECTRIC.border, width: '100%' }}
            >
              <Text
                style={{
                  color: ELECTRIC.muted,
                  fontSize: 12,
                  letterSpacing: 0.6,
                  fontFamily: SCREEN_FONTS.cta,
                  textTransform: 'uppercase',
                  textAlign: 'center',
                }}
              >
                Elo khởi điểm dự kiến
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  color: ELECTRIC.textStrong,
                  fontSize: 24,
                  textAlign: 'center',
                  fontFamily: SCREEN_FONTS.cta,
                }}
              >
                {resultPreview.elo}
              </Text>
            </View>

            {errorVisible ? (
              <Text
                style={{
                  marginTop: 14,
                  color: PROFILE_THEME_SEMANTIC.dangerStrong,
                  fontSize: 14,
                  lineHeight: 20,
                  textAlign: 'center',
                  fontFamily: SCREEN_FONTS.cta,
                }}
              >
                Không thể lưu kết quả lúc này. Vui lòng thử lại sau ít phút.
              </Text>
            ) : null}

            <View className="mt-6 w-full flex-row items-center" style={{ gap: 12 }}>
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={restartQuiz}
                disabled={submitting}
                style={{
                  flex: 1,
                  height: 54,
                  borderRadius: RADIUS.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ELECTRIC.panel,
                  borderWidth: BORDER.base,
                  borderColor: ELECTRIC.borderStrong,
                  opacity: submitting ? 0.65 : 1,
                }}
              >
                <Text style={{ color: ELECTRIC.textStrong, fontSize: 15, fontFamily: SCREEN_FONTS.cta }}>Làm lại quiz</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.92}
                onPress={confirmOnboardingResult}
                disabled={submitting}
                style={{
                  flex: 1,
                  height: 54,
                  borderRadius: RADIUS.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ELECTRIC.emerald,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color={PROFILE_THEME_COLORS.onPrimary} />
                ) : (
                  <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontSize: 15, fontFamily: SCREEN_FONTS.cta }}>Xác nhận mức này</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  )
}
