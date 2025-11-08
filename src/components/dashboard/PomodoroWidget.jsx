import React, { useEffect } from 'react'
import { Play, Pause, RotateCcw, Timer } from 'lucide-react'
import { useTimerStore } from '../../store/timerStore'
import { useGamificationStore } from '../../store/gamificationStore'
import { formatTime } from '../../utils/formatTime'
import Button from '../ui/Button'
import Card from '../ui/Card'

const PomodoroWidget = () => {
  const {
    isRunning,
    isPaused,
    timeRemaining,
    currentSession,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  } = useTimerStore()

  const { awardFocusPoints } = useGamificationStore()

  useEffect(() => {
    let interval = null
    if (isRunning) {
      interval = setInterval(() => {
        // Timer updates are handled by the store
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const handleStart = () => {
    if (isPaused) {
      resumeTimer()
    } else {
      startTimer()
    }
  }

  const handlePause = () => {
    pauseTimer()
  }

  const handleReset = () => {
    resetTimer()
  }

  const sessionLabels = {
    work: 'Focus Time',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
  }

  return (
    <Card variant="gradient" className="p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-400/10 dark:bg-primary-600/10 rounded-full blur-2xl -mr-16 -mt-16" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary-100 dark:bg-primary-900/50 rounded-xl">
            <Timer className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-xl font-bold text-calm-900 dark:text-calm-50">
            Pomodoro Timer
          </h3>
        </div>
        
        <div className="text-center">
          <div className="mb-8 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border-4 border-primary-200/50 dark:border-primary-800/50 animate-pulse-slow" />
            </div>
            <div className="relative">
              <div className="text-6xl font-extrabold bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 dark:from-primary-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
                {formatTime(timeRemaining)}
              </div>
              <p className="text-base font-semibold text-calm-600 dark:text-calm-400 uppercase tracking-wide">
                {sessionLabels[currentSession]}
              </p>
            </div>
          </div>

        <div className="flex items-center justify-center gap-3">
          {!isRunning && !isPaused && (
            <Button
              onClick={handleStart}
              variant="primary"
              size="large"
              className="min-w-[120px]"
            >
              <Play className="w-5 h-5 mr-2" />
              Start
            </Button>
          )}
          
          {isRunning && (
            <Button
              onClick={handlePause}
              variant="secondary"
              size="large"
              className="min-w-[120px]"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          )}
          
          {isPaused && (
            <>
              <Button
                onClick={handleStart}
                variant="primary"
                size="large"
                className="min-w-[120px]"
              >
                <Play className="w-5 h-5 mr-2" />
                Resume
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                size="large"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
            </>
          )}
        </div>
        </div>
      </div>
    </Card>
  )
}

export default PomodoroWidget

