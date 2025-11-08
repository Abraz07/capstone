import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/navigation/Sidebar'
import BottomNav from '../components/navigation/BottomNav'
import Header from '../components/navigation/Header'
import { usePreferencesStore } from '../store/preferencesStore'
import { useGamificationStore } from '../store/gamificationStore'

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { initialize: initPreferences } = usePreferencesStore()
  const { initialize: initGamification } = useGamificationStore()

  useEffect(() => {
    initPreferences()
    initGamification()
  }, [initPreferences, initGamification])

  return (
    <div className="min-h-screen bg-calm-50 dark:bg-calm-900 relative">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64 min-h-screen flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 relative z-0" role="main">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}

export default MainLayout

