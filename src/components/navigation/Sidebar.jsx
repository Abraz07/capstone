import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  Smile,
  BarChart3,
  Settings,
  X,
} from 'lucide-react'
import { usePreferencesStore } from '../../store/preferencesStore'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Timer', href: '/timer', icon: Timer },
  { name: 'Mood', href: '/mood', icon: Smile },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { largeText } = usePreferencesStore()

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white/98 dark:bg-calm-800/98 backdrop-blur-xl 
          border-r border-calm-200/60 dark:border-calm-700/60 z-40
          transform transition-transform duration-300 ease-in-out
          shadow-elegant-lg
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:z-10
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-calm-200/60 dark:border-calm-700/60 bg-gradient-to-r from-primary-50/50 to-indigo-50/30 dark:from-primary-900/20 dark:to-indigo-900/20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-xl">🌊</span>
              </div>
              <h2 className="text-2xl font-bold gradient-text">
                FocusWave
              </h2>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-calm-100 dark:hover:bg-calm-700 focus-ring"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2" aria-label="Main navigation">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300
                    ${isActive
                      ? 'bg-gradient-to-r from-primary-500 to-indigo-600 text-white shadow-glow transform scale-105'
                      : 'text-calm-700 dark:text-calm-300 hover:bg-calm-100/80 dark:hover:bg-calm-700/80 hover:scale-105'
                    }
                    ${largeText ? 'text-lg' : ''}
                    focus-ring
                    group
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:text-primary-600 dark:group-hover:text-primary-400'} transition-colors`} />
                  <span className="font-semibold">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

