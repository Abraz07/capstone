import { create } from 'zustand'
import * as gamificationService from '../services/gamification'

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

const POINTS_PER_MINUTE = 1
const POINTS_PER_TASK = 10
const POINTS_PER_STREAK_DAY = 5

export const useGamificationStore = create(
  persist(
    (set, get) => ({
      level: 1,
      points: 0,
      totalPoints: 0,
      streak: 0,
      lastActivityDate: null,
      badges: [
        {
          id: 'first_task',
          name: 'First Task',
          description: 'Complete your first task',
          icon: '🎯',
          rarity: 'common',
        },
        {
          id: 'focus_master',
          name: 'Focus Master',
          description: 'Accumulate 1000 focus points',
          icon: '🎯',
          rarity: 'rare',
        },
        {
          id: 'week_warrior',
          name: 'Week Warrior',
          description: 'Maintain a 7-day streak',
          icon: '🔥',
          rarity: 'epic',
        },
        {
          id: 'month_legend',
          name: 'Month Legend',
          description: 'Maintain a 30-day streak',
          icon: '👑',
          rarity: 'legendary',
        },
        {
          id: 'point_king',
          name: 'Point King',
          description: 'Reach 10,000 total points',
          icon: '💎',
          rarity: 'legendary',
        },
      ],
      unlockedBadges: [],

      initialize: async () => {
        try {
          const data = await gamificationService.getProfile()
          set({
            level: data.level || 1,
            points: data.points || 0,
            totalPoints: data.totalPoints || 0,
            streak: data.streak || 0,
            lastActivityDate: data.lastActivityDate,
            badges: data.badges || [],
            unlockedBadges: data.unlockedBadges || [],
          })
          get().updateStreak()
        } catch (error) {
          console.error('Failed to initialize gamification:', error)
        }
      },

      awardPoints: (amount) => {
        const { points, totalPoints, level } = get()
        const newPoints = points + amount
        const newTotalPoints = totalPoints + amount
        const pointsNeeded = level * 1000
        const newLevel = newTotalPoints >= pointsNeeded ? level + 1 : level

        set({
          points: newPoints,
          totalPoints: newTotalPoints,
          level: newLevel,
        })

        // Check for badge unlocks
        get().checkBadgeUnlocks()

        // Update streak
        get().updateStreak()

        // Save to backend
        gamificationService.updateProfile({
          points: newPoints,
          totalPoints: newTotalPoints,
          level: newLevel,
        })
      },

      awardTaskPoints: () => {
        get().awardPoints(POINTS_PER_TASK)
      },

      awardFocusPoints: (minutes) => {
        get().awardPoints(minutes * POINTS_PER_MINUTE)
      },

      updateStreak: () => {
        const { lastActivityDate, streak } = get()
        const today = new Date().toDateString()
        const lastDate = lastActivityDate ? new Date(lastActivityDate).toDateString() : null

        if (lastDate === today) {
          // Already updated today
          return
        }

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayString = yesterday.toDateString()

        let newStreak = streak
        if (!lastDate || lastDate === yesterdayString) {
          // Continue streak
          newStreak = streak + 1
        } else if (lastDate !== today) {
          // Break streak
          newStreak = 1
        }

        set({
          streak: newStreak,
          lastActivityDate: today,
        })

        gamificationService.updateProfile({
          streak: newStreak,
          lastActivityDate: today,
        })
      },

      checkBadgeUnlocks: () => {
        const { totalPoints, streak, unlockedBadges } = get()
        const allBadges = [
          { id: 'first_task', name: 'First Task', condition: (p, s) => p >= 10 },
          { id: 'focus_master', name: 'Focus Master', condition: (p, s) => p >= 1000 },
          { id: 'week_warrior', name: 'Week Warrior', condition: (p, s) => s >= 7 },
          { id: 'month_legend', name: 'Month Legend', condition: (p, s) => s >= 30 },
          { id: 'point_king', name: 'Point King', condition: (p, s) => p >= 10000 },
        ]

        const newlyUnlocked = allBadges.filter(
          (badge) =>
            !unlockedBadges.includes(badge.id) &&
            badge.condition(totalPoints, streak)
        )

        if (newlyUnlocked.length > 0) {
          const newUnlockedIds = [...unlockedBadges, ...newlyUnlocked.map((b) => b.id)]
          set({ unlockedBadges: newUnlockedIds })
          gamificationService.updateProfile({ unlockedBadges: newUnlockedIds })
        }
      },

      fetchBadges: async () => {
        try {
          const badges = await gamificationService.getBadges()
          set({ badges })
          return badges
        } catch (error) {
          console.error('Failed to fetch badges:', error)
          return []
        }
      },
    }),
    {
      name: 'focuswave-gamification',
    }
  )
)

