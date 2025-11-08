// API service for authentication
import { apiRequest } from '../config/api.js'

// Set to true to use mock data, false to use real API
const USE_MOCK = false

const API_DELAY = 500
const mockUsers = [
  {
    id: '1',
    email: 'demo@focuswave.com',
    password: 'demo123',
    name: 'Demo User',
  },
]

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const login = async (email, password) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    const user = mockUsers.find(
      (u) => u.email === email && u.password === password
    )
    if (!user) {
      throw new Error('Invalid email or password')
    }
    const { password: _, ...userWithoutPassword } = user
    return {
      user: userWithoutPassword,
      token: `mock-jwt-token-${user.id}-${Date.now()}`,
    }
  }

  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  
  return response
}

export const register = async (email, password, name) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    if (mockUsers.find((u) => u.email === email)) {
      throw new Error('User with this email already exists')
    }
    const newUser = {
      id: String(mockUsers.length + 1),
      email,
      password,
      name,
    }
    mockUsers.push(newUser)
    const { password: _, ...userWithoutPassword } = newUser
    return {
      user: userWithoutPassword,
      token: `mock-jwt-token-${newUser.id}-${Date.now()}`,
    }
  }

  const response = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  })
  
  return response
}

export const forgotPassword = async (email) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    return { success: true, message: 'If an account exists, a password reset link has been sent.' }
  }

  const response = await apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
  
  return { success: true, ...response }
}

export const updateProfile = async (data) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    return {
      user: {
        id: '1',
        email: data.email || 'demo@focuswave.com',
        name: data.name || 'Demo User',
        ...data,
      },
    }
  }

  const response = await apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  
  return response
}

export const logout = () => {
  // Clear any stored tokens
  localStorage.removeItem('focuswave-auth')
}

