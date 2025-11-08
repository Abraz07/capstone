import { apiRequest } from '../config/api.js'

const USE_MOCK = false // Set to true to use mock data, false to use real API

const API_DELAY = 800

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const getCoaching = async (context = {}) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    const responses = [
      {
        message: "That's a great goal! Breaking it down into smaller tasks can help. Would you like me to help you create a task list?",
        suggested_action: "Create a task list"
      },
      {
        message: "Remember to take breaks! The Pomodoro technique works best when you actually take those 5-minute breaks.",
        suggested_action: "Take a 5-minute break"
      },
      {
        message: "It sounds like you're feeling overwhelmed. Try focusing on just one task at a time. What's the most important thing you need to do right now?",
        suggested_action: "Focus on one task"
      },
      {
        message: "Great progress! Keep up the momentum. Would you like to set a timer for your next focus session?",
        suggested_action: "Start a focus session"
      },
      {
        message: "I understand. Sometimes taking a short break can actually help you be more productive. Try logging your mood - it helps track patterns!",
        suggested_action: "Log your mood"
      },
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  try {
    const response = await apiRequest('/ml/coach', {
      method: 'POST',
      body: JSON.stringify({ context }),
    })
    // Backend returns { success: true, data: {...} }
    if (response.success && response.data) {
      return response.data
    }
    return response
  } catch (error) {
    console.error('Error fetching coaching:', error)
    // Fallback response
    return {
      message: "Keep up the great work! Remember to take breaks and stay hydrated. 💪",
      suggested_action: "Take a 5-minute break"
    }
  }
}

