import { reactive, watch, onMounted, computed } from 'vue'

type Child = { id?: number; name: string; emoji: string }
type DayRow = { child0: number; child1: number }
type Tier = { id?: number; threshold: number; reward: string; unlocked?: boolean }

interface State {
  children: Child[]
  config: {
    dailyBaseLives: number
    dailyMaxLives: number
    monthlyTiers: Tier[]
  }
  week: {
    grid: DayRow[]
  }
  month: {
    shared: number
  }
}

interface Settings {
  scale: number
  weekendBonus: number
}

export const useChildLifeState = () => {
  const state = reactive<State>({
    children: [
      { name: 'Renard', emoji: '🦊' },
      { name: 'Panda', emoji: '🐼' }
    ],
    config: {
      dailyBaseLives: 0,
      dailyMaxLives: 2,
      monthlyTiers: []
    },
    week: {
      grid: Array.from({ length: 7 }, () => ({ child0: 0, child1: 0 }))
    },
    month: { shared: 0 }
  })

  const settings = reactive<Settings>({
    scale: 1.0,
    weekendBonus: 0
  })

  const isLoading = ref(true)
  let saveTimeout: NodeJS.Timeout | null = null

  // Load state from API
  async function load() {
    isLoading.value = true
    try {
      const response = await $fetch('/api/state')
      if (response) {
        if (response.children?.length) state.children = response.children
        if (response.config) Object.assign(state.config, response.config)
        if (response.week) Object.assign(state.week, response.week)
        if (response.month) Object.assign(state.month, response.month)
        if (response.settings) Object.assign(settings, response.settings)
      }
    } catch (e) {
      console.error('Failed to load state:', e)
    }
    isLoading.value = false
  }

  // Save state to API (debounced)
  async function save() {
    if (isLoading.value) return

    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(async () => {
      try {
        await $fetch('/api/state', {
          method: 'POST',
          body: { ...state, settings }
        })
      } catch (e) {
        console.error('Failed to save:', e)
      }
    }, 500)
  }

  // Computed values
  const sortedTiers = computed(() =>
    [...state.config.monthlyTiers].sort((a, b) => a.threshold - b.threshold)
  )

  const nextTier = computed(() =>
    sortedTiers.value.find(t => t.threshold > state.month.shared)
  )

  const nextTierThreshold = computed(() => nextTier.value?.threshold ?? 0)

  const weekShared = computed(() =>
    state.week.grid.reduce((s, d) => s + (d.child0 || 0) + (d.child1 || 0), 0)
  )

  // Actions
  function clampWeekCell(v: number) {
    return Math.max(0, Math.min(v || 0, state.config.dailyMaxLives))
  }

  async function closeWeek() {
    const before = state.month.shared
    const weekly = weekShared.value

    try {
      const response = await $fetch('/api/week/close', {
        method: 'POST',
        body: { weeklyTotal: weekly, scale: settings.scale, weekendBonus: settings.weekendBonus }
      })
      if (response.success) {
        state.month.shared = response.newTotal
        resetWeek()
      }
    } catch (e) {
      console.error('Failed to close week:', e)
    }

    const after = state.month.shared
    const crossed = sortedTiers.value.find(t => before < t.threshold && after >= t.threshold)
    return crossed
  }

  function resetWeek() {
    state.week.grid = Array.from({ length: 7 }, () => ({ child0: 0, child1: 0 }))
  }

  async function resetMonth() {
    try {
      await $fetch('/api/reset', { method: 'POST', body: { type: 'month' } })
      state.month.shared = 0
    } catch (e) {
      console.error('Failed to reset month:', e)
    }
  }

  async function hardReset() {
    try {
      await $fetch('/api/reset', { method: 'POST', body: { type: 'all' } })
      state.month.shared = 0
      resetWeek()
    } catch (e) {
      console.error('Failed to hard reset:', e)
    }
  }

  // Auto-save on changes
  watch(state, save, { deep: true })
  watch(settings, save, { deep: true })

  // Load on mount
  onMounted(load)

  return {
    state,
    settings,
    isLoading,
    sortedTiers,
    nextTier,
    nextTierThreshold,
    weekShared,
    clampWeekCell,
    closeWeek,
    resetWeek,
    resetMonth,
    hardReset,
    load
  }
}
