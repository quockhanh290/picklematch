import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { SKILL_ASSESSMENT_LEVELS, type SkillAssessmentLevel } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'

const CITIES = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng']

type Court = { id: string; name: string; address: string; city: string }

function inferLevelIdFromLegacySkill(skillLabel?: string | null): SkillAssessmentLevel['id'] {
  switch (skillLabel) {
    case 'beginner':
      return 'level_1'
    case 'basic':
      return 'level_2'
    case 'advanced':
      return 'level_5'
    case 'intermediate':
    default:
      return 'level_3'
  }
}

export default function EditProfile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [selectedLevelId, setSelectedLevelId] = useState<SkillAssessmentLevel['id']>('level_3')
  const [originalLevelId, setOriginalLevelId] = useState<SkillAssessmentLevel['id']>('level_3')
  const [autoAccept, setAutoAccept] = useState(false)

  const [keyword, setKeyword] = useState('')
  const [courts, setCourts] = useState<Court[]>([])
  const [searching, setSearching] = useState(false)
  const [favCourts, setFavCourts] = useState<Court[]>([])
  const [favCourtIds, setFavCourtIds] = useState<string[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (!keyword.trim()) {
      setCourts([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('courts')
        .select('id, name, address, city')
        .ilike('name', `%${keyword.trim()}%`)
        .limit(8)

      setCourts(data ?? [])
      setSearching(false)
    }, 400)
  }, [keyword])

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login' as any)
      return
    }

    setMyId(user.id)

    const { data } = await supabase
      .from('players')
      .select('name, city, skill_label, self_assessed_level, auto_accept, favorite_court_ids')
      .eq('id', user.id)
      .single()

    if (data) {
      setName(data.name ?? '')
      setCity(data.city ?? '')

      const levelId =
        (data.self_assessed_level as SkillAssessmentLevel['id'] | null) ??
        inferLevelIdFromLegacySkill(data.skill_label)

      setSelectedLevelId(levelId)
      setOriginalLevelId(levelId)
      setAutoAccept(Boolean(data.auto_accept))

      const ids: string[] = data.favorite_court_ids ?? []
      setFavCourtIds(ids)

      if (ids.length > 0) {
        const { data: courtData } = await supabase
          .from('courts')
          .select('id, name, address, city')
          .in('id', ids)
        setFavCourts(courtData ?? [])
      }
    }

    setLoading(false)
  }

  function addFavCourt(court: Court) {
    if (favCourtIds.includes(court.id)) return

    if (favCourtIds.length >= 5) {
      Alert.alert('Tối đa 5 sân', 'Xóa bớt sân để thêm sân mới.')
      return
    }

    setFavCourtIds((prev) => [...prev, court.id])
    setFavCourts((prev) => [...prev, court])
    setKeyword('')
    setCourts([])
  }

  function removeFavCourt(courtId: string) {
    setFavCourtIds((prev) => prev.filter((id) => id !== courtId))
    setFavCourts((prev) => prev.filter((court) => court.id !== courtId))
  }

  function handleSelectLevel(levelId: SkillAssessmentLevel['id']) {
    if (levelId === selectedLevelId) return

    if (levelId !== originalLevelId) {
      const nextLevel = SKILL_ASSESSMENT_LEVELS.find((level) => level.id === levelId)

      Alert.alert(
        'Đổi trình độ tự đánh giá?',
        `Nếu chuyển sang "${nextLevel?.title ?? 'mức mới'}", tài khoản của bạn sẽ bị reset về placement mode và số placement matches sẽ được tính lại từ đầu. Bạn có muốn tiếp tục không?`,
        [
          { text: 'Giữ nguyên', style: 'cancel' },
          { text: 'Xác nhận đổi', onPress: () => setSelectedLevelId(levelId) },
        ],
      )
      return
    }

    setSelectedLevelId(levelId)
  }

  async function save() {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống')
      return
    }

    if (!myId) return

    const selectedLevel = SKILL_ASSESSMENT_LEVELS.find((level) => level.id === selectedLevelId)
    const skillChanged = selectedLevelId !== originalLevelId
    const newElo = selectedLevel?.starting_elo ?? 1150

    setSaving(true)

    const updates: Record<string, any> = {
      name: name.trim(),
      city,
      self_assessed_level: selectedLevelId,
      skill_label: selectedLevel?.legacy_skill_label ?? 'intermediate',
      current_elo: newElo,
      elo: newElo,
      favorite_court_ids: favCourtIds,
      auto_accept: autoAccept,
    }

    if (skillChanged) {
      updates.is_provisional = true
      updates.placement_matches_played = 0
    }

    const { error } = await supabase.from('players').update(updates).eq('id', myId)

    setSaving(false)

    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }

    if (skillChanged) {
      setOriginalLevelId(selectedLevelId)
    }

    Alert.alert(
      'Đã lưu',
      skillChanged
        ? 'Hồ sơ đã được cập nhật. Trình độ mới đã áp dụng và tài khoản của bạn đã quay lại placement mode.'
        : 'Hồ sơ của bạn đã được cập nhật.',
      [{ text: 'OK', onPress: () => router.back() }],
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Quay lại</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>

      <Text style={styles.label}>Tên hiển thị</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Nhập tên của bạn"
        maxLength={30}
      />

      <Text style={styles.label}>Thành phố</Text>
      <View style={styles.optionRow}>
        {CITIES.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.optionBtn, city === item && styles.optionBtnActive]}
            onPress={() => setCity(item)}
          >
            <Text style={[styles.optionText, city === item && styles.optionTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Trình độ tự đánh giá</Text>
      <Text style={styles.helperText}>
        Nếu bạn đổi mức trình độ, tài khoản sẽ bị reset về placement mode. App sẽ hỏi xác nhận trước khi áp dụng thay đổi này.
      </Text>

      <View style={styles.skillList}>
        {SKILL_ASSESSMENT_LEVELS.map((level) => {
          const isSelected = selectedLevelId === level.id

          return (
            <TouchableOpacity
              key={level.id}
              style={[styles.skillCard, isSelected && styles.skillCardActive]}
              onPress={() => handleSelectLevel(level.id)}
            >
              <View style={styles.skillCardHeader}>
                <Text style={[styles.skillTitle, isSelected && styles.skillTitleActive]}>{level.title}</Text>
                <View style={[styles.skillBadge, isSelected && styles.skillBadgeActive]}>
                  <Text style={[styles.skillBadgeText, isSelected && styles.skillBadgeTextActive]}>{level.dupr}</Text>
                </View>
              </View>

              <Text style={styles.skillMeta}>
                {level.subtitle} · Elo {level.starting_elo}
              </Text>
              <Text style={styles.skillDescription}>{level.description}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={styles.label}>Tự động duyệt người cùng trình</Text>
      <View style={styles.toggleCard}>
        <View style={styles.toggleCopy}>
          <Text style={styles.toggleTitle}>Auto-accept cho Smart Join</Text>
          <Text style={styles.toggleDescription}>
            Khi bật, người chơi được hệ thống đánh giá là phù hợp sẽ vào kèo ngay thay vì phải xin duyệt thủ công.
          </Text>
        </View>
        <Switch value={autoAccept} onValueChange={setAutoAccept} trackColor={{ false: '#d1d5db', true: '#86efac' }} thumbColor={autoAccept ? '#16a34a' : '#f8fafc'} />
      </View>

      <Text style={styles.label}>
        Sân ưa thích <Text style={styles.labelHint}>(tối đa 5)</Text>
      </Text>

      {favCourts.length > 0 && (
        <View style={styles.favList}>
          {favCourts.map((court) => (
            <View key={court.id} style={styles.favItem}>
              <View style={styles.flexOne}>
                <Text style={styles.favName}>{court.name}</Text>
                <Text style={styles.favAddress}>📍 {court.address} · {court.city}</Text>
              </View>
              <TouchableOpacity onPress={() => removeFavCourt(court.id)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {favCourtIds.length < 5 && (
        <>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Tìm sân để thêm..."
            value={keyword}
            onChangeText={setKeyword}
          />

          {searching && <ActivityIndicator color="#16a34a" style={styles.searchingIndicator} />}

          {!searching && keyword.length > 0 && courts.length === 0 && (
            <Text style={styles.noResult}>Không tìm thấy sân nào</Text>
          )}

          <FlatList
            data={courts}
            keyExtractor={(court) => court.id}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const alreadyAdded = favCourtIds.includes(item.id)

              return (
                <TouchableOpacity
                  style={[styles.courtItem, alreadyAdded && styles.courtItemAdded]}
                  onPress={() => addFavCourt(item)}
                  disabled={alreadyAdded}
                >
                  <View style={styles.flexOne}>
                    <Text style={styles.courtItemName}>{item.name}</Text>
                    <Text style={styles.courtItemAddress}>📍 {item.address} · {item.city}</Text>
                  </View>
                  <Text style={alreadyAdded ? styles.addedText : styles.addText}>
                    {alreadyAdded ? '✓ Đã thêm' : '+ Thêm'}
                  </Text>
                </TouchableOpacity>
              )
            }}
          />
        </>
      )}

      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={save} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  labelHint: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '400',
  },
  helperText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6b7280',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: '#333',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionBtn: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionBtnActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  optionText: {
    fontSize: 13,
    color: '#555',
  },
  optionTextActive: {
    color: '#16a34a',
    fontWeight: '600',
  },
  skillList: {
    gap: 10,
  },
  skillCard: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#fff',
  },
  skillCardActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  skillCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  skillTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  skillTitleActive: {
    color: '#166534',
  },
  skillBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  skillBadgeActive: {
    backgroundColor: '#166534',
  },
  skillBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  skillBadgeTextActive: {
    color: '#fff',
  },
  skillMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 6,
  },
  skillDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: '#4b5563',
  },
  toggleCard: {
    marginTop: 6,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: '#dcfce7',
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleCopy: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: '#15803d',
  },
  favList: {
    borderWidth: 1.5,
    borderColor: '#f0f0f0',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  favItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  flexOne: {
    flex: 1,
  },
  favName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  favAddress: {
    fontSize: 12,
    color: '#888',
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '700',
  },
  searchInput: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: '#333',
  },
  searchingIndicator: {
    marginTop: 8,
  },
  noResult: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 8,
  },
  courtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  courtItemAdded: {
    opacity: 0.5,
  },
  courtItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  courtItemAddress: {
    fontSize: 12,
    color: '#888',
  },
  addText: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '700',
  },
  addedText: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
  },
  saveBtnDisabled: {
    backgroundColor: '#86efac',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
