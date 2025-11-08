import { apiRequest } from '../config/api.js'

const USE_MOCK = false // Set to true to use mock data, false to use real API

const API_DELAY = 300

const mockTasks = []

let taskIdCounter = 1

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const getTasks = async () => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    return [...mockTasks].sort((a, b) => a.order - b.order)
  }

  try {
    const response = await apiRequest('/tasks')
    console.log('📋 Tasks fetched from API:', response?.length || 0, 'tasks')
    // Transform backend response to match frontend format
    return (response || []).map(task => ({
      id: String(task.id),
      title: task.title,
      description: task.description || '',
      tag: task.tag || 'general',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      dueDate: task.due_date || null,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      order: task.task_order || 0,
    }))
  } catch (error) {
    console.error('❌ Error fetching tasks:', error)
    throw error
  }
}

export const createTask = async (task) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    const newTask = {
      id: String(taskIdCounter++),
      title: task.title,
      description: task.description || '',
      tag: task.tag || 'general',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      dueDate: task.dueDate || null,
      createdAt: new Date().toISOString(),
      order: mockTasks.length,
    }
    mockTasks.push(newTask)
    return newTask
  }

  try {
    console.log('📝 Creating task via API:', task.title)
    const response = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: task.title,
        description: task.description || '',
        tag: task.tag || 'general',
        priority: task.priority || 'medium',
        due_date: task.dueDate || null,
      }),
    })
    console.log('✅ Task created via API:', response.id)
    // Transform backend response to match frontend format
    return {
      id: String(response.id),
      title: response.title,
      description: response.description || '',
      tag: response.tag || 'general',
      priority: response.priority || 'medium',
      status: response.status || 'pending',
      dueDate: response.due_date || null,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
      order: response.task_order || 0,
    }
  } catch (error) {
    console.error('❌ Error creating task:', error)
    throw error
  }
}

export const updateTask = async (id, updates) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    const taskIndex = mockTasks.findIndex((t) => t.id === id)
    if (taskIndex === -1) {
      throw new Error('Task not found')
    }
    mockTasks[taskIndex] = {
      ...mockTasks[taskIndex],
      ...updates,
    }
    return mockTasks[taskIndex]
  }

  try {
    console.log('🔄 Updating task via API:', id, updates)
    const response = await apiRequest(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: updates.title,
        description: updates.description,
        tag: updates.tag,
        priority: updates.priority,
        status: updates.status,
        due_date: updates.dueDate || null,
      }),
    })
    console.log('✅ Task updated via API:', response.id, response.status)
    // Transform backend response to match frontend format
    return {
      id: String(response.id),
      title: response.title,
      description: response.description || '',
      tag: response.tag || 'general',
      priority: response.priority || 'medium',
      status: response.status || 'pending',
      dueDate: response.due_date || null,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
      order: response.task_order || 0,
    }
  } catch (error) {
    console.error('❌ Error updating task:', error)
    throw error
  }
}

export const deleteTask = async (id) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    const taskIndex = mockTasks.findIndex((t) => t.id === id)
    if (taskIndex === -1) {
      throw new Error('Task not found')
    }
    mockTasks.splice(taskIndex, 1)
    return { success: true }
  }

  try {
    console.log('🗑️ Deleting task via API:', id)
    await apiRequest(`/tasks/${id}`, {
      method: 'DELETE',
    })
    console.log('✅ Task deleted via API:', id)
    return { success: true }
  } catch (error) {
    console.error('❌ Error deleting task:', error)
    throw error
  }
}

export const reorderTasks = async (taskIds) => {
  if (USE_MOCK) {
    await delay(API_DELAY)
    taskIds.forEach((id, index) => {
      const task = mockTasks.find((t) => t.id === id)
      if (task) {
        task.order = index
      }
    })
    return { success: true }
  }

  try {
    console.log('🔄 Reordering tasks via API')
    await apiRequest('/tasks/reorder', {
      method: 'POST',
      body: JSON.stringify({ taskIds }),
    })
    console.log('✅ Tasks reordered via API')
    return { success: true }
  } catch (error) {
    console.error('❌ Error reordering tasks:', error)
    throw error
  }
}
