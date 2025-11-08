import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { validateEmail } from '../../utils/validation'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'

const Login = () => {
  const navigate = useNavigate()
  const { login, loading, error } = useAuthStore()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    const result = await login(formData.email, formData.password)
    if (result.success) {
      navigate('/')
    }
  }

  return (
    <Card className="p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary-400/10 dark:bg-primary-600/10 rounded-full blur-3xl -mr-20 -mt-20" />
      <div className="relative z-10">
        <h2 className="text-4xl font-bold gradient-text mb-3">
          Welcome back
        </h2>
        <p className="text-lg text-calm-600 dark:text-calm-400 mb-8 font-medium">
          Sign in to continue your productivity journey
        </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

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
          autoComplete="current-password"
          aria-label="Password"
        />

        <div className="flex items-center justify-between">
          <Link
            to="/forgot-password"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline focus-ring rounded"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="large"
          isLoading={loading}
          className="w-full"
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-calm-600 dark:text-calm-400">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="text-primary-600 dark:text-primary-400 font-medium hover:underline focus-ring rounded"
        >
          Sign up
        </Link>
      </p>
      </div>
    </Card>
  )
}

export default Login

