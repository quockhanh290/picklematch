import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { CheckCircle2, Sparkles, Swords, Timer } from 'lucide-react-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
    ImageBackground,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getUserDescriptionForTier } from '@/lib/eloSystem'
import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/constants/profileTheme'
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
import { AppButton } from '@/components/design/AppButton'
import { AppDialog, type AppDialogConfig } from '@/components/design/AppDialog'
import { SecondaryNavbar } from '@/components/design/SecondaryNavbar'
import { STRINGS } from '@/constants/strings'

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

const ONBOARDING_THEME = {
  accent: PROFILE_THEME_COLORS.surfaceTint,
  accentDeep: PROFILE_THEME_COLORS.primary,
  panel: PROFILE_THEME_COLORS.surfaceContainerLowest,
  border: PROFILE_THEME_COLORS.outlineVariant,
  text: PROFILE_THEME_COLORS.onSurface,
  textMuted: PROFILE_THEME_COLORS.onSurfaceVariant,
  background: PROFILE_THEME_COLORS.background,
  white: '#FFFFFF',
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

  const dialogConfig: AppDialogConfig | null = resultPreview ? {
    title: resultPreview.tierLabel,
    message: resultPreview.description,
    actions: [
      {
        label: STRINGS.onboarding.redo_quiz,
        onPress: restartQuiz,
        tone: 'secondary'
      },
      {
        label: STRINGS.onboarding.confirm_level,
        onPress: confirmOnboardingResult,
        tone: 'primary'
      }
    ]
  } : null

  return (
    <View style={{ flex: 1, backgroundColor: ONBOARDING_THEME.background }}>
      <StatusBar style="dark" translucent backgroundColor="#F2F0E8" />
      <SecondaryNavbar
        title={STRINGS.onboarding.title}
        showProgress
        progress={progress / 100}
        onBackPress={handleBack}
      />
      <ScrollView
        bounces={false}
        contentContainerStyle={{ 
          paddingBottom: Math.max(insets.bottom, 20), 
          paddingTop: 32,
          paddingHorizontal: SPACING.xl,
          flexGrow: 1
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1 }}>
          <View className="mb-8 flex-row items-center justify-between">
            <View className="px-4 py-2" style={{ backgroundColor: ONBOARDING_THEME.accent, borderRadius: RADIUS.md }}>
              <Text style={{ color: ONBOARDING_THEME.accentDeep, fontSize: 12, letterSpacing: 0.8, fontFamily: SCREEN_FONTS.cta }}>
                  {STRINGS.onboarding.step_label} {stepIndex + 1} / {ONBOARDING_QUESTIONS.length}
              </Text>
            </View>
            <View className="flex-row items-center px-3 py-2" style={{ backgroundColor: ONBOARDING_THEME.panel, borderRadius: RADIUS.md }}>
              <Swords size={14} color={ONBOARDING_THEME.accentDeep} />
              <Text style={{ marginLeft: 6, color: ONBOARDING_THEME.textMuted, fontSize: 12, fontFamily: SCREEN_FONTS.cta }}>
                {STRINGS.onboarding.title}
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: ONBOARDING_THEME.text,
              fontSize: 32,
              lineHeight: 38,
              fontFamily: SCREEN_FONTS.headline,
              textTransform: 'uppercase'
            }}
          >
            {currentQuestion.question}
          </Text>

          {currentQuestion.subtitle ? (
            <Text
              style={{
                marginTop: 12,
                color: ONBOARDING_THEME.textMuted,
                fontSize: 16,
                lineHeight: 24,
                fontFamily: SCREEN_FONTS.body,
              }}
            >
              {currentQuestion.subtitle}
            </Text>
          ) : null}

          <View style={{ marginTop: 40, gap: 14 }}>
            {currentQuestion.options.map((option) => {
              const isSelected = selectedLabel === option.label

              return (
                <TouchableOpacity
                  key={`${currentQuestion.id}-${option.label}`}
                  activeOpacity={0.92}
                  onPress={() => handleAnswerSelect(option.label, option.score)}
                  disabled={submitting}
                  style={{
                    minHeight: 72,
                    borderRadius: RADIUS.xl,
                    paddingHorizontal: 20,
                    paddingVertical: 18,
                    justifyContent: 'center',
                    backgroundColor: isSelected ? ONBOARDING_THEME.accentDeep : ONBOARDING_THEME.panel,
                    borderWidth: 1,
                    borderColor: isSelected ? ONBOARDING_THEME.accentDeep : ONBOARDING_THEME.border,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                      <Text
                        style={{
                          flex: 1,
                          color: isSelected ? ONBOARDING_THEME.white : ONBOARDING_THEME.text,
                          fontSize: 15,
                          lineHeight: 22,
                          fontFamily: SCREEN_FONTS.label,
                          paddingRight: 16,
                        }}
                      >
                        {option.label}
                      </Text>
                    <View
                      className="h-6 w-6 items-center justify-center rounded-full"
                      style={{ 
                        backgroundColor: isSelected ? ONBOARDING_THEME.white : 'transparent',
                        borderWidth: isSelected ? 0 : 1,
                        borderColor: isSelected ? ONBOARDING_THEME.white : ONBOARDING_THEME.border
                      }}
                    >
                      {isSelected && (
                        <CheckCircle2 size={14} color={ONBOARDING_THEME.accentDeep} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Container */}
      <View
        style={{
          paddingHorizontal: SPACING.xl,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 24),
          backgroundColor: ONBOARDING_THEME.background,
          borderTopWidth: 1,
          borderTopColor: ONBOARDING_THEME.border,
        }}
      >
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <View style={{ flex: 1 }}>
            <AppButton
              label={STRINGS.common.back}
              variant="secondary"
              onPress={handleBack}
              disabled={submitting || stepIndex === 0}
            />
          </View>

          <View style={{ flex: 2 }}>
            <AppButton
              label={isLastQuestion ? STRINGS.onboarding.view_result : STRINGS.onboarding.next}
              onPress={isLastQuestion ? openResultPreview : handleNext}
              disabled={!isCurrentAnswerSelected || submitting}
            />
          </View>
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
            <Text style={{ color: PROFILE_THEME_COLORS.error, fontSize: 14, fontFamily: SCREEN_FONTS.cta }}>{STRINGS.onboarding.submit_error}</Text>
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={openResultPreview}
              style={{
                borderRadius: RADIUS.md,
                backgroundColor: PROFILE_THEME_COLORS.error,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: ONBOARDING_THEME.white, fontSize: 13, fontFamily: SCREEN_FONTS.cta }}>{STRINGS.common.retry}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

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
              backgroundColor: ONBOARDING_THEME.white,
              padding: 24,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 12 },
              elevation: 8,
            }}
          >
            <View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: ONBOARDING_THEME.accent }}>
              <CheckCircle2 size={32} color={ONBOARDING_THEME.accentDeep} />
            </View>
            <Text
              style={{
                marginTop: 16,
                color: ONBOARDING_THEME.accentDeep,
                fontSize: 12,
                letterSpacing: 1,
                fontFamily: SCREEN_FONTS.headline,
                textTransform: 'uppercase'
              }}
            >
              {STRINGS.onboarding.result_title}
            </Text>
            <Text
              style={{
                marginTop: 10,
                color: ONBOARDING_THEME.text,
                fontSize: 28,
                lineHeight: 34,
                textAlign: 'center',
                fontFamily: SCREEN_FONTS.headline,
                textTransform: 'uppercase'
              }}
            >
              {resultPreview.tierLabel}
            </Text>
            <Text
              style={{
                marginTop: 8,
                color: ONBOARDING_THEME.textMuted,
                fontSize: 15,
                lineHeight: 22,
                textAlign: 'center',
                fontFamily: SCREEN_FONTS.body,
              }}
            >
              {resultPreview.description}
            </Text>

            <View
              className="mt-6 rounded-2xl px-4 py-4"
              style={{ backgroundColor: ONBOARDING_THEME.panel, borderWidth: BORDER.base, borderColor: ONBOARDING_THEME.border, width: '100%' }}
            >
              <Text
                style={{
                  color: ONBOARDING_THEME.textMuted,
                  fontSize: 11,
                  letterSpacing: 1,
                  fontFamily: SCREEN_FONTS.headline,
                  textTransform: 'uppercase',
                  textAlign: 'center',
                }}
              >
                {STRINGS.onboarding.initial_elo}
              </Text>
              <Text
                style={{
                  marginTop: 4,
                  color: ONBOARDING_THEME.text,
                  fontSize: 32,
                  textAlign: 'center',
                  fontFamily: SCREEN_FONTS.headline,
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
                {STRINGS.onboarding.submit_error}
              </Text>
            ) : null}

            <View className="mt-8 w-full flex-row items-center" style={{ gap: 12 }}>
              <View style={{ flex: 1 }}>
                <AppButton
                  label={STRINGS.onboarding.redo_quiz}
                  variant="secondary"
                  onPress={restartQuiz}
                  disabled={submitting}
                />
              </View>
              <View style={{ flex: 1.2 }}>
                <AppButton
                  label={STRINGS.common.confirm}
                  onPress={confirmOnboardingResult}
                  loading={submitting}
                />
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  )
}

