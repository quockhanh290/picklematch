import { AppButton, AppInput, EmptyState, ScreenHeader, SectionCard, StatusBadge } from '@/components/design'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { SKILL_ASSESSMENT_LEVELS, type SkillAssessmentLevel } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { MapPin } from 'lucide-react-native'

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
        (data.self_assessed_level as SkillAssessmentLevel['id'] | null) ?? inferLevelIdFromLegacySkill(data.skill_label)

      setSelectedLevelId(levelId)
      setOriginalLevelId(levelId)
      setAutoAccept(Boolean(data.auto_accept))

      const ids: string[] = data.favorite_court_ids ?? []
      setFavCourtIds(ids)

      if (ids.length > 0) {
        const { data: courtData } = await supabase.from('courts').select('id, name, address, city').in('id', ids)
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
      <SafeAreaView className="flex-1 items-center justify-center bg-stone-100" edges={['top']}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <ScreenHeader
          eyebrow="Cá nhân hoá"
          title="Chỉnh sửa hồ sơ"
          subtitle="Cập nhật thông tin cá nhân, level tự đánh giá và các sân bạn hay chơi để ghép kèo chuẩn hơn."
        />

        <View className="px-5">
          <SectionCard title="Thông tin cơ bản" className="mb-4">
            <View className="gap-4">
              <AppInput label="Tên hiển thị" value={name} onChangeText={setName} placeholder="Nhập tên của bạn" maxLength={30} />

              <View>
                <Text className="mb-2 text-sm font-bold text-slate-900">Thành phố</Text>
                <View className="flex-row flex-wrap gap-2">
                  {CITIES.map((item) => {
                    const isActive = city === item
                    return (
                      <TouchableOpacity
                        key={item}
                        activeOpacity={0.88}
                        className={`rounded-full border px-4 py-2 ${isActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                        onPress={() => setCity(item)}
                      >
                        <Text className={`text-sm font-semibold ${isActive ? 'text-emerald-700' : 'text-slate-600'}`}>{item}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            </View>
          </SectionCard>

          <SectionCard
            title="Trình độ tự đánh giá"
            subtitle="Nếu bạn đổi mức trình độ, tài khoản sẽ bị reset về placement mode. App sẽ hỏi xác nhận trước khi áp dụng thay đổi."
            className="mb-4"
          >
            <View className="gap-3">
              {SKILL_ASSESSMENT_LEVELS.map((level) => {
                const isSelected = selectedLevelId === level.id

                return (
                  <TouchableOpacity
                    key={level.id}
                    activeOpacity={0.9}
                    className={`rounded-[24px] border p-4 ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                    onPress={() => handleSelectLevel(level.id)}
                  >
                    <View className="flex-row items-start justify-between">
                      <Text className={`flex-1 pr-3 text-base font-extrabold ${isSelected ? 'text-emerald-800' : 'text-slate-900'}`}>
                        {level.title}
                      </Text>
                      <StatusBadge label={level.dupr} tone={isSelected ? 'success' : 'neutral'} />
                    </View>
                    <Text className="mt-2 text-sm font-semibold text-slate-500">
                      {level.subtitle} · Elo {level.starting_elo}
                    </Text>
                    <Text className="mt-3 text-sm leading-6 text-slate-500">{level.description}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </SectionCard>

          <SectionCard title="Smart Join" subtitle="Thiết lập cách hệ thống xử lý người chơi phù hợp trình độ khi họ muốn vào kèo của bạn." className="mb-4">
            <View className="flex-row items-center gap-3 rounded-[24px] bg-emerald-50 p-4">
              <View className="flex-1">
                <Text className="text-sm font-extrabold text-emerald-800">Auto-accept cho Smart Join</Text>
                <Text className="mt-2 text-sm leading-6 text-emerald-700">
                  Khi bật, người chơi được hệ thống đánh giá là phù hợp sẽ vào kèo ngay thay vì phải xin duyệt thủ công.
                </Text>
              </View>
              <Switch
                value={autoAccept}
                onValueChange={setAutoAccept}
                trackColor={{ false: '#d1d5db', true: '#86efac' }}
                thumbColor={autoAccept ? '#16a34a' : '#f8fafc'}
              />
            </View>
          </SectionCard>

          <SectionCard title="Sân ưa thích" subtitle="Chọn tối đa 5 sân để app ưu tiên gợi ý các kèo gần gu của bạn." className="mb-4">
            {favCourts.length > 0 ? (
              <View className="mb-4 gap-3">
                {favCourts.map((court) => (
                  <View key={court.id} className="flex-row items-center rounded-[22px] bg-slate-50 p-4">
                    <View className="flex-1">
                      <Text className="text-sm font-extrabold text-slate-900">{court.name}</Text>
                      <View className="mt-1 flex-row items-center">
                        <MapPin size={13} color="#94a3b8" />
                        <Text className="ml-1 text-sm text-slate-500">{court.address} · {court.city}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.88}
                      className="h-8 w-8 items-center justify-center rounded-full bg-rose-100"
                      onPress={() => removeFavCourt(court.id)}
                    >
                      <Text className="text-sm font-black text-rose-700">×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                icon={<MapPin size={28} color="#64748b" />}
                title="Chưa có sân ưa thích"
                description="Thêm vài sân bạn hay chơi để app gợi ý kèo sát nhu cầu hơn."
              />
            )}

            {favCourtIds.length < 5 ? (
              <>
                <AppInput
                  label="Tìm sân để thêm"
                  value={keyword}
                  onChangeText={setKeyword}
                  placeholder="Nhập tên sân bạn muốn tìm"
                />

                {searching ? <ActivityIndicator color="#16a34a" style={{ marginTop: 12 }} /> : null}

                {!searching && keyword.length > 0 && courts.length === 0 ? (
                  <Text className="mt-3 text-sm text-slate-400">Không tìm thấy sân nào</Text>
                ) : null}

                <FlatList
                  className="mt-3"
                  data={courts}
                  keyExtractor={(court) => court.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => {
                    const alreadyAdded = favCourtIds.includes(item.id)

                    return (
                      <TouchableOpacity
                        activeOpacity={0.88}
                        className={`mb-3 flex-row items-center rounded-[22px] border p-4 ${
                          alreadyAdded ? 'border-slate-200 bg-slate-100 opacity-60' : 'border-slate-200 bg-white'
                        }`}
                        onPress={() => addFavCourt(item)}
                        disabled={alreadyAdded}
                      >
                        <View className="flex-1">
                          <Text className="text-sm font-extrabold text-slate-900">{item.name}</Text>
                          <View className="mt-1 flex-row items-center">
                            <MapPin size={13} color="#94a3b8" />
                            <Text className="ml-1 text-sm text-slate-500">{item.address} · {item.city}</Text>
                          </View>
                        </View>
                        <StatusBadge label={alreadyAdded ? 'Đã thêm' : 'Thêm'} tone={alreadyAdded ? 'neutral' : 'success'} />
                      </TouchableOpacity>
                    )
                  }}
                />
              </>
            ) : (
              <View className="mt-4 rounded-[22px] bg-amber-50 px-4 py-3">
                <Text className="text-sm leading-6 text-amber-700">Bạn đã chọn đủ 5 sân. Xóa bớt một sân nếu muốn thêm sân mới.</Text>
              </View>
            )}
          </SectionCard>

          <AppButton label="Lưu thay đổi" onPress={save} loading={saving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
