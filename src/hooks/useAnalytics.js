import { useState, useEffect } from 'react'
import * as analyticsService from '../services/analytics'

export const useAnalyticsStore = () => {
  const [focusData, setFocusData] = useState([])
  const [moodData, setMoodData] = useState([])
  const [taskData, setTaskData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('📊 Fetching analytics data...')
      console.log('📊 API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
      
      // Get today's date for comparison
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Fetch all data in parallel for faster loading
      const [focusResult, moodResult, tasksResult] = await Promise.allSettled([
        analyticsService.getFocusMinutesPerDay(7),
        analyticsService.getMoodVsFocusCorrelation(7),
        analyticsService.getTaskThroughput(7),
      ])
      
      console.log('📊 API Results:', {
        focus: focusResult.status,
        mood: moodResult.status,
        tasks: tasksResult.status,
        focusData: focusResult.status === 'fulfilled' ? focusResult.value : focusResult.reason,
        taskData: tasksResult.status === 'fulfilled' ? tasksResult.value : tasksResult.reason,
        moodData: moodResult.status === 'fulfilled' ? moodResult.value : moodResult.reason,
      })

      // Helper function to format date and check if today
      const formatDate = (dateStr) => {
        try {
          const date = new Date(dateStr + 'T00:00:00')
          date.setHours(0, 0, 0, 0)
          const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const isToday = date.getTime() === today.getTime()
          return { formatted, dateObj: date, isToday, dateKey: dateStr }
        } catch (e) {
          return null
        }
      }

      // Handle focus data
      const focusMap = new Map()
      if (focusResult.status === 'fulfilled' && Array.isArray(focusResult.value)) {
        focusResult.value.forEach(item => {
          if (item && item.date) {
            const dateInfo = formatDate(item.date)
            if (dateInfo) {
              focusMap.set(item.date, {
                date: dateInfo.formatted,
                dateKey: dateInfo.dateKey,
                dateObj: dateInfo.dateObj,
                minutes: Math.round(parseFloat(item.minutes) || 0),
                isToday: dateInfo.isToday,
              })
            }
          }
        })
      } else {
        console.error('Focus data error:', focusResult.reason)
      }

      // Handle task data
      const taskMap = new Map()
      if (tasksResult.status === 'fulfilled' && Array.isArray(tasksResult.value)) {
        tasksResult.value.forEach(item => {
          if (item && item.date) {
            const dateInfo = formatDate(item.date)
            if (dateInfo) {
              taskMap.set(item.date, {
                date: dateInfo.formatted,
                dateKey: dateInfo.dateKey,
                dateObj: dateInfo.dateObj,
                created: parseInt(item.created) || 0,
                completed: parseInt(item.completed) || 0,
                isToday: dateInfo.isToday,
              })
            }
          }
        })
      } else {
        console.error('Task data error:', tasksResult.reason)
      }

      // Handle mood data
      let formattedMood = []
      if (moodResult.status === 'fulfilled' && Array.isArray(moodResult.value)) {
        formattedMood = moodResult.value
          .filter(item => item && item.mood)
          .map((item) => ({
            mood: item.mood.charAt(0).toUpperCase() + item.mood.slice(1),
            focusMinutes: Math.round(parseFloat(item.focusMinutes) || 0),
          }))
      } else {
        console.error('Mood data error:', moodResult.reason)
      }
      
      if (formattedMood.length === 0) {
        formattedMood = [{ mood: 'No mood data yet', focusMinutes: 0 }]
      }

      // Generate last 7 days including today - always ensure we have 7 days
      const last7Days = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const isToday = date.getTime() === today.getTime()
        
        last7Days.push({
          date: dateStr,
          dateKey: dateKey,
          dateObj: date,
          isToday: isToday,
        })
      }

      // Build final data arrays - merge real data with generated dates
      const finalFocusData = last7Days.map(day => {
        const realData = focusMap.get(day.dateKey)
        if (realData) {
          return {
            date: day.date,
            minutes: realData.minutes,
            isToday: day.isToday,
          }
        }
        return {
          date: day.date,
          minutes: 0,
          isToday: day.isToday,
        }
      })

      const finalTaskData = last7Days.map(day => {
        const realData = taskMap.get(day.dateKey)
        if (realData) {
          return {
            date: day.date,
            created: realData.created,
            completed: realData.completed,
            isToday: day.isToday,
          }
        }
        return {
          date: day.date,
          created: 0,
          completed: 0,
          isToday: day.isToday,
        }
      })

      console.log('✅ Analytics data fetched:', {
        focus: finalFocusData.length,
        mood: formattedMood.length,
        tasks: finalTaskData.length,
        todayIncluded: finalFocusData[finalFocusData.length - 1]?.isToday,
        todayFocusMinutes: finalFocusData[finalFocusData.length - 1]?.minutes || 0,
      })

      setFocusData(finalFocusData)
      setMoodData(formattedMood)
      setTaskData(finalTaskData)
    } catch (error) {
      console.error('❌ Failed to fetch analytics:', error)
      // Set empty data on error - include today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const emptyDays = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const isToday = date.getTime() === today.getTime()
        emptyDays.push({
          date: dateStr,
          minutes: 0,
          created: 0,
          completed: 0,
          isToday: isToday,
        })
      }
      setFocusData(emptyDays.map(d => ({ date: d.date, minutes: 0, isToday: d.isToday })))
      setTaskData(emptyDays.map(d => ({ date: d.date, created: 0, completed: 0, isToday: d.isToday })))
      setMoodData([{ mood: 'No data available', focusMinutes: 0 }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  return {
    focusData,
    moodData,
    taskData,
    loading,
    fetchData,
  }
}
