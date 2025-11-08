import React, { useState } from 'react'
import { Menu, Bell, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { usePreferencesStore } from '../../store/preferencesStore'
import Button from '../ui/Button'

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore()
  const { darkMode, toggleDarkMode } = usePreferencesStore()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header
      className="sticky top-0 z-20 bg-white/95 dark:bg-calm-800/95 backdrop-blur-xl border-b border-calm-200/60 dark:border-calm-700/60 shadow-elegant"
      role="banner"
    >
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-calm-100 dark:hover:bg-calm-700 focus-ring"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-calm-900 dark:text-calm-50 lg:hidden">
            FocusWave
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-calm-100 dark:hover:bg-calm-700 focus-ring"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-calm-100 dark:hover:bg-calm-700 focus-ring"
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-glow">
                <User className="w-5 h-5" />
              </div>
              <span className="hidden md:block text-sm font-medium text-calm-700 dark:text-calm-300">
                {user?.name || 'User'}
              </span>
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-calm-800 rounded-xl shadow-lg border border-calm-200 dark:border-calm-700 py-2"
                role="menu"
              >
                <div className="px-4 py-2 border-b border-calm-200 dark:border-calm-700">
                  <p className="text-sm font-medium text-calm-900 dark:text-calm-50">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-calm-600 dark:text-calm-400">
                    {user?.email || ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    logout()
                    setShowUserMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-calm-100 dark:hover:bg-calm-700"
                  role="menuitem"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

