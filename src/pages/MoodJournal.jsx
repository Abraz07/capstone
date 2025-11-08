import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Sparkles, CheckCircle2, Heart, Lightbulb, Activity } from 'lucide-react'
import { useMoodStore } from '../store/moodStore'
import { formatDateTime } from '../utils/formatTime'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Textarea from '../components/ui/Textarea'
import Skeleton from '../components/ui/Skeleton'
import * as moodService from '../services/mood'

const moods = [
  { emoji: '😊', value: 'happy', label: 'Happy', color: 'bg-yellow-100 dark:bg-yellow-900/20' },
  { emoji: '😌', value: 'calm', label: 'Calm', color: 'bg-blue-100 dark:bg-blue-900/20' },
  { emoji: '😴', value: 'tired', label: 'Tired', color: 'bg-gray-100 dark:bg-gray-700' },
  { emoji: '😰', value: 'anxious', label: 'Anxious', color: 'bg-red-100 dark:bg-red-900/20' },
  { emoji: '😢', value: 'sad', label: 'Sad', color: 'bg-purple-100 dark:bg-purple-900/20' },
  { emoji: '😐', value: 'neutral', label: 'Neutral', color: 'bg-calm-100 dark:bg-calm-700' },
]

const MoodJournal = () => {
  const { moodLogs, loading, fetchMoodLogs, addMoodLog, deleteMoodLog } = useMoodStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMood, setSelectedMood] = useState(null)
  const [note, setNote] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    fetchMoodLogs()
  }, [fetchMoodLogs])

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood)
    setIsModalOpen(true)
    setAiSuggestions(null)
    setShowSuggestions(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedMood) return

    setIsLoadingSuggestions(true)
    const result = await addMoodLog(selectedMood.value, note)
    
    if (result.success) {
      // Fetch AI suggestions after saving mood
      try {
        const suggestions = await moodService.getMoodSuggestions(selectedMood.value, note)
        setAiSuggestions(suggestions)
        setShowSuggestions(true)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        // Still close modal even if suggestions fail
        setIsModalOpen(false)
        setSelectedMood(null)
        setNote('')
      } finally {
        setIsLoadingSuggestions(false)
      }
    } else {
      setIsLoadingSuggestions(false)
    }
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedMood(null)
    setNote('')
    setShowSuggestions(false)
    setAiSuggestions(null)
  }

  const getMoodConfig = (moodValue) => {
    return moods.find((m) => m.value === moodValue) || moods[5]
  }

  if (loading && moodLogs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Skeleton width="200px" height="32px" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width="100%" height="100px" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in px-2 sm:px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 sm:mb-8 gap-4">
        <div className="relative overflow-hidden">
          <div className="absolute -top-2 -left-2 w-24 h-24 bg-purple-200/20 dark:bg-purple-800/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-2">
              Mood Journal
            </h1>
            <p className="text-base sm:text-lg text-calm-600 dark:text-calm-400 font-medium">
              Track your mood and get AI-powered personalized suggestions
            </p>
          </div>
        </div>
        <Button variant="primary" size="large" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Log Mood
        </Button>
      </div>

      {/* Mood selector grid */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-calm-900 dark:text-calm-50 mb-4">
          How are you feeling?
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {moods.map((mood) => (
            <button
              key={mood.value}
              onClick={() => handleMoodSelect(mood)}
              className={`
                p-4 rounded-xl transition-all hover:scale-105 focus-ring
                ${mood.color} border-2 border-transparent hover:border-primary-300 dark:hover:border-primary-700
              `}
              aria-label={mood.label}
            >
              <div className="text-4xl mb-2">{mood.emoji}</div>
              <div className="text-xs font-medium text-calm-700 dark:text-calm-300">
                {mood.label}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Mood log timeline */}
      <div className="space-y-4">
        {moodLogs.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-calm-600 dark:text-calm-400 mb-4">
              No mood logs yet. Start tracking your mood!
            </p>
            <Button variant="primary" size="large" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Log Mood
            </Button>
          </Card>
        ) : (
          moodLogs.map((log) => {
            const moodConfig = getMoodConfig(log.mood)
            return (
              <Card key={log.id} variant="gradient" className="p-6 hover:scale-[1.02] transition-transform">
                <div className="flex items-start gap-4">
                  <div
                    className={`
                      w-20 h-20 rounded-2xl flex items-center justify-center text-4xl
                      ${moodConfig.color} shadow-lg
                      transform hover:scale-110 transition-transform duration-300
                    `}
                  >
                    {moodConfig.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-calm-900 dark:text-calm-50">
                        {moodConfig.label}
                      </h3>
                      <button
                        onClick={() => deleteMoodLog(log.id)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 focus-ring"
                        aria-label="Delete mood log"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                    <p className="text-sm text-calm-600 dark:text-calm-400 mb-2">
                      {formatDateTime(log.createdAt)}
                    </p>
                    {log.note && (
                      <p className="text-calm-700 dark:text-calm-300">{log.note}</p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Add mood modal */}
      <Modal
        isOpen={isModalOpen && !selectedMood}
        onClose={handleClose}
        title="Log Your Mood"
        size="medium"
      >
        <div className="space-y-4">
          <p className="text-calm-600 dark:text-calm-400">
            Select how you're feeling right now
          </p>
          <div className="grid grid-cols-3 gap-3">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => handleMoodSelect(mood)}
                className={`
                  p-4 rounded-xl transition-all hover:scale-105 focus-ring
                  ${mood.color} border-2 border-transparent hover:border-primary-300 dark:hover:border-primary-700
                `}
              >
                <div className="text-4xl mb-2">{mood.emoji}</div>
                <div className="text-xs font-medium text-calm-700 dark:text-calm-300">
                  {mood.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Note modal */}
      <Modal
        isOpen={isModalOpen && selectedMood !== null}
        onClose={handleClose}
        title={showSuggestions ? "✨ AI Suggestions" : `Log ${selectedMood?.label} Mood`}
        size="large"
        footer={
          !showSuggestions ? (
            <>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} disabled={isLoadingSuggestions}>
                {isLoadingSuggestions ? 'Loading...' : 'Save & Get Suggestions'}
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={handleClose}>
              Got it, thanks!
            </Button>
          )
        }
      >
        {!showSuggestions ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center py-4">
              <div className="text-6xl mb-4">{selectedMood?.emoji}</div>
              <p className="text-lg font-semibold text-calm-900 dark:text-calm-50">
                {selectedMood?.label}
              </p>
            </div>
            <Textarea
              label="Add a note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="How are you feeling? What's on your mind?"
            />
            {isLoadingSuggestions && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-sm text-calm-600 dark:text-calm-400">
                  Getting personalized suggestions...
                </p>
              </div>
            )}
          </form>
        ) : (
          aiSuggestions && (
            <div className="space-y-6 animate-fade-in">
              {/* Affirmation */}
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700">
                <div className="flex items-start gap-3">
                  <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      Affirmation for You
                    </h3>
                    <p className="text-purple-800 dark:text-purple-200 text-lg">
                      {aiSuggestions.affirmation}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Insights */}
              {aiSuggestions.insights && (
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Insight
                      </h3>
                      <p className="text-blue-800 dark:text-blue-200">
                        {aiSuggestions.insights}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Suggestions */}
              {aiSuggestions.suggestions && aiSuggestions.suggestions.length > 0 && (
                <Card className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-calm-900 dark:text-calm-50 mb-2">
                        Personalized Suggestions
                      </h3>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {aiSuggestions.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-calm-700 dark:text-calm-300">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Recommended Activities */}
              {aiSuggestions.recommended_activities && aiSuggestions.recommended_activities.length > 0 && (
                <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700">
                  <div className="flex items-start gap-3 mb-4">
                    <Activity className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        Try These Activities
                      </h3>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {aiSuggestions.recommended_activities.map((activity, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center text-green-800 dark:text-green-200 text-sm font-semibold flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-green-800 dark:text-green-200">{activity}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )
        )}
      </Modal>
    </div>
  )
}

export default MoodJournal

