import React from 'react'
import PomodoroWidget from '../components/dashboard/PomodoroWidget'
import MoodQuickLog from '../components/dashboard/MoodQuickLog'
import StreakCard from '../components/dashboard/StreakCard'
import PointsCard from '../components/dashboard/PointsCard'
import TodayTasks from '../components/dashboard/TodayTasks'
import BadgesGallery from '../components/gamification/BadgesGallery'

const Dashboard = () => {
  return (
    <div className="max-w-7xl mx-auto animate-fade-in px-2 sm:px-4">
      <div className="mb-8 sm:mb-10 relative overflow-hidden">
        <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary-200/20 dark:bg-primary-800/20 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-2 sm:mb-3 animate-slide-up">
            Dashboard
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-calm-600 dark:text-calm-400 font-medium animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Welcome back! Here's your productivity overview.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="lg:col-span-2 min-w-0">
          <TodayTasks />
        </div>
        <div className="min-w-0">
          <PomodoroWidget />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="min-w-0">
          <StreakCard />
        </div>
        <div className="min-w-0">
          <PointsCard />
        </div>
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <MoodQuickLog />
        </div>
      </div>

      <div className="mb-4 sm:mb-6 min-w-0">
        <BadgesGallery />
      </div>
    </div>
  )
}

export default Dashboard

