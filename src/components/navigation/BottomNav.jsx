import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  Smile,
  BarChart3,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Timer', href: '/timer', icon: Timer },
  { name: 'Mood', href: '/mood', icon: Smile },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

const BottomNav = () => {
  const location = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-calm-800/95 backdrop-blur-xl border-t border-calm-200 dark:border-calm-700 z-20 lg:hidden shadow-elegant"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-16">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex flex-col items-center justify-center flex-1 h-full
                ${isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-calm-600 dark:text-calm-400'
                }
                transition-colors
                focus-ring
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav

