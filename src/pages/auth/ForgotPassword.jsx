import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { validateEmail } from '../../utils/validation'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'

const ForgotPassword = () => {
  const { forgotPassword, loading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!email) {
      setError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email')
      return
    }

    const result = await forgotPassword(email)
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || 'Something went wrong')
    }
  }

  return (
    <Card className="p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl -mr-20 -mt-20" />
      <div className="relative z-10">
        <h2 className="text-4xl font-bold gradient-text mb-3">
          Reset password
        </h2>
        <p className="text-lg text-calm-600 dark:text-calm-400 mb-8 font-medium">
          Enter your email address and we'll send you a link to reset your password
        </p>

      {success ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <p className="text-sm text-green-600 dark:text-green-400">
              If an account exists with this email, a password reset link has been sent.
            </p>
          </div>
          <Link to="/login">
            <Button variant="primary" size="large" className="w-full">
              Back to login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error && !validateEmail(email) ? error : ''}
            required
            autoComplete="email"
            aria-label="Email address"
          />

          <Button
            type="submit"
            variant="primary"
            size="large"
            isLoading={loading}
            className="w-full"
          >
            Send reset link
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-calm-600 dark:text-calm-400">
        Remember your password?{' '}
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

export default ForgotPassword

