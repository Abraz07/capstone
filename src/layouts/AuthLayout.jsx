import React from 'react'
import { Outlet } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 dark:from-calm-900 dark:via-calm-800 dark:to-calm-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-200/30 dark:bg-primary-800/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-800/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-block mb-4 animate-scale-in">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl shadow-glow-lg flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform duration-300">
              <span className="text-4xl">🌊</span>
            </div>
          </div>
          <h1 className="text-6xl font-extrabold gradient-text mb-3 animate-slide-up tracking-tight">
            FocusWave
          </h1>
          <p className="text-calm-600 dark:text-calm-400 text-xl font-medium animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Your productivity companion
          </p>
        </div>
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout

