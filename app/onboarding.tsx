import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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

type TransitionDirection = 'forward' | 'backward'

export default function OnboardingScreen() {
  const { width } = useWindowDimensions()
  const translateX = useRef(new Animated.Value(0)).current
  const advanceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  const [stepIndex, setStepIndex] = useState(0)
  const [scores, setScores] = useState<AnswerScores>({})
  const [labels, setLabels] = useState<AnswerLabels>({})
  const [isAnimating, setIsAnimating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [completionTier, setCompletionTier] = useState<string | null>(null)
  const [completionDescription, setCompletionDescription] = useState<string | null>(null)
  const [errorVisible, setErrorVisible] = useState(false)

  const currentQuestion = ONBOARDING_QUESTIONS[stepIndex]
  const selectedLabel = labels[currentQuestion.id]
  const progress = ((stepIndex + 1) / ONBOARDING_QUESTIONS.length) * 100
  const isLastQuestion = stepIndex === ONBOARDING_QUESTIONS.length - 1

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (advanceTimeout.current) clearTimeout(advanceTimeout.current)
    }
  }, [])

  useEffect(() => {
    if (!completionTier) return

    const timeout = setTimeout(() => {
      if (!isMountedRef.current) return
      router.replace('/(tabs)')
    }, 1400)

    return () => clearTimeout(timeout)
  }, [completionTier])

  const isCurrentAnswerSelected = useMemo(() => Boolean(selectedLabel), [selectedLabel])

  function animateToStep(nextIndex: number, direction: TransitionDirection) {
    if (isAnimating || nextIndex < 0 || nextIndex >= ONBOARDING_QUESTIONS.length) return

    setIsAnimating(true)
    const exitTarget = direction === 'forward' ? -width * 0.18 : width * 0.18
    const enterStart = direction === 'forward' ? width : -width

    Animated.timing(translateX, {
      toValue: exitTarget,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setStepIndex(nextIndex)
      translateX.setValue(enterStart)
      Animated.timing(translateX, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false)
      })
    })
  }

  function handleAnswerSelect(label: string, score: number) {
    if (submitting || isAnimating) return

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
        animateToStep(stepIndex + 1, 'forward')
      }, 300)
    }
  }

  function handleBack() {
    if (submitting || isAnimating || stepIndex === 0) return
    if (advanceTimeout.current) clearTimeout(advanceTimeout.current)
    setErrorVisible(false)
    animateToStep(stepIndex - 1, 'backward')
  }

  function handleNext() {
    if (!isCurrentAnswerSelected || submitting || isAnimating || isLastQuestion) return
    if (advanceTimeout.current) clearTimeout(advanceTimeout.current)
    animateToStep(stepIndex + 1, 'forward')
  }

  async function submitOnboarding() {
    if (submitting) return

    const timePlayingAnswer = labels.time_playing
    const preferenceAnswer = labels.play_preference

    if (!timePlayingAnswer || !preferenceAnswer) return

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

      const { elo, tier, preference } = calculateInitialElo(scores, timePlayingAnswer, preferenceAnswer)
      const legacySkillLabel = getLegacySkillLabelForTier(tier)
      const selfAssessedLevel = getSelfAssessedLevelForElo(elo)

      const { error } = await supabase
        .from('players')
        .update({
          elo,
          current_elo: elo,
          elo_matches_played: 0,
          onboarding_completed: true,
          skill_tier: tier,
          play_preference: preference,
          skill_label: legacySkillLabel,
          self_assessed_level: selfAssessedLevel,
          is_provisional: true,
          placement_matches_played: 0,
        })
        .eq('id', user.id)

      if (error) {
        throw new Error(error.message)
      }

      if (!isMountedRef.current) return
      setCompletionTier(getSimpleTierLabel(tier))
      setCompletionDescription(getUserDescriptionForTier(tier))
    } catch (error) {
      console.warn('[Onboarding] submit failed:', error)
      if (!isMountedRef.current) return
      setErrorVisible(true)
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Khởi động</Text>
        <Text style={styles.title}>Để mình ước lượng mức khởi điểm phù hợp cho bạn</Text>
        <Text style={styles.subtitle}>7 câu ngắn, trả lời theo cảm giác thật trên sân để app ghép kèo dễ chịu hơn. Hệ thống sẽ còn tiếp tục tinh chỉnh sau vài trận đầu.</Text>

        <View style={styles.progressMeta}>
          <Text style={styles.progressCount}>
            {stepIndex + 1}/{ONBOARDING_QUESTIONS.length}
          </Text>
          <Text style={styles.progressHint}>Khoảng 1 phút</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <View style={styles.body}>
        <Animated.View style={[styles.questionCard, { transform: [{ translateX }] }]}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          {currentQuestion.subtitle ? <Text style={styles.questionSubtitle}>{currentQuestion.subtitle}</Text> : null}

          <View style={styles.optionsList}>
            {currentQuestion.options.map((option) => {
              const isSelected = selectedLabel === option.label

              return (
                <TouchableOpacity
                  key={`${currentQuestion.id}-${option.label}`}
                  activeOpacity={0.92}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleAnswerSelect(option.label, option.score)}
                  disabled={submitting}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          {stepIndex > 0 ? (
            <TouchableOpacity activeOpacity={0.88} onPress={handleBack} style={styles.backButton} disabled={submitting || isAnimating}>
              <Text style={styles.backButtonText}>Quay lại</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButtonSpacer} />
          )}

          {isLastQuestion ? (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={submitOnboarding}
              disabled={!isCurrentAnswerSelected || submitting}
              style={[styles.primaryButton, (!isCurrentAnswerSelected || submitting) && styles.primaryButtonDisabled]}
            >
              {submitting ? (
                <View style={styles.loadingInline}>
                  <ActivityIndicator color="#ffffff" />
                  <Text style={styles.primaryButtonText}>Đang lưu...</Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>Hoàn thành</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={handleNext}
              disabled={!isCurrentAnswerSelected || submitting}
              style={[styles.primaryButton, (!isCurrentAnswerSelected || submitting) && styles.primaryButtonDisabled]}
            >
              <Text style={styles.primaryButtonText}>Tiếp theo</Text>
            </TouchableOpacity>
          )}
        </View>

        {errorVisible ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>Có lỗi xảy ra, thử lại nhé</Text>
            <TouchableOpacity activeOpacity={0.9} onPress={submitOnboarding} style={styles.toastRetry}>
              <Text style={styles.toastRetryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {completionTier ? (
        <View style={styles.completionOverlay}>
          <View style={styles.completionCard}>
            <Text style={styles.completionEyebrow}>Đã xong</Text>
            <Text style={styles.completionTitle}>{completionTier}</Text>
            {completionDescription ? <Text style={styles.completionSummary}>{completionDescription}</Text> : null}
            <Text style={styles.completionText}>
              Hệ thống đã ghi nhận mức khởi điểm của bạn. Elo sẽ chính xác hơn sau 5 trận đầu tiên và tiếp tục được tinh chỉnh bằng kết quả thực tế.
            </Text>
            <ActivityIndicator color="#0f9f6e" style={{ marginTop: 16 }} />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f6ef',
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    backgroundColor: '#16392f',
  },
  eyebrow: {
    color: '#b7f7de',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  title: {
    color: '#fffdf7',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255, 251, 235, 0.88)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressCount: {
    color: '#d1fae5',
    fontSize: 12,
    fontWeight: '800',
  },
  progressHint: {
    color: 'rgba(255, 251, 235, 0.75)',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#34d399',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  questionCard: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: '#fffdf8',
    padding: 20,
    shadowColor: '#10231d',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  questionText: {
    color: '#10231d',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 10,
  },
  questionSubtitle: {
    color: '#5a6d63',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    minHeight: 62,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dde6df',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  optionCardSelected: {
    borderWidth: 2,
    borderColor: '#0f9f6e',
    backgroundColor: '#ecf9f2',
  },
  optionText: {
    color: '#173028',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  optionTextSelected: {
    color: '#0b6f4d',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    backgroundColor: '#f6f6ef',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 92,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8eeea',
  },
  backButtonSpacer: {
    width: 92,
  },
  backButtonText: {
    color: '#42584d',
    fontSize: 15,
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f9f6e',
  },
  primaryButtonDisabled: {
    backgroundColor: '#9ad9c0',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toast: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: '#2a2d2b',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  toastRetry: {
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toastRetryText: {
    color: '#16392f',
    fontSize: 13,
    fontWeight: '900',
  },
  completionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  completionCard: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#fffdf8',
    padding: 24,
    alignItems: 'center',
  },
  completionEyebrow: {
    color: '#0f9f6e',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  completionTitle: {
    color: '#10231d',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 10,
  },
  completionText: {
    color: '#4f6458',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  completionSummary: {
    color: '#173028',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
})
