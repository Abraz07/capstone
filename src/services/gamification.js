// Mock API service for gamification

const API_DELAY = 300

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const mockProfile = {
  level: 1,
  points: 0,
  totalPoints: 0,
  streak: 0,
  lastActivityDate: null,
  unlockedBadges: [],
}

const allBadges = [
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
]

export const getProfile = async () => {
  await delay(API_DELAY)
  return { ...mockProfile }
}

export const updateProfile = async (updates) => {
  await delay(API_DELAY)
  Object.assign(mockProfile, updates)
  return { ...mockProfile }
}

export const getBadges = async () => {
  await delay(API_DELAY)
  // In a real app, this would fetch from the backend
  // For now, return all badges - the store will check unlocked status
  return allBadges
}

