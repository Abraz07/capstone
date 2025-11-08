import React, { useState } from 'react'
import { Smile } from 'lucide-react'
import { useMoodStore } from '../../store/moodStore'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Textarea from '../ui/Textarea'

const moods = [
  { emoji: '😊', value: 'happy', label: 'Happy' },
  { emoji: '😌', value: 'calm', label: 'Calm' },
  { emoji: '😴', value: 'tired', label: 'Tired' },
  { emoji: '😰', value: 'anxious', label: 'Anxious' },
  { emoji: '😢', value: 'sad', label: 'Sad' },
  { emoji: '😐', value: 'neutral', label: 'Neutral' },
]

const MoodQuickLog = () => {
  const { addMoodLog, loading } = useMoodStore()
  const [selectedMood, setSelectedMood] = useState(null)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood)
    setShowNote(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedMood) return

    const result = await addMoodLog(selectedMood.value, note)
    if (result.success) {
      setSelectedMood(null)
      setNote('')
      setShowNote(false)
    }
  }

  return (
    <Card variant="gradient" className="p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-2xl -mr-16 -mt-16" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
            <Smile className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-calm-900 dark:text-calm-50">
            How are you feeling?
          </h3>
        </div>

        {!showNote ? (
          <div className="grid grid-cols-3 gap-4">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => handleMoodSelect(mood)}
                className="p-5 rounded-2xl bg-white/60 dark:bg-calm-800/60 backdrop-blur-sm 
                         hover:bg-white dark:hover:bg-calm-700 
                         border-2 border-transparent hover:border-purple-300 dark:hover:border-purple-700
                         transition-all duration-300 focus-ring
                         transform hover:scale-110 hover:-translate-y-1
                         shadow-md hover:shadow-lg"
                aria-label={mood.label}
              >
                <div className="text-5xl mb-2 transform hover:scale-125 transition-transform duration-300">{mood.emoji}</div>
                <div className="text-xs font-semibold text-calm-700 dark:text-calm-300">
                  {mood.label}
                </div>
              </button>
            ))}
          </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <div className="text-5xl mb-2">
              {selectedMood?.emoji}
            </div>
            <p className="text-sm text-calm-600 dark:text-calm-400">
              {selectedMood?.label}
            </p>
          </div>

          <Textarea
            label="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="How are you feeling today?"
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowNote(false)
                setNote('')
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </form>
        )}
      </div>
    </Card>
  )
}

export default MoodQuickLog

