import { create } from 'zustand'
import * as taskService from '../services/tasks'

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

export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      loading: false,
      error: null,
      filters: {
        tag: 'all',
        priority: 'all',
        status: 'all',
      },

      fetchTasks: async () => {
        set({ loading: true, error: null })
        try {
          const tasks = await taskService.getTasks()
          set({ tasks, loading: false, error: null })
        } catch (error) {
          set({ loading: false, error: error.message })
        }
      },

      addTask: async (task) => {
        set({ loading: true, error: null })
        try {
          const newTask = await taskService.createTask(task)
          set((state) => ({
            tasks: [...state.tasks, newTask],
            loading: false,
            error: null,
          }))
          return { success: true, task: newTask }
        } catch (error) {
          set({ loading: false, error: error.message })
          return { success: false, error: error.message }
        }
      },

      updateTask: async (id, updates) => {
        set({ loading: true, error: null })
        try {
          const updatedTask = await taskService.updateTask(id, updates)
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === id ? updatedTask : task
            ),
            loading: false,
            error: null,
          }))
          return { success: true, task: updatedTask }
        } catch (error) {
          set({ loading: false, error: error.message })
          return { success: false, error: error.message }
        }
      },

      deleteTask: async (id) => {
        set({ loading: true, error: null })
        try {
          await taskService.deleteTask(id)
          set((state) => ({
            tasks: state.tasks.filter((task) => task.id !== id),
            loading: false,
            error: null,
          }))
          return { success: true }
        } catch (error) {
          set({ loading: false, error: error.message })
          return { success: false, error: error.message }
        }
      },

      toggleTaskStatus: async (id) => {
        const task = get().tasks.find((t) => t.id === id)
        if (!task) return { success: false }

        const newStatus = task.status === 'completed' ? 'pending' : 'completed'
        const result = await get().updateTask(id, { status: newStatus })
        
        // Award points when task is completed
        if (newStatus === 'completed' && result.success) {
          import('./gamificationStore').then(({ useGamificationStore }) => {
            const { awardTaskPoints } = useGamificationStore.getState()
            awardTaskPoints()
          })
        }
        
        return result
      },

      reorderTasks: (newOrder) => {
        set({ tasks: newOrder })
        // In a real app, you'd sync this with the backend
        taskService.reorderTasks(newOrder.map((t) => t.id))
      },

      setFilters: (filters) => {
        set({ filters: { ...get().filters, ...filters } })
      },

      getFilteredTasks: () => {
        const { tasks, filters } = get()
        return tasks.filter((task) => {
          if (filters.tag !== 'all' && task.tag !== filters.tag) return false
          if (filters.priority !== 'all' && task.priority !== filters.priority)
            return false
          if (filters.status !== 'all' && task.status !== filters.status)
            return false
          return true
        })
      },
    }),
    {
      name: 'focuswave-tasks',
    }
  )
)

