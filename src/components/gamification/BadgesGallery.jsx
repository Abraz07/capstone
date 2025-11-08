import React, { useEffect, useState } from 'react'
import { useGamificationStore } from '../../store/gamificationStore'
import Card from '../ui/Card'
import Skeleton from '../ui/Skeleton'
import { Lock } from 'lucide-react'

const BadgesGallery = () => {
  const { badges, unlockedBadges, fetchBadges, initialize } = useGamificationStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBadges = async () => {
      await initialize()
      await fetchBadges()
      setLoading(false)
    }
    loadBadges()
  }, [initialize, fetchBadges])

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-calm-900 dark:text-calm-50 mb-4">
          Badges
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width="100%" height="120px" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card variant="gradient" className="p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/10 dark:bg-amber-600/10 rounded-full blur-3xl -mr-20 -mt-20" />
      <div className="relative z-10">
        <h3 className="text-2xl font-bold text-calm-900 dark:text-calm-50 mb-6">
          Badges Gallery
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {badges.map((badge) => {
            const isUnlocked = unlockedBadges.includes(badge.id)
            return (
              <div
                key={badge.id}
                className={`
                  relative p-6 rounded-2xl text-center transition-all duration-300
                  ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/30 dark:via-yellow-900/30 dark:to-orange-900/30 border-2 border-amber-300 dark:border-amber-700 shadow-elegant hover:shadow-elegant-lg transform hover:scale-110 hover:-translate-y-2'
                      : 'bg-calm-100/60 dark:bg-calm-800/60 backdrop-blur-sm border-2 border-calm-300/50 dark:border-calm-600/50 opacity-70'
                  }
                `}
              >
                {!isUnlocked && (
                  <div className="absolute top-3 right-3">
                    <Lock className="w-5 h-5 text-calm-400 dark:text-calm-500" />
                  </div>
                )}
                <div className={`text-5xl mb-3 transform transition-transform ${isUnlocked ? 'hover:scale-125' : ''}`}>
                  {badge.icon}
                </div>
                <h4
                  className={`text-sm font-bold mb-2 ${
                    isUnlocked
                      ? 'text-calm-900 dark:text-calm-50'
                      : 'text-calm-500 dark:text-calm-500'
                  }`}
                >
                  {badge.name}
                </h4>
                <p
                  className={`text-xs ${
                    isUnlocked
                      ? 'text-calm-600 dark:text-calm-400'
                      : 'text-calm-500 dark:text-calm-500'
                  }`}
                >
                  {badge.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

export default BadgesGallery

