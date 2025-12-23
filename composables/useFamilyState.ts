import { reactive, ref, watch, onMounted, computed } from 'vue'

type Child = { id: number; name: string; emoji: string; position: number }
type WeekGridEntry = { dayIndex: number; childId: number; lives: number }
type Tier = { id: number; threshold: number; reward: string; unlocked: boolean }
type Config = {
  id?: number
  dailyBaseLives: number
  dailyMaxLives: number
  scale: number
  weekendBonus: number
}
type WeekInfo = {
  weekStart: string
  weekLabel: string
  prevWeek: string
  nextWeek: string
  isCurrentWeek: boolean
  canGoNext: boolean
}

interface FamilyState {
  id: number
  name: string
  code: string
  children: Child[]
  weekGrids: WeekGridEntry[]
  monthProgress: { shared: number }
  rewardTiers: Tier[]
  config: Config
  weekInfo: WeekInfo
}

export const useFamilyState = (familyCode: string) => {
  const state = reactive<FamilyState>({
    id: 0,
    name: '',
    code: familyCode,
    children: [],
    weekGrids: [],
    monthProgress: { shared: 0 },
    rewardTiers: [],
    config: {
      dailyBaseLives: 0,
      dailyMaxLives: 2,
      scale: 1.0,
      weekendBonus: 0
    },
    weekInfo: {
      weekStart: '',
      weekLabel: '',
      prevWeek: '',
      nextWeek: '',
      isCurrentWeek: true,
      canGoNext: false
    }
  })

  const isLoading = ref(true)
  const error = ref<string | null>(null)
  const currentWeek = ref<string | null>(null)
  let saveTimeout: ReturnType<typeof setTimeout> | null = null

  // Load family state from API
  async function load(weekParam?: string) {
    isLoading.value = true
    error.value = null
    try {
      const url = weekParam
        ? `/api/family/${familyCode}?week=${weekParam}`
        : `/api/family/${familyCode}`
      const response = await $fetch<FamilyState & { weekInfo: WeekInfo }>(url)
      if (response) {
        state.id = response.id
        state.name = response.name
        state.code = response.code
        state.children = response.children || []
        state.weekGrids = response.weekGrids || []
        state.monthProgress = response.monthProgress || { shared: 0 }
        state.rewardTiers = response.rewardTiers || []
        if (response.config) {
          state.config = response.config
        }
        if (response.weekInfo) {
          state.weekInfo = response.weekInfo
          currentWeek.value = response.weekInfo.weekStart
        }
      }
    } catch (e: any) {
      console.error('Failed to load family:', e)
      error.value = e.data?.message || 'Erreur de chargement'
    }
    isLoading.value = false
  }

  // Navigation entre semaines
  async function goToPrevWeek() {
    if (state.weekInfo.prevWeek) {
      await load(state.weekInfo.prevWeek)
    }
  }

  async function goToNextWeek() {
    if (state.weekInfo.canGoNext && state.weekInfo.nextWeek) {
      await load(state.weekInfo.nextWeek)
    }
  }

  async function goToCurrentWeek() {
    await load()
  }

  // Save state to API (debounced)
  async function save() {
    if (isLoading.value) return
    // Ne sauvegarder que si on est sur la semaine courante
    if (!state.weekInfo.isCurrentWeek) return

    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(async () => {
      try {
        await $fetch(`/api/family/${familyCode}`, {
          method: 'POST',
          body: {
            weekGrids: state.weekGrids,
            children: state.children,
            config: state.config,
            rewardTiers: state.rewardTiers
          }
        })
      } catch (e) {
        console.error('Failed to save:', e)
      }
    }, 500)
  }

  // Computed: week grid as a matrix [dayIndex][childId] = lives
  const weekGrid = computed(() => {
    const grid: Record<number, Record<number, number>> = {}
    for (let d = 0; d < 7; d++) {
      grid[d] = {}
      for (const child of state.children) {
        const entry = state.weekGrids.find(w => w.dayIndex === d && w.childId === child.id)
        grid[d][child.id] = entry?.lives || 0
      }
    }
    return grid
  })

  // Computed values
  const sortedTiers = computed(() =>
    [...state.rewardTiers].sort((a, b) => a.threshold - b.threshold)
  )

  const nextTier = computed(() =>
    sortedTiers.value.find(t => t.threshold > state.monthProgress.shared)
  )

  const nextTierThreshold = computed(() => nextTier.value?.threshold ?? 0)

  const weekTotal = computed(() =>
    state.weekGrids.reduce((sum, entry) => sum + (entry.lives || 0), 0)
  )

  // Actions
  function setLives(dayIndex: number, childId: number, lives: number) {
    // Ne modifier que si on est sur la semaine courante
    if (!state.weekInfo.isCurrentWeek) return

    const clamped = Math.max(0, Math.min(lives || 0, state.config.dailyMaxLives))
    const existing = state.weekGrids.find(w => w.dayIndex === dayIndex && w.childId === childId)
    if (existing) {
      existing.lives = clamped
    } else {
      state.weekGrids.push({ dayIndex, childId, lives: clamped })
    }
  }

  function getLives(dayIndex: number, childId: number): number {
    const entry = state.weekGrids.find(w => w.dayIndex === dayIndex && w.childId === childId)
    return entry?.lives || 0
  }

  async function closeWeek() {
    const before = state.monthProgress.shared
    try {
      const response = await $fetch<{ weekTotal: number; monthTotal: number }>(`/api/family/${familyCode}/week/close`, {
        method: 'POST'
      })
      if (response) {
        state.monthProgress.shared = response.monthTotal
        state.weekGrids = []
      }
    } catch (e) {
      console.error('Failed to close week:', e)
    }
    const after = state.monthProgress.shared
    return sortedTiers.value.find(t => before < t.threshold && after >= t.threshold)
  }

  function resetWeek() {
    if (!state.weekInfo.isCurrentWeek) return
    state.weekGrids = []
    save()
  }

  async function updateChild(child: Child) {
    try {
      await $fetch(`/api/family/${familyCode}`, {
        method: 'POST',
        body: { children: [child] }
      })
    } catch (e) {
      console.error('Failed to update child:', e)
    }
  }

  async function addChild(name: string, emoji: string) {
    try {
      const newChild = await $fetch<Child>(`/api/family/${familyCode}/children/add`, {
        method: 'POST',
        body: { name, emoji }
      })
      state.children.push(newChild)
    } catch (e) {
      console.error('Failed to add child:', e)
    }
  }

  async function removeChild(childId: number) {
    try {
      await $fetch(`/api/family/${familyCode}/children/${childId}`, {
        method: 'DELETE'
      })
      const idx = state.children.findIndex(c => c.id === childId)
      if (idx !== -1) state.children.splice(idx, 1)
    } catch (e) {
      console.error('Failed to remove child:', e)
    }
  }

  async function updateTier(tier: Tier) {
    try {
      await $fetch(`/api/family/${familyCode}`, {
        method: 'POST',
        body: { rewardTiers: [tier] }
      })
    } catch (e) {
      console.error('Failed to update tier:', e)
    }
  }

  async function addTier(threshold: number, reward: string) {
    try {
      const newTier = await $fetch<Tier>(`/api/family/${familyCode}/tiers/add`, {
        method: 'POST',
        body: { threshold, reward }
      })
      state.rewardTiers.push(newTier)
    } catch (e) {
      console.error('Failed to add tier:', e)
    }
  }

  async function removeTier(tierId: number) {
    try {
      await $fetch(`/api/family/${familyCode}/tiers/${tierId}`, {
        method: 'DELETE'
      })
      const idx = state.rewardTiers.findIndex(t => t.id === tierId)
      if (idx !== -1) state.rewardTiers.splice(idx, 1)
    } catch (e) {
      console.error('Failed to remove tier:', e)
    }
  }

  // Auto-save on changes (seulement si semaine courante)
  watch(() => state.weekGrids, save, { deep: true })
  watch(() => state.config, save, { deep: true })

  // Load on mount
  onMounted(load)

  return {
    state,
    isLoading,
    error,
    weekGrid,
    sortedTiers,
    nextTier,
    nextTierThreshold,
    weekTotal,
    setLives,
    getLives,
    closeWeek,
    resetWeek,
    updateChild,
    addChild,
    removeChild,
    updateTier,
    addTier,
    removeTier,
    load,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek
  }
}
