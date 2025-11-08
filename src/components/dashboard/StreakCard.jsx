import React from 'react'
import { Flame } from 'lucide-react'
import { useGamificationStore } from '../../store/gamificationStore'
import Card from '../ui/Card'

const StreakCard = () => {
  const { streak } = useGamificationStore()

  return (
    <Card variant="gradient" className="p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-red-900/30 border-amber-200 dark:border-amber-800/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
          <Flame className="w-6 h-6 text-amber-600 dark:text-amber-400 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-calm-900 dark:text-calm-50">
          Current Streak
        </h3>
      </div>
      <div className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
        {streak}
      </div>
      <p className="text-sm text-calm-600 dark:text-calm-400 mt-2 font-medium">
        {streak === 1 ? 'day' : 'days'} in a row 🔥
      </p>
    </Card>
  )
}

export default StreakCard

