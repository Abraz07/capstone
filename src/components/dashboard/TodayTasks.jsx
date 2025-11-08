import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, Plus, CheckSquare } from 'lucide-react'
import { useTaskStore } from '../../store/taskStore'
import { formatDate, isToday } from '../../utils/formatTime'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Skeleton from '../ui/Skeleton'

const TodayTasks = () => {
  const { tasks, loading, fetchTasks, toggleTaskStatus } = useTaskStore()

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const todayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false
    return isToday(task.dueDate) || task.status === 'pending'
  }).slice(0, 5)

  const handleToggle = async (id) => {
    await toggleTaskStatus(id)
  }

  if (loading && tasks.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton width="150px" height="24px" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height="48px" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl -ml-20 -mt-20" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
              <CheckSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-calm-900 dark:text-calm-50">
              Today's Tasks
            </h3>
          </div>
        <Link to="/tasks">
          <Button variant="ghost" size="small">
            View all
          </Button>
        </Link>
        </div>

        {todayTasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-calm-600 dark:text-calm-400 mb-4">
            No tasks for today
          </p>
          <Link to="/tasks">
            <Button variant="primary" size="medium">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {todayTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-calm-50 dark:bg-calm-800 hover:bg-calm-100 dark:hover:bg-calm-700 transition-colors"
            >
              <button
                onClick={() => handleToggle(task.id)}
                className="flex-shrink-0 focus-ring rounded"
                aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <Circle className="w-6 h-6 text-calm-400 dark:text-calm-500" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    task.status === 'completed'
                      ? 'line-through text-calm-500 dark:text-calm-500'
                      : 'text-calm-900 dark:text-calm-50'
                  }`}
                >
                  {task.title}
                </p>
                {task.tag && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                    {task.tag}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </Card>
  )
}

export default TodayTasks

