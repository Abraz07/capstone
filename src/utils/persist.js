// Simple persist middleware for Zustand
export const persist = (config, options) => {
  return (set, get, api) => {
    const store = config(
      (...args) => {
        set(...args)
        if (options?.name && typeof window !== 'undefined') {
          const state = options.partialize ? options.partialize(get()) : get()
          try {
            localStorage.setItem(options.name, JSON.stringify(state))
          } catch (e) {
            console.error('Failed to persist state:', e)
          }
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

