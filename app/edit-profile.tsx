import { AppInput, EmptyState, StatusBadge } from '@/components/design'
import { ProfileSkillHero } from '@/components/profile/ProfileSections'
import { getEloBandByLegacySkillLabel, getEloBandByLevelId, getUserDescriptionForLevelId } from '@/lib/eloSystem'
import { getSkillLevelById, type SkillAssessmentLevel } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { Camera, ChevronLeft, MapPin } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, ScrollView, Switch, Text, TouchableOpacity, View, Keyboard } from 'react-native'
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
  const [elo, setElo] = useState(0)

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
  const scrollViewRef = useRef<ScrollView>(null)

  useEffect(() => {
    void init()
  }, [])

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 300)
    })

    return () => keyboardWillShow.remove()
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
      .select('name, city, skill_label, self_assessed_level, auto_accept, favorite_court_ids, elo, current_elo')
      .eq('id', user.id)
      .single()

    if (data) {
      setName(data.name ?? '')
      setCity(data.city ?? '')
      setElo(data.current_elo ?? data.elo ?? 0)

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

  function handleCourtSearchFocus() {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 300)
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
  const currentDescription = getUserDescriptionForLevelId(selectedLevelId)

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-stone-100" edges={['top']}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#f7f9fb' }} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white/60">
        <View className="flex-row items-center gap-4">
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#059669" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-emerald-800" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Cài đặt hồ sơ</Text>
        </View>
        <Text className="text-xl font-extrabold italic text-emerald-900" style={{ fontFamily: 'PlusJakartaSans-ExtraBoldItalic' }}>PickleMatch VN</Text>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingBottom: 500 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {/* Profile Header Section */}
        <View className="px-5 py-8 items-center">
          {/* Avatar with Orbit Decoration */}
          <View className="relative w-40 h-40 mb-6">
            {/* Orbit Decorations */}
            <View className="absolute -inset-4 border border-slate-200/30 rounded-full" />
            <View className="absolute -inset-8 border border-slate-200/20 rounded-full" />
            
            {/* Avatar */}
            <View className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg z-10 bg-slate-100 items-center justify-center">
              <View className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-700 items-center justify-center">
                <Text className="text-4xl font-extrabold text-white" style={{ fontFamily: 'PlusJakartaSans-ExtraBold' }}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity 
                activeOpacity={0.8} 
                className="absolute bottom-0 right-0 bg-emerald-600 p-2 rounded-full shadow-lg z-20"
              >
                <Camera size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Name and Join Date */}
          <Text className="text-2xl font-extrabold italic tracking-tight text-emerald-600 uppercase" style={{ fontFamily: 'PlusJakartaSans-ExtraBoldItalic' }}>
            {name || 'Người chơi'}
          </Text>
          <Text className="text-sm font-medium text-slate-600 mt-1" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
            Thành viên từ tháng 10, 2023
          </Text>
        </View>

        <View className="px-5 gap-6">
          {/* Basic Info Section */}
          <View>
            <View className="flex-row items-baseline gap-2 mb-4">
              <Text className="text-xl font-bold" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Thông tin cơ bản</Text>
              <View className="flex-1 h-px bg-slate-200" />
            </View>
            
            <View className="gap-4">
              <AppInput label="Tên hiển thị" value={name} onChangeText={setName} placeholder="Nhập tên của bạn" maxLength={30} />

              <View>
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1 mb-2" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Thành phố</Text>
                <View className="flex-row flex-wrap gap-2">
                  {CITIES.map((item) => {
                    const isActive = city.trim().toLowerCase() === item.toLowerCase()
                    return (
                      <TouchableOpacity
                        key={item}
                        activeOpacity={0.85}
                        className={`rounded-full px-6 py-2 ${isActive ? 'bg-emerald-600' : 'bg-slate-200'}`}
                        onPress={() => setCity(item)}
                      >
                        <Text className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{item}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* Skill Level Section */}
          <View>
            <View className="flex-row items-baseline gap-2 mb-4">
              <Text className="text-xl font-bold" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Mức chơi hiện tại</Text>
              <View className="flex-1 h-px bg-slate-200" />
            </View>

            <ProfileSkillHero
              elo={elo || 1200}
              title={currentLevel?.title ?? 'Đang hiệu chỉnh'}
              subtitle="Mức khởi điểm hiện tại. Hệ thống sẽ tiếp tục tinh chỉnh sau vài trận."
              description={currentDescription || 'Hệ thống xác định trình độ của bạn.'}
              levelId={selectedLevelId}
            />

            <TouchableOpacity 
              activeOpacity={0.85} 
              className="rounded-full bg-[#cd645f] px-4 py-4 mb-4 flex-row items-center justify-center"
              onPress={handleRedoAssessment}
            >
              <Text className="text-center text-sm font-extrabold text-white" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Làm lại bài đánh giá</Text>
            </TouchableOpacity>
            <Text className="text-center text-sm leading-6 text-slate-500 mb-4" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
              Dùng lại 7 câu hỏi onboarding để hệ thống ước lượng mức khởi điểm mới cho bạn.
            </Text>
          </View>

          {/* Quick Match Section */}
          <View>
            <View className="flex-row items-baseline gap-2 mb-4">
              <Text className="text-xl font-bold" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Ghép nhanh</Text>
              <View className="flex-1 h-px bg-slate-200" />
            </View>
            
            <View className="flex-row items-center gap-3 rounded-2xl bg-emerald-50 p-4">
              <View className="flex-1">
                <Text className="text-sm font-extrabold text-emerald-800" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Tự động ghép kèo nhanh</Text>
                <Text className="mt-2 text-sm leading-6 text-emerald-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                  Khi bật, người chơi được hệ thống đánh giá là phù hợp sẽ vào kèo ngay.
                </Text>
              </View>
              <Switch
                value={autoAccept}
                onValueChange={setAutoAccept}
                trackColor={{ false: '#d1d5db', true: '#86efac' }}
                thumbColor={autoAccept ? '#16a34a' : '#f8fafc'}
              />
            </View>
          </View>

          {/* Favorite Courts Section */}
          <View>
            <View className="flex-row items-baseline gap-2 mb-4">
              <Text className="text-xl font-bold" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Sân ưa thích</Text>
              <View className="flex-1 h-px bg-slate-200" />
            </View>

            <View>
              {favCourts.length > 0 ? (
                <View className="mb-4 gap-3">
                  {favCourts.map((court) => (
                    <View key={court.id} className="flex-row items-center gap-4 bg-white p-4 rounded-[28px] border border-slate-200">
                      <View className="w-12 h-12 rounded-full bg-emerald-50 items-center justify-center">
                        <MapPin size={20} color="#059669" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-slate-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{court.name}</Text>
                        <Text className="text-sm text-slate-600 mt-1" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>{court.address} · {court.city}</Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        className="w-10 h-10 items-center justify-center"
                        onPress={() => removeFavCourt(court.id)}
                      >
                        <Text className="text-xl font-black text-slate-400" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}

              {favCourtIds.length < 5 ? (
                <>
                  <AppInput
                    label="Tìm sân để thêm"
                    value={keyword}
                    onChangeText={setKeyword}
                    onFocus={handleCourtSearchFocus}
                    placeholder="Nhập tên sân bạn muốn tìm"
                  />

                  {searching ? <ActivityIndicator color="#16a34a" style={{ marginTop: 12 }} /> : null}

                  {!searching && keyword.length > 0 && courts.length === 0 ? (
                    <Text className="mt-3 text-sm text-slate-400" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>Không tìm thấy sân nào</Text>
                  ) : null}

                  <FlatList
                    className="mt-3"
                    data={courts}
                    keyExtractor={(court) => court.id}
                    scrollEnabled={false}
                    nestedScrollEnabled={false}
                    renderItem={({ item }) => {
                      const alreadyAdded = favCourtIds.includes(item.id)

                      return (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          className={`mb-3 flex-row items-center gap-4 p-4 rounded-[28px] border ${
                            alreadyAdded 
                              ? 'border-slate-200 bg-slate-100 opacity-60' 
                              : 'border-slate-200 bg-white'
                          }`}
                          onPress={() => addFavCourt(item)}
                          disabled={alreadyAdded}
                        >
                          <View className="w-12 h-12 rounded-full bg-emerald-50 items-center justify-center">
                            <MapPin size={20} color="#059669" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-bold text-slate-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{item.name}</Text>
                            <Text className="text-xs text-slate-600 mt-1" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>{item.address} · {item.city}</Text>
                          </View>
                          <StatusBadge label={alreadyAdded ? 'Đã thêm' : 'Thêm'} tone={alreadyAdded ? 'neutral' : 'success'} />
                        </TouchableOpacity>
                      )
                    }}
                  />
                </>
              ) : (
                <View className="mt-4 rounded-2xl bg-amber-50 px-4 py-3">
                  <Text className="text-sm leading-6 text-amber-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>Bạn đã chọn đủ 5 sân. Xóa bớt một sân nếu muốn thêm sân mới.</Text>
                </View>
              )}

              {favCourts.length === 0 && favCourtIds.length === 0 ? (
                <EmptyState
                  icon={<MapPin size={28} color="#64748b" />}
                  title="Chưa có sân ưa thích"
                  description="Thêm vài sân bạn hay chơi để app gợi ý kèo sát nhu cầu hơn."
                />
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white/60 px-5 py-4 border-t border-slate-200">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={save}
          disabled={saving}
          className="rounded-full overflow-hidden bg-[#059669] flex-row items-center justify-center py-4"
        >
          {saving ? (
            <>
              <ActivityIndicator color="#ffffff" />
              <Text className="ml-2 text-[13px] text-white tracking-[0.5px] uppercase" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                Đang xử lý...
              </Text>
            </>
          ) : (
            <Text className="text-[13px] text-white tracking-[0.5px] uppercase" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              Lưu thay đổi
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}
