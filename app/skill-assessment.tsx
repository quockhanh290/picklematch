import { router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { SKILL_ASSESSMENT_LEVELS, type SkillAssessmentLevel, saveSkillAssessment } from '@/lib/skillAssessment'

export default function SkillAssessmentScreen() {
  const [selectedLevelId, setSelectedLevelId] = useState<SkillAssessmentLevel['id'] | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (!selectedLevelId) return

    setLoading(true)
    try {
      await saveSkillAssessment(selectedLevelId)
      router.replace('/(tabs)')
    } catch (error: any) {
      Alert.alert('Không thể lưu trình độ', error?.message ?? 'Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.heroBackground} />
      <View style={[styles.heroCircle, styles.heroCircleLeft]} />
      <View style={[styles.heroCircle, styles.heroCircleRight]} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.eyebrow}>
          <Text style={styles.eyebrowText}>Placement Mode</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.title}>Xác nhận trình độ của bạn</Text>
          <Text style={styles.subtitle}>
            Chọn mức độ mô tả đúng nhất về bạn trên sân để hệ thống ghép kèo chuẩn xác nhé.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelEyebrow}>5 nấc đánh giá thực chiến</Text>
          <Text style={styles.panelHint}>
            Hãy chọn theo cách bạn thật sự chơi trên sân, không phải mức bạn kỳ vọng đạt tới.
          </Text>

          {SKILL_ASSESSMENT_LEVELS.map((level, index) => {
            const isSelected = selectedLevelId === level.id
            const isFeatured = level.id === 'level_3'

            return (
              <TouchableOpacity
                key={level.id}
                activeOpacity={0.92}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => setSelectedLevelId(level.id)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderCopy}>
                    <View style={styles.cardTags}>
                      <View style={[styles.tag, isSelected ? styles.tagSelected : styles.tagMuted]}>
                        <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>Nấc {index + 1}</Text>
                      </View>
                      {isFeatured ? (
                        <View style={styles.tagFeatured}>
                          <Text style={styles.tagFeaturedText}>Phổ biến</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.cardTitle}>{level.title}</Text>
                    <Text style={styles.cardSubtitle}>{level.subtitle}</Text>
                  </View>

                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected ? <View style={styles.radioDot} /> : null}
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={[styles.metaBadge, isSelected ? styles.metaBadgeSelected : styles.metaBadgeSoft]}>
                    <Text style={[styles.metaBadgeText, isSelected && styles.metaBadgeTextSelected]}>
                      {level.dupr}
                    </Text>
                  </View>

                  <View style={styles.metaBadgeNeutral}>
                    <Text style={styles.metaNeutralText}>Elo khởi điểm {level.starting_elo}</Text>
                  </View>
                </View>

                <Text style={styles.description}>{level.description}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>5 trận đầu sẽ là placement matches</Text>
          <Text style={styles.noteText}>
            Tài khoản của bạn sẽ được đánh dấu provisional để hệ thống tinh chỉnh Elo thật nhanh, hạn chế
            overrate và smurfing.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.92}
          disabled={!selectedLevelId || loading}
          onPress={handleConfirm}
          style={[styles.button, (!selectedLevelId || loading) && styles.buttonDisabled]}
        >
          {loading ? (
            <View style={styles.buttonLoading}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.buttonText}>Đang xác nhận...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Xác nhận & Bắt đầu</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f4',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: '#052e2b',
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  heroCircleLeft: {
    top: 48,
    left: -48,
    width: 176,
    height: 176,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  heroCircleRight: {
    top: 92,
    right: -16,
    width: 148,
    height: 148,
    backgroundColor: 'rgba(163, 230, 53, 0.16)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 170,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 20,
  },
  eyebrowText: {
    color: '#ecfdf5',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  heroCopy: {
    marginBottom: 28,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(236, 253, 245, 0.88)',
    fontSize: 15,
    lineHeight: 24,
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  panelEyebrow: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  panelHint: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 18,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 24,
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 14,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardHeaderCopy: {
    flex: 1,
    marginRight: 12,
  },
  cardTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagMuted: {
    backgroundColor: '#f1f5f9',
  },
  tagSelected: {
    backgroundColor: '#047857',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  tagTextSelected: {
    color: '#ffffff',
  },
  tagFeatured: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fef3c7',
  },
  tagFeaturedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400e',
  },
  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    color: '#0f172a',
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#10b981',
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: '#10b981',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  metaBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaBadgeSoft: {
    backgroundColor: '#d1fae5',
  },
  metaBadgeSelected: {
    backgroundColor: '#047857',
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065f46',
  },
  metaBadgeTextSelected: {
    color: '#ffffff',
  },
  metaBadgeNeutral: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
  },
  metaNeutralText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  note: {
    marginTop: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
    padding: 16,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350f',
    marginBottom: 6,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#92400e',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
  },
  button: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#86efac',
  },
  buttonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
})
