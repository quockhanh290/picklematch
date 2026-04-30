import { AppDialog, type AppDialogConfig, AppInput, EmptyState, SecondaryNavbar, NavbarUserAvatar, StatusBadge } from '@/components/design'
import { PROFILE_SKILL_HERO_TONE, ProfileSkillHero } from '@/components/profile/ProfileSections'
import { PROFILE_THEME_COLORS as EDIT_PROFILE_COLORS } from '@/constants/theme/profileTheme'
import { getEloBandByLegacySkillLabel, getEloBandForElo, getEloBandByLevelId } from '@/lib/eloSystem'
import { getSkillLevelById, getSkillLevelFromPlayer, type SkillAssessmentLevel } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { MapPin, Menu } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, ImageBackground, Keyboard, ScrollView, Switch, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, BORDER, SHADOW } from '@/constants/screenLayout'

const CITIES = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng']
const HERO_IMAGE = require('../assets/images/login-electric-court-hero.png')
type Court = { id: string; name: string; address: string; city: string }
type EditProfileInitialState = {
  name: string
  city: string
  autoAccept: boolean
  favoriteCourts: Court[]
  favoriteCourtIds: string[]
  bio: string
}


export default function EditProfile() {
  const { width } = useWindowDimensions()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)
  const [elo, setElo] = useState(0)

  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [selectedLevelId, setSelectedLevelId] = useState<SkillAssessmentLevel['id']>('level_1')
  const [autoAccept, setAutoAccept] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [placementMatchesPlayed, setPlacementMatchesPlayed] = useState(0)
  const [bio, setBio] = useState('')

  const [keyword, setKeyword] = useState('')
  const [courts, setCourts] = useState<Court[]>([])
  const [searching, setSearching] = useState(false)
  const [favCourts, setFavCourts] = useState<Court[]>([])
  const [favCourtIds, setFavCourtIds] = useState<string[]>([])
  const [playerData, setPlayerData] = useState<any>(null)

  const [dialogConfig, setDialogConfig] = useState<AppDialogConfig | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollViewRef = useRef<ScrollView>(null)
  const initialStateRef = useRef<EditProfileInitialState | null>(null)

  useEffect(() => {
    void init()
  }, [])

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 500)
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
      .select('name, city, skill_label, self_assessed_level, auto_accept, favorite_court_ids, elo, current_elo, photo_url, placement_matches_played, bio')
      .eq('id', user.id)
      .single()

    setPlayerData(data)
    if (data) {
      setName(data.name ?? '')
      setCity(data.city ?? '')
      setPhotoUrl(data.photo_url ?? null)
      const rawElo = data.current_elo ?? data.elo ?? 0
      setPlacementMatchesPlayed(data.placement_matches_played ?? 0)
      setBio(data.bio ?? '')

      // DEBUG LOG
      console.log('PLAYER DATA FETCHED:', {
        id: data.id,
        name: data.name,
        skill_label: data.skill_label,
        self_assessed_level: data.self_assessed_level,
        elo: data.elo,
        current_elo: data.current_elo
      })

      // Fix skill level discrepancy: use same logic as profile screen
      const skill = getSkillLevelFromPlayer(data)
      console.log('RESOLVED SKILL:', skill?.id, skill?.title)
      
      const levelId = skill?.id ?? 'level_1'
      setSelectedLevelId(levelId)
      
      // If elo is 0, use the seed elo from the resolved skill level
      let displayElo = rawElo
      if (rawElo === 0 && skill) {
        displayElo = skill.id === 'level_1' ? 800 : (getEloBandByLevelId(skill.id)?.seedElo ?? 800)
      }
      setElo(displayElo)
      
      setAutoAccept(Boolean(data.auto_accept))

      const ids: string[] = data.favorite_court_ids ?? []
      setFavCourtIds(ids)

      if (ids.length > 0) {
        const { data: courtData } = await supabase.from('courts').select('id, name, address, city').in('id', ids)
        const loadedCourts = courtData ?? []
        setFavCourts(loadedCourts)
        initialStateRef.current = {
          name: data.name ?? '',
          city: data.city ?? '',
          autoAccept: Boolean(data.auto_accept),
          favoriteCourts: loadedCourts,
          favoriteCourtIds: ids,
          bio: data.bio ?? '',
        }
      } else {
        initialStateRef.current = {
          name: data.name ?? '',
          city: data.city ?? '',
          autoAccept: Boolean(data.auto_accept),
          favoriteCourts: [],
          favoriteCourtIds: ids,
          bio: data.bio ?? '',
        }
      }
    } else {
      // Fallback for new users without a record yet
      console.log('NO PLAYER DATA FOUND FOR ID:', user.id)
      setElo(800)
      setSelectedLevelId('level_1')
      initialStateRef.current = {
        name: '',
        city: '',
        autoAccept: false,
        favoriteCourts: [],
        favoriteCourtIds: [],
        bio: '',
      }
    }

    setLoading(false)
  }

  function addFavCourt(court: Court) {
    if (favCourtIds.includes(court.id)) return

    if (favCourtIds.length >= 5) {
      setDialogConfig({
        title: 'Tối đa 5 sân',
        message: 'Xóa bớt sân để thêm sân mới.',
        actions: [{ label: 'Đã hiểu' }],
      })
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
    }, 500)
  }

  function handleRedoAssessment() {
    setDialogConfig({
      title: 'Làm lại bài đánh giá?',
      message: 'Mức hiện tại sẽ được giữ nguyên cho tới khi bạn hoàn thành bài đánh giá mới. Sau đó hệ thống sẽ cập nhật mức khởi điểm phù hợp hơn.',
      actions: [
        { label: 'Để sau', tone: 'secondary' },
        { label: 'Bắt đầu', onPress: () => router.push('/onboarding' as any) },
      ],
    })
  }

  function sameIds(a: string[], b: string[]) {
    if (a.length !== b.length) return false
    return a.every((value, index) => value === b[index])
  }

  const hasUnsavedChanges = initialStateRef.current
    ? initialStateRef.current.name !== name ||
      initialStateRef.current.city !== city ||
      initialStateRef.current.autoAccept !== autoAccept ||
      initialStateRef.current.bio !== bio ||
      !sameIds(initialStateRef.current.favoriteCourtIds, favCourtIds)
    : false

  function cancelChanges() {
    const initial = initialStateRef.current
    if (!initial) return

    setName(initial.name)
    setCity(initial.city)
    setAutoAccept(initial.autoAccept)
    setBio(initial.bio)
    setFavCourtIds([...initial.favoriteCourtIds])
    setFavCourts([...initial.favoriteCourts])
    setKeyword('')
    setCourts([])
  }

  async function save() {
    if (!name.trim()) {
      setDialogConfig({
        title: 'Lỗi',
        message: 'Tên không được để trống',
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    if (!myId) return

    setSaving(true)

    const updates = {
      name: name.trim(),
      city,
      bio: bio.trim(),
      favorite_court_ids: favCourtIds,
      auto_accept: autoAccept,
    }

    const { error } = await supabase.from('players').upsert({
      id: myId,
      ...updates,
      // Ensure we don't overwrite skill fields if we're creating for the first time
      ...(playerData ? {} : {
        current_elo: 800,
        elo: 800,
        self_assessed_level: 'level_1',
        skill_label: 'beginner'
      })
    })

    setSaving(false)

    if (error) {
      setDialogConfig({
        title: 'Lỗi',
        message: error.message,
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    setDialogConfig({
      title: 'Đã lưu',
      message: 'Hồ sơ của bạn đã được cập nhật.',
      actions: [{ label: 'OK', onPress: () => router.back() }],
    })
  }

  const currentLevel = getSkillLevelById(selectedLevelId)
  const heroTitleSize = width < 360 ? 32 : 40
  const heroTitleLineHeight = width < 360 ? 44 : 54
  const avatarSize = 64

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: EDIT_PROFILE_COLORS.surfaceContainerLow }} edges={['top']}>
        <ActivityIndicator size="large" color={EDIT_PROFILE_COLORS.primary} />
      </SafeAreaView>
    )
  }

  return (
    <View className="flex-1" style={{ backgroundColor: EDIT_PROFILE_COLORS.background }}>
      <StatusBar style="dark" translucent backgroundColor={EDIT_PROFILE_COLORS.background} />

      <SecondaryNavbar
        title="HỒ SƠ"
        onBackPress={() => router.back()}
      />
      <ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingBottom: 325, paddingTop: 12 }} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">

        <View className="px-6 pb-6 pt-4">
          <View className="flex-row items-center justify-between">
            <View className="min-w-0 flex-1 pr-4">
              <Text
                className="mb-[3px] text-[11px]"
                style={{ color: EDIT_PROFILE_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.label, lineHeight: 15 }}
              >
                CÀI ĐẶT
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  color: EDIT_PROFILE_COLORS.onBackground,
                  fontFamily: SCREEN_FONTS.headlineBlack,
                  fontSize: heroTitleSize,
                  lineHeight: heroTitleLineHeight,
                  letterSpacing: -1,
                  textTransform: 'uppercase',
                }}
              >
                HỒ SƠ CỦA BẠN.
              </Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: RADIUS.full,
                  borderWidth: 2,
                  borderColor: EDIT_PROFILE_COLORS.outlineVariant,
                  backgroundColor: EDIT_PROFILE_COLORS.secondaryFixed,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {photoUrl ? (
                  <ImageBackground source={{ uri: photoUrl }} className="h-full w-full" resizeMode="cover" />
                ) : (
                  <Text style={{ color: EDIT_PROFILE_COLORS.primary, fontSize: 24, fontFamily: SCREEN_FONTS.cta }}>
                    {(name || 'U').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  marginTop: -12,
                  backgroundColor: EDIT_PROFILE_COLORS.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: RADIUS.full,
                  ...SHADOW.xs,
                }}
              >
                <Text
                  style={{
                    color: EDIT_PROFILE_COLORS.onPrimary,
                    fontSize: 9,
                    fontFamily: SCREEN_FONTS.label,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Sửa
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="px-6 gap-8">
          {/* Basic Info Section */}
          <View>
            <View className="mb-6 flex-row items-center gap-4">
              <Text className="text-[11px] uppercase tracking-[4px]" style={{ color: EDIT_PROFILE_COLORS.outline, fontFamily: SCREEN_FONTS.cta }}>
                01 / THÔNG TIN
              </Text>
              <View className="h-px flex-1" style={{ backgroundColor: EDIT_PROFILE_COLORS.outlineVariant }} />
            </View>
            
            <View className="gap-4">
              <AppInput label="Tên hiển thị" value={name} onChangeText={setName} placeholder="Nhập tên của bạn" maxLength={30} />
              
              <AppInput 
                label="Mô tả bản thân" 
                value={bio} 
                onChangeText={setBio} 
                placeholder="Ví dụ: Đam mê Pickleball với lối chơi năng lượng..." 
                multiline
                numberOfLines={3}
                maxLength={200}
              />

              <View>
                <Text
                  className="text-xs font-bold uppercase tracking-wider px-1 mb-2"
                  style={{ color: EDIT_PROFILE_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.cta }}
                >
                  Thành phố
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {CITIES.map((item) => {
                    const isActive = city.trim().toLowerCase() === item.toLowerCase()
                    return (
                      <TouchableOpacity
                        key={item}
                        activeOpacity={0.85}
                        className="rounded-full px-6 py-2"
                        style={{
                          backgroundColor: isActive ? EDIT_PROFILE_COLORS.primary : EDIT_PROFILE_COLORS.surfaceContainerHigh,
                        }}
                        onPress={() => setCity(item)}
                      >
                        <Text
                          className="text-sm font-bold"
                          style={{
                            color: isActive ? EDIT_PROFILE_COLORS.onPrimary : EDIT_PROFILE_COLORS.onSurface,
                            fontFamily: SCREEN_FONTS.cta,
                          }}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* Skill Level Section */}
          <View>
            <View className="mb-6 flex-row items-center gap-4">
              <Text className="text-[11px] uppercase tracking-[4px]" style={{ color: EDIT_PROFILE_COLORS.outline, fontFamily: SCREEN_FONTS.cta }}>
                02 / KỸ NĂNG
              </Text>
              <View className="h-px flex-1" style={{ backgroundColor: EDIT_PROFILE_COLORS.outlineVariant }} />
            </View>

            <ProfileSkillHero
              elo={elo}
              title={currentLevel?.title ?? 'Đang hiệu chỉnh'}
              subtitle={currentLevel?.subtitle ?? 'Mức khởi điểm hiện tại. Hệ thống sẽ tiếp tục tinh chỉnh sau vài trận.'}
              subtitleItalic
              description={currentLevel?.description ?? ''}
              contentRightInset={12}
              levelId={selectedLevelId}
              colors={PROFILE_SKILL_HERO_TONE}
            />

            {placementMatchesPlayed < 5 ? (
              <>
                <TouchableOpacity 
                  activeOpacity={0.85} 
                  className="rounded-full px-4 py-4 mb-4 flex-row items-center justify-center"
                  style={{ backgroundColor: EDIT_PROFILE_COLORS.error }}
                  onPress={handleRedoAssessment}
                >
                  <Text
                    className="text-center text-base font-extrabold"
                    style={{ color: EDIT_PROFILE_COLORS.onError, fontFamily: SCREEN_FONTS.cta }}
                  >
                    Làm lại bài đánh giá
                  </Text>
                </TouchableOpacity>
                <Text
                  className="text-center text-sm leading-6 mb-4"
                  style={{ color: EDIT_PROFILE_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body }}
                >
                  Dùng lại 7 câu hỏi onboarding để hệ thống ước lượng mức khởi điểm mới cho bạn.
                </Text>
              </>
            ) : (
              <View className="rounded-2xl p-4 border border-dashed" style={{ borderColor: EDIT_PROFILE_COLORS.outlineVariant }}>
                <Text
                  className="text-center text-sm leading-6"
                  style={{ color: EDIT_PROFILE_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body }}
                >
                  Bạn đã hoàn thành giai đoạn phân hạng. Trình độ của bạn giờ đây sẽ được cập nhật tự động dựa trên kết quả thi đấu thực tế.
                </Text>
              </View>
            )}
          </View>

          {/* Quick Match Section */}
          <View>
            <View className="mb-6 flex-row items-center gap-4">
              <Text className="text-[11px] uppercase tracking-[4px]" style={{ color: EDIT_PROFILE_COLORS.outline, fontFamily: SCREEN_FONTS.cta }}>
                03 / KẾT NỐI
              </Text>
              <View className="h-px flex-1" style={{ backgroundColor: EDIT_PROFILE_COLORS.outlineVariant }} />
            </View>
            
            <View className="flex-row items-center gap-3 rounded-2xl p-4" style={{ backgroundColor: EDIT_PROFILE_COLORS.secondaryContainer }}>
              <View className="flex-1">
                <Text className="text-sm font-extrabold" style={{ color: EDIT_PROFILE_COLORS.onSecondaryContainer, fontFamily: SCREEN_FONTS.cta }}>
                  Tự động ghép kèo nhanh
                </Text>
                <Text className="mt-2 text-sm leading-6" style={{ color: EDIT_PROFILE_COLORS.secondary, fontFamily: SCREEN_FONTS.body }}>
                  Khi bật, người chơi được hệ thống đánh giá là phù hợp sẽ vào kèo ngay.
                </Text>
              </View>
              <Switch
                value={autoAccept}
                onValueChange={setAutoAccept}
                trackColor={{ false: EDIT_PROFILE_COLORS.surfaceDim, true: EDIT_PROFILE_COLORS.primaryFixedDim }}
                thumbColor={autoAccept ? EDIT_PROFILE_COLORS.primary : EDIT_PROFILE_COLORS.surfaceContainerLowest}
              />
            </View>
          </View>

          {/* Favorite Courts Section */}
          <View>
            <View className="mb-6 flex-row items-center gap-4">
              <Text className="text-[11px] uppercase tracking-[4px]" style={{ color: EDIT_PROFILE_COLORS.outline, fontFamily: SCREEN_FONTS.cta }}>
                04 / SÂN ĐẤU
              </Text>
              <View className="h-px flex-1" style={{ backgroundColor: EDIT_PROFILE_COLORS.outlineVariant }} />
            </View>

            <View>
              {favCourts.length > 0 ? (
                <View className="mb-4 gap-3">
                  {favCourts.map((court) => (
                    <View
                      key={court.id}
                      className="flex-row items-center gap-4 p-4 rounded-[24px] border"
                      style={{ backgroundColor: EDIT_PROFILE_COLORS.surfaceContainerLowest, borderColor: EDIT_PROFILE_COLORS.outlineVariant }}
                    >
                      <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: EDIT_PROFILE_COLORS.secondaryContainer }}>
                        <MapPin size={20} color={EDIT_PROFILE_COLORS.surfaceTint} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold" style={{ color: EDIT_PROFILE_COLORS.onSurface, fontFamily: SCREEN_FONTS.cta }}>{court.name}</Text>
                        <Text className="text-sm mt-1" style={{ color: EDIT_PROFILE_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body }}>{court.address} · {court.city}</Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        className="w-10 h-10 items-center justify-center"
                        onPress={() => removeFavCourt(court.id)}
                      >
                        <Text className="text-xl font-black" style={{ color: EDIT_PROFILE_COLORS.outline, fontFamily: SCREEN_FONTS.cta }}>×</Text>
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

                  {searching ? <ActivityIndicator color={EDIT_PROFILE_COLORS.primary} style={{ marginTop: 12 }} /> : null}

                  {!searching && keyword.length > 0 && courts.length === 0 ? (
                    <Text className="mt-3 text-sm" style={{ color: EDIT_PROFILE_COLORS.outline, fontFamily: SCREEN_FONTS.body }}>Không tìm thấy sân nào</Text>
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
                          className="mb-3 flex-row items-center gap-4 p-4 rounded-[24px] border"
                          style={{
                            borderColor: EDIT_PROFILE_COLORS.outlineVariant,
                            backgroundColor: alreadyAdded ? EDIT_PROFILE_COLORS.surfaceContainerHigh : EDIT_PROFILE_COLORS.surfaceContainerLowest,
                            opacity: alreadyAdded ? 0.6 : 1,
                          }}
                          onPress={() => addFavCourt(item)}
                          disabled={alreadyAdded}
                        >
                          <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: EDIT_PROFILE_COLORS.secondaryContainer }}>
                            <MapPin size={20} color={EDIT_PROFILE_COLORS.surfaceTint} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-bold" style={{ color: EDIT_PROFILE_COLORS.onSurface, fontFamily: SCREEN_FONTS.cta }}>{item.name}</Text>
                            <Text className="text-xs mt-1" style={{ color: EDIT_PROFILE_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body }}>{item.address} · {item.city}</Text>
                          </View>
                          <StatusBadge label={alreadyAdded ? 'Đã thêm' : 'Thêm'} tone={alreadyAdded ? 'neutral' : 'success'} />
                        </TouchableOpacity>
                      )
                    }}
                  />
                </>
              ) : (
                <View className="mt-4 rounded-2xl px-4 py-3" style={{ backgroundColor: EDIT_PROFILE_COLORS.errorContainer }}>
                  <Text className="text-sm leading-6" style={{ color: EDIT_PROFILE_COLORS.onErrorContainer, fontFamily: SCREEN_FONTS.body }}>
                    Bạn đã chọn đủ 5 sân. Xóa bớt một sân nếu muốn thêm sân mới.
                  </Text>
                </View>
              )}

              {favCourts.length === 0 && favCourtIds.length === 0 ? (
                <EmptyState
                  icon={<MapPin size={28} color={EDIT_PROFILE_COLORS.outline} />}
                  title="Chưa có sân ưa thích"
                  description="Thêm vài sân bạn hay chơi để app gợi ý kèo sát nhu cầu hơn."
                />
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View
        className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t"
        style={{ backgroundColor: EDIT_PROFILE_COLORS.inverseOnSurface, borderColor: EDIT_PROFILE_COLORS.outlineVariant }}
      >
        <View className="flex-row gap-3">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={cancelChanges}
            disabled={saving || !hasUnsavedChanges}
            className="flex-1 rounded-full overflow-hidden flex-row items-center justify-center py-4"
            style={{
              backgroundColor: EDIT_PROFILE_COLORS.surfaceContainerLow,
              borderWidth: BORDER.base,
              borderColor: EDIT_PROFILE_COLORS.outlineVariant,
              opacity: saving || !hasUnsavedChanges ? 0.55 : 1,
            }}
          >
            <Text
              className="text-[13px] tracking-[0.5px] uppercase"
              style={{ color: EDIT_PROFILE_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.cta }}
            >
              Hủy thay đổi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={save}
            disabled={saving}
            className="flex-1 rounded-full overflow-hidden flex-row items-center justify-center py-4"
            style={{ backgroundColor: EDIT_PROFILE_COLORS.surfaceTint }}
          >
            {saving ? (
              <>
                <ActivityIndicator color={EDIT_PROFILE_COLORS.onPrimary} />
                <Text
                  className="ml-2 text-[13px] tracking-[0.5px] uppercase"
                  style={{ color: EDIT_PROFILE_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta }}
                >
                  Đang xử lý...
                </Text>
              </>
            ) : (
              <Text
                className="text-[13px] tracking-[0.5px] uppercase"
                style={{ color: EDIT_PROFILE_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta }}
              >
                Lưu thay đổi
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <AppDialog
        visible={Boolean(dialogConfig)}
        config={dialogConfig}
        onClose={() => setDialogConfig(null)}
      />
    </View>
  )
}


