import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { validateEmail, validatePassword } from '../../utils/validation'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'

const Register = () => {
  const navigate = useNavigate()
  const { register, loading, error } = useAuthStore()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    const result = await register(formData.email, formData.password, formData.name)
    if (result.success) {
      navigate('/')
    }
  }

  return (
    <Card className="p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20" />
      <div className="relative z-10">
        <h2 className="text-4xl font-bold gradient-text mb-3">
          Create account
        </h2>
        <p className="text-lg text-calm-600 dark:text-calm-400 mb-8 font-medium">
          Start your productivity journey today
        </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <Input
          label="Name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
          autoComplete="name"
          aria-label="Full name"
        />

        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
          autoComplete="email"
          aria-label="Email address"
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          required
          autoComplete="new-password"
          aria-label="Password"
          helperText="Must be at least 6 characters"
        />

        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
          aria-label="Confirm password"
        />

        <Button
          type="submit"
          variant="primary"
          size="large"
          isLoading={loading}
          className="w-full"
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-calm-600 dark:text-calm-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-primary-600 dark:text-primary-400 font-medium hover:underline focus-ring rounded"
        >
          Sign in
        </Link>
      </p>
      </div>
    </Card>
  )
}

export default Register

