import { apiRequest } from '../config/api.js'

const USE_MOCK = false // Set to true to use mock data, false to use real API

const API_DELAY = 200

const mockSessions = []

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const saveSession = async (sessionData) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    const session = {
      id: `session-${Date.now()}`,
      ...sessionData,
    }
    mockSessions.push(session)
    return session
  }

  try {
    console.log('⏱️ Saving timer session via API:', sessionData.session_type, sessionData.duration)
    const response = await apiRequest('/timer/sessions', {
      method: 'POST',
      body: JSON.stringify({
        session_type: sessionData.session_type || sessionData.type || 'work',
        duration: sessionData.duration || 0,
      }),
    })
    console.log('✅ Timer session saved via API:', response.id)
    // Transform backend response to match frontend format
    return {
      id: String(response.id),
      type: response.session_type,
      session_type: response.session_type,
      duration: response.duration,
      completedAt: response.completed_at,
      completed_at: response.completed_at,
    }
  } catch (error) {
    console.error('❌ Error saving timer session:', error)
    throw error
  }
}

export const getSessionHistory = async (limit = 50) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    return mockSessions
      .sort((a, b) => new Date(b.completedAt || b.completed_at) - new Date(a.completedAt || a.completed_at))
      .slice(0, limit)
  }

  try {
    const response = await apiRequest(`/timer/sessions?limit=${limit}`)
    console.log('⏱️ Session history fetched from API:', response?.length || 0, 'sessions')
    // Transform backend response to match frontend format
    return (response || []).map(session => ({
      id: String(session.id),
      type: session.session_type,
      session_type: session.session_type,
      duration: session.duration,
      completedAt: session.completed_at,
      completed_at: session.completed_at,
    }))
  } catch (error) {
    console.error('❌ Error fetching session history:', error)
    throw error
  }
}

export const getFocusStats = async (days = 7) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    const sessionsInRange = mockSessions.filter(
      (session) =>
        (session.type === 'work' || session.session_type === 'work') &&
        new Date(session.completedAt || session.completed_at) >= startDate
    )

    const statsByDate = {}
    sessionsInRange.forEach((session) => {
      const date = new Date(session.completedAt || session.completed_at).toDateString()
      if (!statsByDate[date]) {
        statsByDate[date] = 0
      }
      statsByDate[date] += session.duration / 60 // Convert to minutes
    })

    return Object.entries(statsByDate).map(([date, minutes]) => ({
      date,
      minutes,
    }))
  }

  try {
    const response = await apiRequest(`/timer/stats?days=${days}`)
    console.log('📊 Focus stats fetched from API:', response?.length || 0, 'days')
    // Transform backend response to match frontend format
    return (response || []).map(stat => ({
      date: stat.date,
      minutes: Math.round(stat.minutes || 0),
    }))
  } catch (error) {
    console.error('❌ Error fetching focus stats:', error)
    throw error
  }
}

export const getPomodoroRecommendation = async (taskPriority = 'medium') => {
  try {
    const response = await apiRequest('/ml/recommend-pomodoro', {
      method: 'POST',
      body: JSON.stringify({
        task_priority: taskPriority,
      }),
    })
    console.log('🤖 ML Pomodoro recommendation fetched:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Error fetching Pomodoro recommendation:', error)
    // Return default values if ML service fails
    return {
      focus_minutes: 25,
      break_minutes: 5,
      confidence: 0,
      explanation: 'Using default Pomodoro timing (ML service unavailable)'
    }
  }
}
