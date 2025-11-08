import React, { useState } from 'react'
import { usePreferencesStore } from '../store/preferencesStore'
import { useTimerStore } from '../store/timerStore'
import { useAuthStore } from '../store/authStore'
import Card from '../components/ui/Card'
import Toggle from '../components/ui/Toggle'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Chatbot from '../components/chatbot/Chatbot'
import Tabs from '../components/ui/Tabs'
import { Plus, Trash2 } from 'lucide-react'

const Settings = () => {
  const {
    darkMode,
    reducedMotion,
    largeText,
    highContrast,
    distractions,
    notifications,
    soundEnabled,
    toggleDarkMode,
    setReducedMotion,
    setLargeText,
    setHighContrast,
    addDistraction,
    removeDistraction,
    setNotifications,
    setSoundEnabled,
  } = usePreferencesStore()

  const {
    workDuration,
    breakDuration,
    longBreakDuration,
    setWorkDuration,
    setBreakDuration,
    setLongBreakDuration,
  } = useTimerStore()

  const { user, updateProfile, loading } = useAuthStore()

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [newDistraction, setNewDistraction] = useState('')

  const handleAddDistraction = () => {
    if (newDistraction.trim()) {
      addDistraction({
        id: Date.now().toString(),
        name: newDistraction.trim(),
      })
      setNewDistraction('')
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    await updateProfile(profileData)
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in px-2 sm:px-4">
      <div className="mb-6 sm:mb-8 relative overflow-hidden">
        <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary-200/20 dark:bg-primary-800/20 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-2 sm:mb-3">
            Settings
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-calm-600 dark:text-calm-400 font-medium">
            Customize your FocusWave experience
          </p>
        </div>
      </div>

      <Tabs defaultValue="settings" className="mb-6">
        <Tabs.List>
          <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
          <Tabs.Trigger value="chatbot">AI Coach</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="settings">
          <div className="space-y-6">
        {/* Profile Settings */}
        <Card variant="gradient" className="p-4 sm:p-6 lg:p-8 relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-400/10 dark:bg-primary-600/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-calm-900 dark:text-calm-50 mb-6">
              Profile
            </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Name"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            />
            <Button type="submit" variant="primary" isLoading={loading}>
              Update Profile
            </Button>
          </form>
          </div>
        </Card>

        {/* Timer Settings */}
        <Card variant="gradient" className="p-4 sm:p-6 lg:p-8 relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-calm-900 dark:text-calm-50 mb-6">
              Timer Preferences
            </h2>
          <div className="space-y-4">
            <Input
              label="Work Duration (minutes)"
              type="number"
              min="5"
              max="60"
              value={workDuration / 60}
              onChange={(e) => setWorkDuration(parseInt(e.target.value) || 25)}
            />
            <Input
              label="Short Break Duration (minutes)"
              type="number"
              min="1"
              max="30"
              value={breakDuration / 60}
              onChange={(e) => setBreakDuration(parseInt(e.target.value) || 5)}
            />
            <Input
              label="Long Break Duration (minutes)"
              type="number"
              min="5"
              max="60"
              value={longBreakDuration / 60}
              onChange={(e) => setLongBreakDuration(parseInt(e.target.value) || 15)}
            />
          </div>
          </div>
        </Card>

        {/* Accessibility Settings */}
        <Card variant="gradient" className="p-4 sm:p-6 lg:p-8 relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-calm-900 dark:text-calm-50 mb-6">
              Accessibility
            </h2>
          <div className="space-y-4">
            <Toggle
              checked={darkMode}
              onChange={toggleDarkMode}
              label="Dark Mode"
            />
            <Toggle
              checked={reducedMotion}
              onChange={setReducedMotion}
              label="Reduce Motion"
            />
            <Toggle
              checked={largeText}
              onChange={setLargeText}
              label="Large Text"
            />
            <Toggle
              checked={highContrast}
              onChange={setHighContrast}
              label="High Contrast Mode"
            />
          </div>
          </div>
        </Card>

        {/* Distraction List */}
        <Card variant="gradient" className="p-4 sm:p-6 lg:p-8 relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/10 dark:bg-rose-600/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-calm-900 dark:text-calm-50 mb-6">
              Distraction List
            </h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newDistraction}
                onChange={(e) => setNewDistraction(e.target.value)}
                placeholder="Add a distraction to avoid"
                onKeyPress={(e) => e.key === 'Enter' && handleAddDistraction()}
              />
              <Button
                variant="primary"
                onClick={handleAddDistraction}
                aria-label="Add distraction"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-2">
              {distractions.map((distraction) => (
                <div
                  key={distraction.id}
                  className="flex items-center justify-between p-3 bg-calm-50 dark:bg-calm-800 rounded-lg"
                >
                  <span className="text-calm-900 dark:text-calm-50">
                    {distraction.name}
                  </span>
                  <button
                    onClick={() => removeDistraction(distraction.id)}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 focus-ring"
                    aria-label="Remove distraction"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              ))}
              {distractions.length === 0 && (
                <p className="text-sm text-calm-600 dark:text-calm-400 text-center py-4">
                  No distractions added yet
                </p>
              )}
            </div>
          </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card variant="gradient" className="p-4 sm:p-6 lg:p-8 relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 dark:bg-cyan-600/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-calm-900 dark:text-calm-50 mb-6">
              Notifications
            </h2>
          <div className="space-y-4">
            <Toggle
              checked={notifications}
              onChange={setNotifications}
              label="Enable Notifications"
            />
            <Toggle
              checked={soundEnabled}
              onChange={setSoundEnabled}
              label="Enable Sounds"
            />
          </div>
          </div>
        </Card>
        </div>
      </Tabs.Content>

        <Tabs.Content value="chatbot" className="mt-6">
          <div className="max-w-4xl mx-auto">
            <Chatbot />
          </div>
        </Tabs.Content>
      </Tabs>
    </div>
  )
}

export default Settings

