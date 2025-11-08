import { apiRequest } from '../config/api.js'

const USE_MOCK = false // Set to true to use mock data, false to use real API

const API_DELAY = 300

const mockMoodLogs = []

let moodLogIdCounter = 1

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const getMoodLogs = async () => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    return [...mockMoodLogs].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )
  }

  try {
    const response = await apiRequest('/mood')
    console.log('😊 Mood logs fetched from API:', response?.length || 0, 'logs')
    // Transform backend response to match frontend format
    return (response || []).map(log => ({
      id: String(log.id),
      mood: log.mood,
      note: log.note || '',
      createdAt: log.created_at,
    }))
  } catch (error) {
    console.error('❌ Error fetching mood logs:', error)
    throw error
  }
}

export const createMoodLog = async ({ mood, note }) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    const log = {
      id: String(moodLogIdCounter++),
      mood,
      note: note || '',
      createdAt: new Date().toISOString(),
    }
    mockMoodLogs.push(log)
    return log
  }

  try {
    console.log('😊 Creating mood log via API:', mood)
    const response = await apiRequest('/mood', {
      method: 'POST',
      body: JSON.stringify({
        mood,
        note: note || '',
      }),
    })
    console.log('✅ Mood log created via API:', response.id)
    // Transform backend response to match frontend format
    return {
      id: String(response.id),
      mood: response.mood,
      note: response.note || '',
      createdAt: response.created_at,
    }
  } catch (error) {
    console.error('❌ Error creating mood log:', error)
    throw error
  }
}

export const updateMoodLog = async (id, updates) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    const logIndex = mockMoodLogs.findIndex((l) => l.id === id)
    if (logIndex === -1) {
      throw new Error('Mood log not found')
    }
    mockMoodLogs[logIndex] = {
      ...mockMoodLogs[logIndex],
      ...updates,
    }
    return mockMoodLogs[logIndex]
  }

  try {
    console.log('🔄 Updating mood log via API:', id)
    const response = await apiRequest(`/mood/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        mood: updates.mood,
        note: updates.note || '',
      }),
    })
    console.log('✅ Mood log updated via API:', response.id)
    return {
      id: String(response.id),
      mood: response.mood,
      note: response.note || '',
      createdAt: response.created_at,
    }
  } catch (error) {
    console.error('❌ Error updating mood log:', error)
    throw error
  }
}

export const deleteMoodLog = async (id) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    const logIndex = mockMoodLogs.findIndex((l) => l.id === id)
    if (logIndex === -1) {
      throw new Error('Mood log not found')
    }
    mockMoodLogs.splice(logIndex, 1)
    return { success: true }
  }

  try {
    console.log('🗑️ Deleting mood log via API:', id)
    await apiRequest(`/mood/${id}`, {
      method: 'DELETE',
    })
    console.log('✅ Mood log deleted via API:', id)
    return { success: true }
  } catch (error) {
    console.error('❌ Error deleting mood log:', error)
    throw error
  }
}

export const getMoodSuggestions = async (mood, note = '') => {
  try {
    console.log('🤖 Fetching AI mood suggestions:', mood)
    const response = await apiRequest('/ml/mood-suggestions', {
      method: 'POST',
      body: JSON.stringify({
        mood,
        note: note || '',
      }),
    })
    console.log('✅ Mood suggestions fetched:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Error fetching mood suggestions:', error)
    // Return fallback suggestions
    return {
      suggestions: [
        "Take a moment to breathe deeply",
        "Be kind to yourself today",
        "Remember that your feelings are valid"
      ],
      insights: "Your mood is valid. Remember to be kind to yourself.",
      recommended_activities: [
        "Take a short break",
        "Do something kind for yourself"
      ],
      affirmation: "You're doing your best, and that's enough. Be kind to yourself today. 💙",
      sentiment_analysis: {
        sentiment_score: 0.0,
        label: "neutral"
      }
    }
  }
}
