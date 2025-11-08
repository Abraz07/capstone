import { create } from 'zustand'
import * as moodService from '../services/mood'

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

export const useMoodStore = create(
  persist(
    (set, get) => ({
      moodLogs: [],
      loading: false,
      error: null,

      fetchMoodLogs: async () => {
        set({ loading: true, error: null })
        try {
          const logs = await moodService.getMoodLogs()
          set({ moodLogs: logs, loading: false, error: null })
        } catch (error) {
          set({ loading: false, error: error.message })
        }
      },

      addMoodLog: async (mood, note = '') => {
        set({ loading: true, error: null })
        try {
          const log = await moodService.createMoodLog({ mood, note })
          set((state) => ({
            moodLogs: [log, ...state.moodLogs],
            loading: false,
            error: null,
          }))
          return { success: true, log }
        } catch (error) {
          set({ loading: false, error: error.message })
          return { success: false, error: error.message }
        }
      },

      updateMoodLog: async (id, updates) => {
        set({ loading: true, error: null })
        try {
          const updatedLog = await moodService.updateMoodLog(id, updates)
          set((state) => ({
            moodLogs: state.moodLogs.map((log) =>
              log.id === id ? updatedLog : log
            ),
            loading: false,
            error: null,
          }))
          return { success: true, log: updatedLog }
        } catch (error) {
          set({ loading: false, error: error.message })
          return { success: false, error: error.message }
        }
      },

      deleteMoodLog: async (id) => {
        set({ loading: true, error: null })
        try {
          await moodService.deleteMoodLog(id)
          set((state) => ({
            moodLogs: state.moodLogs.filter((log) => log.id !== id),
            loading: false,
            error: null,
          }))
          return { success: true }
        } catch (error) {
          set({ loading: false, error: error.message })
          return { success: false, error: error.message }
        }
      },
    }),
    {
      name: 'focuswave-mood',
    }
  )
)

