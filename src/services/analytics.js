import { apiRequest } from '../config/api.js'

const USE_MOCK = false // Set to true to use mock data, false to use real API

const API_DELAY = 400

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const getFocusMinutesPerDay = async (days = 7) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    const data = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toISOString().split('T')[0],
        minutes: Math.floor(Math.random() * 120) + 30,
      })
    }
    return data
  }

  try {
    const response = await apiRequest(`/analytics/focus-minutes?days=${days}`)
    console.log('📊 Focus minutes response:', response?.length || 0, 'days')
    return Array.isArray(response) ? response : []
  } catch (error) {
    console.error('❌ Error fetching focus minutes:', error)
    throw error // Re-throw to let hook handle it
  }
}

export const getMoodVsFocusCorrelation = async (days = 7) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    const data = []
    const moods = ['happy', 'calm', 'focused', 'tired', 'anxious']
    for (let i = 0; i < days; i++) {
      const mood = moods[Math.floor(Math.random() * moods.length)]
      const focusMinutes = Math.floor(Math.random() * 120) + 30
      data.push({
        mood,
        focusMinutes,
        date: new Date(Date.now() - (days - i - 1) * 86400000).toISOString(),
      })
    }
    return data
  }

  try {
    const response = await apiRequest(`/analytics/mood-focus?days=${days}`)
    console.log('📊 Mood-focus response:', response?.length || 0, 'moods')
    return Array.isArray(response) ? response : []
  } catch (error) {
    console.error('❌ Error fetching mood-focus correlation:', error)
    throw error // Re-throw to let hook handle it
  }
}

export const getTaskThroughput = async (days = 7) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    const data = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      data.push({
        date: date.toISOString().split('T')[0],
        created: Math.floor(Math.random() * 10) + 1,
        completed: Math.floor(Math.random() * 8) + 1,
      })
    }
    return data
  }

  try {
    const response = await apiRequest(`/analytics/task-throughput?days=${days}`)
    console.log('📊 Task throughput response:', response?.length || 0, 'days')
    return Array.isArray(response) ? response : []
  } catch (error) {
    console.error('❌ Error fetching task throughput:', error)
    throw error // Re-throw to let hook handle it
  }
}

export const getProductivityScore = async () => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    return {
      score: Math.floor(Math.random() * 30) + 70,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      change: Math.floor(Math.random() * 10) + 1,
    }
  }

  try {
    // Calculate productivity score from actual data
    const [focusData, taskData] = await Promise.all([
      getFocusMinutesPerDay(7),
      getTaskThroughput(7),
    ])

    const avgFocusMinutes = focusData.reduce((sum, item) => sum + (item.minutes || 0), 0) / focusData.length || 0
    const totalCreated = taskData.reduce((sum, item) => sum + (item.created || 0), 0)
    const totalCompleted = taskData.reduce((sum, item) => sum + (item.completed || 0), 0)
    const completionRate = totalCreated > 0 ? (totalCompleted / totalCreated) * 100 : 0

    // Calculate score (0-100)
    const focusScore = Math.min((avgFocusMinutes / 120) * 50, 50) // Max 50 points for focus
    const taskScore = Math.min((completionRate / 100) * 50, 50) // Max 50 points for tasks
    const score = Math.round(focusScore + taskScore)

    return {
      score: Math.max(0, Math.min(100, score)),
      trend: 'up', // Could calculate from previous period
      change: 0,
    }
  } catch (error) {
    console.error('Error calculating productivity score:', error)
    return {
      score: 70,
      trend: 'stable',
      change: 0,
    }
  }
}
