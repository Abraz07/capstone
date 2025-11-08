import { create } from 'zustand'
import * as timerService from '../services/timer'

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

const DEFAULT_WORK_DURATION = 25 * 60 // 25 minutes
const DEFAULT_BREAK_DURATION = 5 * 60 // 5 minutes
const DEFAULT_LONG_BREAK_DURATION = 15 * 60 // 15 minutes

export const useTimerStore = create(
  persist(
    (set, get) => ({
      // Timer state
      isRunning: false,
      isPaused: false,
      currentSession: 'work', // work, shortBreak, longBreak
      timeRemaining: DEFAULT_WORK_DURATION,
      workDuration: DEFAULT_WORK_DURATION,
      breakDuration: DEFAULT_BREAK_DURATION,
      longBreakDuration: DEFAULT_LONG_BREAK_DURATION,
      sessionsCompleted: 0,
      totalFocusTime: 0, // in seconds

      // Session history
      sessionHistory: [],

      // Timer interval reference
      intervalId: null,

      startTimer: () => {
        if (get().isRunning) return

        // Clear any existing interval
        const existingInterval = get().intervalId
        if (existingInterval) {
          clearInterval(existingInterval)
        }

        const intervalId = setInterval(() => {
          const state = get()
          if (state.timeRemaining <= 0) {
            clearInterval(intervalId)
            get().completeSession()
            return
          }
          set({ timeRemaining: state.timeRemaining - 1 })
        }, 1000)

        set({ isRunning: true, isPaused: false, intervalId })
      },

      pauseTimer: () => {
        const { intervalId } = get()
        if (intervalId) {
          clearInterval(intervalId)
        }
        set({ isRunning: false, isPaused: true, intervalId: null })
      },

      resumeTimer: () => {
        get().startTimer()
      },

      resetTimer: () => {
        const { intervalId } = get()
        if (intervalId) {
          clearInterval(intervalId)
        }

        const { currentSession, workDuration, breakDuration, longBreakDuration } = get()
        const duration =
          currentSession === 'work'
            ? workDuration
            : currentSession === 'longBreak'
            ? longBreakDuration
            : breakDuration

        set({
          isRunning: false,
          isPaused: false,
          timeRemaining: duration,
          intervalId: null,
        })
      },

      completeSession: async () => {
        const { intervalId, currentSession, sessionsCompleted, workDuration, totalFocusTime } = get()
        
        if (intervalId) {
          clearInterval(intervalId)
        }

        // Calculate actual duration (workDuration - timeRemaining = time spent)
        const actualDuration = currentSession === 'work' 
          ? workDuration - get().timeRemaining 
          : 0

        const sessionData = {
          type: currentSession,
          session_type: currentSession === 'work' ? 'work' : currentSession === 'longBreak' ? 'break' : 'break',
          duration: actualDuration, // Duration in seconds
          completedAt: new Date().toISOString(),
        }

        // Save to backend FIRST (before updating state)
        try {
          console.log('💾 Saving timer session to backend...', sessionData)
          await timerService.saveSession(sessionData)
          console.log('✅ Timer session saved to backend')
        } catch (error) {
          console.error('❌ Failed to save timer session to backend:', error)
          // Continue anyway - don't block the UI
        }

        // Save session to history
        const sessionHistory = [...get().sessionHistory, sessionData]
        
        // Update focus time if work session
        const newFocusTime = currentSession === 'work' 
          ? totalFocusTime + actualDuration 
          : totalFocusTime

        // Determine next session
        const nextSession = 
          currentSession === 'work'
            ? sessionsCompleted % 3 === 2
              ? 'longBreak'
              : 'shortBreak'
            : 'work'

        const nextSessionsCompleted = currentSession === 'work' 
          ? sessionsCompleted + 1 
          : sessionsCompleted

        const nextDuration =
          nextSession === 'work'
            ? workDuration
            : nextSession === 'longBreak'
            ? get().longBreakDuration
            : get().breakDuration

        set({
          isRunning: false,
          isPaused: false,
          currentSession: nextSession,
          timeRemaining: nextDuration,
          sessionsCompleted: nextSessionsCompleted,
          sessionHistory,
          totalFocusTime: newFocusTime,
          intervalId: null,
        })

        // Award points for completed work session
        if (currentSession === 'work') {
          // Dynamically import to avoid circular dependency
          import('./gamificationStore').then(({ useGamificationStore }) => {
            const { awardFocusPoints } = useGamificationStore.getState()
            awardFocusPoints(workDuration / 60) // 1 point per minute
          })
        }
      },

      setWorkDuration: (minutes) => {
        const seconds = minutes * 60
        set({ workDuration: seconds })
        if (!get().isRunning && get().currentSession === 'work') {
          set({ timeRemaining: seconds })
        }
      },

      setBreakDuration: (minutes) => {
        const seconds = minutes * 60
        set({ breakDuration: seconds })
      },

      setLongBreakDuration: (minutes) => {
        const seconds = minutes * 60
        set({ longBreakDuration: seconds })
      },

      setSession: (session) => {
        if (get().isRunning) return

        const { workDuration, breakDuration, longBreakDuration } = get()
        const duration =
          session === 'work'
            ? workDuration
            : session === 'longBreak'
            ? longBreakDuration
            : breakDuration

        set({ currentSession: session, timeRemaining: duration })
      },

      fetchSessionHistory: async () => {
        try {
          const history = await timerService.getSessionHistory()
          set({ sessionHistory: history })
        } catch (error) {
          console.error('Failed to fetch session history:', error)
        }
      },

      // Fetch ML recommendations and update timer durations
      fetchMLRecommendations: async (taskPriority = 'medium') => {
        try {
          console.log('🤖 Fetching ML Pomodoro recommendations...')
          const recommendation = await timerService.getPomodoroRecommendation(taskPriority)
          
          if (recommendation && recommendation.focus_minutes) {
            const focusSeconds = recommendation.focus_minutes * 60
            const breakSeconds = recommendation.break_minutes * 60
            
            // Update durations
            set({
              workDuration: focusSeconds,
              breakDuration: breakSeconds,
            })
            
            // Update current time remaining if not running and on work session
            const { isRunning, currentSession } = get()
            if (!isRunning && currentSession === 'work') {
              set({ timeRemaining: focusSeconds })
            }
            
            console.log('✅ ML recommendations applied:', {
              focus: recommendation.focus_minutes,
              break: recommendation.break_minutes,
              explanation: recommendation.explanation
            })
            
            return recommendation
          }
        } catch (error) {
          console.error('❌ Failed to fetch ML recommendations:', error)
        }
        return null
      },
    }),
    {
      name: 'focuswave-timer',
      partialize: (state) => ({
        workDuration: state.workDuration,
        breakDuration: state.breakDuration,
        longBreakDuration: state.longBreakDuration,
        sessionHistory: state.sessionHistory,
        totalFocusTime: state.totalFocusTime,
        sessionsCompleted: state.sessionsCompleted,
      }),
    }
  )
)

