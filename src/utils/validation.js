// Validation utilities

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePassword = (password) => {
  // At least 6 characters
  return password.length >= 6
}

export const validateTask = (task) => {
  const errors = {}
  
  if (!task.title || task.title.trim().length === 0) {
    errors.title = 'Task title is required'
  }
  
  if (task.title && task.title.length > 200) {
    errors.title = 'Task title must be less than 200 characters'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

