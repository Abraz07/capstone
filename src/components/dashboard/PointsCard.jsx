import React from 'react'
import { Star } from 'lucide-react'
import { useGamificationStore } from '../../store/gamificationStore'
import Card from '../ui/Card'

const PointsCard = () => {
  const { points, level, totalPoints } = useGamificationStore()
  const pointsNeeded = level * 1000
  const progress = (totalPoints % 1000) / 10

  return (
    <Card variant="gradient" className="p-6 bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-50 dark:from-primary-900/30 dark:via-blue-900/30 dark:to-indigo-900/30 border-primary-200 dark:border-primary-800/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-xl">
          <Star className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-calm-900 dark:text-calm-50">
            Level {level}
          </h3>
          <p className="text-sm text-calm-600 dark:text-calm-400 font-medium">
            {points} points
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-calm-600 dark:text-calm-400 font-medium">
            Progress to Level {level + 1}
          </span>
          <span className="text-calm-600 dark:text-calm-400 font-bold">
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-calm-200 dark:bg-calm-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary-600 to-primary-400 h-3 rounded-full transition-all duration-500 shadow-lg"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Card>
  )
}

export default PointsCard

