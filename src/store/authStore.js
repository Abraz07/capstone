import { create } from 'zustand'
import * as authService from '../services/auth'

// Simple persist helper
const persist = (config, options) => {
  return (set, get, api) => {
    const store = config(
      (...args) => {
        set(...args)
        if (options?.name) {
          const state = options.partialize 
            ? options.partialize(get()) 
            : get()
          localStorage.setItem(options.name, JSON.stringify(state))
        }
      },
      get,
      api
    )
    
    // Load initial state
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

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const response = await authService.login(email, password)
          set({
            user: response.user,
            token: response.token,
            loading: false,
            error: null,
          })
          return { success: true }
        } catch (error) {
          set({ loading: false, error: error.message })
          return { success: false, error: error.message }
        }
      },

      register: async (email, password, name) => {
        set({ loading: true, error: null })
        try {
          const response = await authService.register(email, password, name)
          set({
            user: response.user,
            token: response.token,
            loading: false,
            error: null,
          })
          return { success: true }
        } catch (error) {
          set({ loading: false, error: error.message })
          return { success: false, error: error.message }
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null })
        authService.logout()
      },

      forgotPassword: async (email) => {
        set({ loading: true, error: null })
        try {
          await authService.forgotPassword(email)
          set({ loading: false, error: null })
          return { success: true }
        } catch (error) {
          set({ loading: false, error: error.message })
          return { success: false, error: error.message }
        }
      },

      updateProfile: async (data) => {
        set({ loading: true, error: null })
        try {
          const response = await authService.updateProfile(data)
          set({
            user: { ...get().user, ...response.user },
            loading: false,
            error: null,
          })
          return { success: true }
        } catch (error) {
          set({ loading: false, error: error.message })
          return { success: false, error: error.message }
        }
      },
    }),
    {
      name: 'focuswave-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

