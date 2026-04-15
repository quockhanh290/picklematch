import { AppButton, AppInput, EmptyState, ScreenHeader, SectionCard, StatusBadge } from '@/components/design'
import { getEloBandByLegacySkillLabel, getEloBandByLevelId, getUserDescriptionForLevelId } from '@/lib/eloSystem'
import { getSkillLevelById, type SkillAssessmentLevel } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { MapPin } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const CITIES = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng']

type Court = { id: string; name: string; address: string; city: string }

function inferLevelIdFromLegacySkill(skillLabel?: string | null): SkillAssessmentLevel['id'] {
  return getEloBandByLegacySkillLabel(skillLabel).levelId
}

export default function EditProfile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [selectedLevelId, setSelectedLevelId] = useState<SkillAssessmentLevel['id']>('level_3')
  const [autoAccept, setAutoAccept] = useState(false)

  const [keyword, setKeyword] = useState('')
  const [courts, setCourts] = useState<Court[]>([])
  const [searching, setSearching] = useState(false)
  const [favCourts, setFavCourts] = useState<Court[]>([])
  const [favCourtIds, setFavCourtIds] = useState<string[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    void init()
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

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
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

  function handleRedoAssessment() {
    Alert.alert(
      'Làm lại bài đánh giá?',
      'Mức hiện tại sẽ được giữ nguyên cho tới khi bạn hoàn thành bài đánh giá mới. Sau đó hệ thống sẽ cập nhật mức khởi điểm phù hợp hơn.',
      [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Bắt đầu', onPress: () => router.push('/onboarding' as any) },
      ],
    )
  }

  async function save() {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống')
      return
    }

    if (!myId) return

    setSaving(true)

    const updates = {
      name: name.trim(),
      city,
      favorite_court_ids: favCourtIds,
      auto_accept: autoAccept,
    }

    const { error } = await supabase.from('players').update(updates).eq('id', myId)

    setSaving(false)

    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }

    Alert.alert('Đã lưu', 'Hồ sơ của bạn đã được cập nhật.', [{ text: 'OK', onPress: () => router.back() }])
  }

  const currentLevel = getSkillLevelById(selectedLevelId)
  const currentBand = getEloBandByLevelId(selectedLevelId)
  const currentDescription = getUserDescriptionForLevelId(selectedLevelId)

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
          eyebrow="Cá nhân hóa"
          title="Chỉnh sửa hồ sơ"
          subtitle="Cập nhật thông tin cá nhân, cách ghép nhanh xử lý kèo và những sân bạn hay chơi."
        />

        <View className="px-5">
          <SectionCard title="Thông tin cơ bản" className="mb-4">
            <View className="gap-4">
              <AppInput label="Tên hiển thị" value={name} onChangeText={setName} placeholder="Nhập tên của bạn" maxLength={30} />

              <View>
                <AppInput
                  label="Thành phố"
                  value={city}
                  onChangeText={setCity}
                  placeholder="Ví dụ: TP. Hồ Chí Minh"
                />
                <View className="flex-row flex-wrap gap-2">
                  {CITIES.map((item) => {
                    const isActive = city.trim().toLowerCase() === item.toLowerCase()
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
            title="Mức chơi hiện tại"
            subtitle="Đây là mức khởi điểm để ghép kèo dễ chịu hơn. Hệ thống sẽ tiếp tục tinh chỉnh sau vài trận và phản hồi thực tế."
            className="mb-4"
          >
            <View className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-extrabold text-emerald-900">{currentBand?.shortLabel ?? currentLevel?.title ?? 'Trung cấp'}</Text>
                  <Text className="mt-2 text-sm font-semibold text-emerald-700">
                    {currentBand ? `Elo ${currentBand.seedElo} · ${currentBand.eloMin}-${currentBand.eloMax}` : 'Mức khởi điểm hiện tại'}
                  </Text>
                </View>
                <StatusBadge label="Mức hiện tại" tone="success" />
              </View>
              <Text className="mt-3 text-sm leading-6 text-emerald-800">
                {currentDescription ?? currentLevel?.description ?? 'Hệ thống sẽ tiếp tục hiệu chỉnh mức chơi này khi bạn có thêm trận và phản hồi thực tế.'}
              </Text>
            </View>

            <TouchableOpacity activeOpacity={0.9} className="mt-4 rounded-[20px] bg-slate-900 px-4 py-4" onPress={handleRedoAssessment}>
              <Text className="text-center text-sm font-extrabold text-white">Làm lại bài đánh giá</Text>
              <Text className="mt-2 text-center text-sm leading-6 text-slate-300">
                Dùng lại 7 câu hỏi onboarding để hệ thống ước lượng mức khởi điểm mới cho bạn.
              </Text>
            </TouchableOpacity>
          </SectionCard>

          <SectionCard title="Ghép nhanh" subtitle="Thiết lập cách hệ thống xử lý người chơi phù hợp trình độ khi họ muốn vào kèo của bạn." className="mb-4">
            <View className="flex-row items-center gap-3 rounded-[24px] bg-emerald-50 p-4">
              <View className="flex-1">
                <Text className="text-sm font-extrabold text-emerald-800">Tự nhận cho ghép nhanh</Text>
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
