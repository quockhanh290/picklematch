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
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  calculateInitialElo,
  getLegacySkillLabelForTier,
  getSelfAssessedLevelForElo,
  getSimpleTierLabel,
  ONBOARDING_QUESTIONS,
  type OnboardingQuestionId,
} from '@/lib/onboardingAssessment'
import { getUserDescriptionForTier } from '@/lib/eloSystem'
import { supabase } from '@/lib/supabase'

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
  emerald: '#059669',
  emeraldDark: '#006948',
  surfaceTint: '#ECFDF5',
  panel: '#F8FAFC',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  textStrong: '#0F2A1F',
  smoke: '#F7F9FB',
  white: '#FFFFFF',
  muted: '#64748B',
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
    <SafeAreaView style={{ flex: 1, backgroundColor: ELECTRIC.smoke }} edges={['left', 'right']}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <ScrollView
        bounces={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
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
              borderRadius: 999,
              borderWidth: 1,
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
              borderRadius: 999,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.24)',
            }}
          />

          <View style={{ paddingTop: heroTopPadding, paddingHorizontal: 20, paddingBottom: 32 }}>
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => (resultPreview ? setResultPreview(null) : stepIndex > 0 ? handleBack() : router.back())}
                disabled={submitting}
                className="h-12 w-12 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.14)',
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                <ArrowLeft size={20} color={ELECTRIC.white} />
              </Pressable>

              <View
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: 'rgba(236,253,245,0.18)', borderWidth: 1, borderColor: 'rgba(236,253,245,0.38)' }}
              >
                <Text style={{ color: '#D1FAE5', fontSize: 11, letterSpacing: 1.2, fontFamily: 'PlusJakartaSans-Bold' }}>
                  ELECTRIC COURT
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 34 }}>
              <Text
                style={{
                  color: '#D1FAE5',
                  fontSize: 28,
                  lineHeight: 30,
                  fontFamily: 'PlusJakartaSans-ExtraBoldItalic',
                }}
              >
                BUILD YOUR LEVEL
              </Text>
              <Text
                style={{
                  marginTop: 12,
                  color: '#F8FAFC',
                  fontSize: 12,
                  letterSpacing: 0.5,
                  fontFamily: 'PlusJakartaSans-Bold',
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
                  fontFamily: 'PlusJakartaSans-Regular',
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
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontFamily: 'PlusJakartaSans-Bold' }}>
                    Bước {stepIndex + 1}/{ONBOARDING_QUESTIONS.length}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.66)', fontSize: 12, fontFamily: 'PlusJakartaSans-Regular' }}>
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
                    fontFamily: 'PlusJakartaSans-Bold',
                  }}
                >
                  ~1 phút
                </Text>
              </View>
            </View>

            <View
              style={{
                marginTop: 14,
                height: 10,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.22)',
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: 999,
                  backgroundColor: '#34D399',
                }}
              />
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: -20 }}>
          <View
            style={{
              borderRadius: 32,
              backgroundColor: ELECTRIC.white,
              padding: 20,
              minHeight: questionCardMinHeight,
              shadowColor: '#191C1E',
              shadowOpacity: 0.08,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 16 },
              elevation: 8,
            }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <View className="rounded-full px-4 py-2" style={{ backgroundColor: ELECTRIC.surfaceTint }}>
                <Text style={{ color: ELECTRIC.emeraldDark, fontSize: 12, letterSpacing: 0.8, fontFamily: 'PlusJakartaSans-Bold' }}>
                  CÂU HỎI {stepIndex + 1}
                </Text>
              </View>
              <View className="flex-row items-center rounded-full px-3 py-2" style={{ backgroundColor: ELECTRIC.panel }}>
                <Swords size={14} color={ELECTRIC.emeraldDark} />
                <Text style={{ marginLeft: 6, color: ELECTRIC.muted, fontSize: 12, fontFamily: 'PlusJakartaSans-Bold' }}>
                  Match Fit
                </Text>
              </View>
            </View>

            <Text
              style={{
                color: ELECTRIC.textStrong,
                fontSize: 28,
                lineHeight: 34,
                fontFamily: 'PlusJakartaSans-Bold',
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
                  fontFamily: 'PlusJakartaSans-Regular',
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
                      borderRadius: 24,
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
                          fontFamily: 'PlusJakartaSans-Bold',
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
                          <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: '#CBD5E1' }} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleBack}
              disabled={submitting || stepIndex === 0}
              style={{
                width: 96,
                height: 56,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F0F4F8',
                opacity: stepIndex === 0 ? 0.45 : 1,
              }}
            >
              <Text style={{ color: ELECTRIC.emeraldDark, fontSize: 15, fontFamily: 'PlusJakartaSans-Bold' }}>Quay lại</Text>
            </TouchableOpacity>

            {isLastQuestion ? (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={openResultPreview}
                disabled={!isCurrentAnswerSelected || submitting}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: 28,
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
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: 'PlusJakartaSans-Bold' }}>Xem kết quả</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={handleNext}
                disabled={!isCurrentAnswerSelected || submitting}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: 28,
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
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontFamily: 'PlusJakartaSans-Bold' }}>Tiếp theo</Text>
              </TouchableOpacity>
            )}
          </View>

          {!resultPreview && errorVisible ? (
            <View
              style={{
                marginTop: 14,
                borderRadius: 22,
                backgroundColor: '#FFDAD6',
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: '#BA1A1A', fontSize: 14, fontFamily: 'PlusJakartaSans-Bold' }}>Có lỗi xảy ra, thử lại nhé</Text>
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={openResultPreview}
                style={{
                  borderRadius: 999,
                  backgroundColor: '#BA1A1A',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: ELECTRIC.white, fontSize: 13, fontFamily: 'PlusJakartaSans-Bold' }}>Thử lại</Text>
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
              borderRadius: 32,
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
                fontFamily: 'PlusJakartaSans-Bold',
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
                fontFamily: 'PlusJakartaSans-Bold',
              }}
            >
              {resultPreview.tierLabel}
            </Text>
            <Text
              style={{
                marginTop: 8,
                color: '#3D4A42',
                fontSize: 15,
                lineHeight: 22,
                textAlign: 'center',
                fontFamily: 'PlusJakartaSans-Regular',
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
                fontFamily: 'PlusJakartaSans-Regular',
              }}
            >
              Đây là mức khởi điểm để hệ thống ghép kèo dễ chịu hơn cho bạn. Bạn có thể xác nhận mức này hoặc làm lại quiz nếu thấy chưa đúng.
            </Text>

            <View
              className="mt-4 rounded-2xl px-4 py-3"
              style={{ backgroundColor: ELECTRIC.panel, borderWidth: 1, borderColor: ELECTRIC.border, width: '100%' }}
            >
              <Text
                style={{
                  color: ELECTRIC.muted,
                  fontSize: 12,
                  letterSpacing: 0.6,
                  fontFamily: 'PlusJakartaSans-Bold',
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
                  fontFamily: 'PlusJakartaSans-Bold',
                }}
              >
                {resultPreview.elo}
              </Text>
            </View>

            {errorVisible ? (
              <Text
                style={{
                  marginTop: 14,
                  color: '#b91c1c',
                  fontSize: 14,
                  lineHeight: 20,
                  textAlign: 'center',
                  fontFamily: 'PlusJakartaSans-Bold',
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
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ELECTRIC.panel,
                  borderWidth: 1,
                  borderColor: ELECTRIC.borderStrong,
                  opacity: submitting ? 0.65 : 1,
                }}
              >
                <Text style={{ color: ELECTRIC.textStrong, fontSize: 15, fontFamily: 'PlusJakartaSans-Bold' }}>Làm lại quiz</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.92}
                onPress={confirmOnboardingResult}
                disabled={submitting}
                style={{
                  flex: 1,
                  height: 54,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ELECTRIC.emerald,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 15, fontFamily: 'PlusJakartaSans-Bold' }}>Xác nhận mức này</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  )
}
