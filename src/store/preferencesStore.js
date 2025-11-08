import { create } from 'zustand'

// Simple persist helper
const persist = (config, options) => {
  return (set, get, api) => {
    const store = config(
      (...args) => {
        set(...args)
        if (options?.name && typeof window !== 'undefined') {
          const state = options.partialize ? options.partialize(get()) : get()
          localStorage.setItem(options.name, JSON.stringify(state))
        }
      },
      get,
      api
    )
    
    if (options?.name && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(options.name)
        if (stored) {
          const parsed = JSON.parse(stored)
          set(parsed)
        }
      } catch (e) {
        console.error('Failed to load persisted state:', e)
      }
    }
    
    return store
  }
}

export const usePreferencesStore = create(
  persist(
    (set, get) => ({
      darkMode: false,
      reducedMotion: false,
      largeText: false,
      highContrast: false,
      distractions: [],
      notifications: true,
      soundEnabled: true,

      toggleDarkMode: () => {
        const newDarkMode = !get().darkMode
        set({ darkMode: newDarkMode })
        document.documentElement.classList.toggle('dark', newDarkMode)
        document.body.classList.toggle('dark', newDarkMode)
      },

      setReducedMotion: (value) => {
        set({ reducedMotion: value })
        if (value) {
          document.documentElement.style.setProperty('--motion-reduce', 'reduce')
        } else {
          document.documentElement.style.removeProperty('--motion-reduce')
        }
      },

      setLargeText: (value) => {
        set({ largeText: value })
        document.documentElement.classList.toggle('large-text', value)
      },

      setHighContrast: (value) => {
        set({ highContrast: value })
        document.documentElement.classList.toggle('high-contrast', value)
      },

      addDistraction: (distraction) => {
        set((state) => ({
          distractions: [...state.distractions, distraction],
        }))
      },

      removeDistraction: (id) => {
        set((state) => ({
          distractions: state.distractions.filter((d) => d.id !== id),
        }))
      },

      updateDistraction: (id, updates) => {
        set((state) => ({
          distractions: state.distractions.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }))
      },

      setNotifications: (value) => {
        set({ notifications: value })
      },

      setSoundEnabled: (value) => {
        set({ soundEnabled: value })
      },

      initialize: () => {
        // Initialize dark mode
        const { darkMode } = get()
        document.documentElement.classList.toggle('dark', darkMode)
        document.body.classList.toggle('dark', darkMode)

        // Initialize reduced motion
        const { reducedMotion } = get()
        if (reducedMotion) {
          document.documentElement.style.setProperty('--motion-reduce', 'reduce')
        }

        // Initialize large text
        const { largeText } = get()
        document.documentElement.classList.toggle('large-text', largeText)

        // Initialize high contrast
        const { highContrast } = get()
        document.documentElement.classList.toggle('high-contrast', highContrast)
      },
    }),
    {
      name: 'focuswave-preferences',
    }
  )
)

