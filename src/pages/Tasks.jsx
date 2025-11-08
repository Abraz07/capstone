import React, { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Plus, Filter, CheckCircle2, Circle, Trash2, Edit } from 'lucide-react'
import { useTaskStore } from '../store/taskStore'
import { formatDate, isToday } from '../utils/formatTime'
import TaskModal from '../components/tasks/TaskModal'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Select from '../components/ui/Select'
import Skeleton from '../components/ui/Skeleton'

const Tasks = () => {
  const {
    tasks,
    loading,
    filters,
    fetchTasks,
    deleteTask,
    toggleTaskStatus,
    setFilters,
    reorderTasks,
    getFilteredTasks,
  } = useTaskStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const filteredTasks = getFilteredTasks()

  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(filteredTasks)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    reorderTasks(items)
  }

  const handleEdit = (task) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setSelectedTask(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const priorityColors = {
    high: 'danger',
    medium: 'warning',
    low: 'default',
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Skeleton width="200px" height="32px" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width="100%" height="80px" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in px-2 sm:px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 sm:mb-8 gap-4">
        <div className="relative overflow-hidden">
          <div className="absolute -top-2 -left-2 w-24 h-24 bg-indigo-200/20 dark:bg-indigo-800/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-2">
              Tasks
            </h1>
            <p className="text-base sm:text-lg text-calm-600 dark:text-calm-400 font-medium">
              Manage your tasks and stay organized
            </p>
          </div>
        </div>
        <Button variant="primary" size="large" onClick={handleAdd}>
          <Plus className="w-5 h-5 mr-2" />
          Add Task
        </Button>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-calm-600 dark:text-calm-400" />
          <h3 className="font-semibold text-calm-900 dark:text-calm-50">
            Filters
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Tag"
            value={filters.tag}
            onChange={(e) => setFilters({ tag: e.target.value })}
            options={[
              { value: 'all', label: 'All Tags' },
              { value: 'general', label: 'General' },
              { value: 'work', label: 'Work' },
              { value: 'personal', label: 'Personal' },
              { value: 'health', label: 'Health' },
              { value: 'learning', label: 'Learning' },
            ]}
          />
          <Select
            label="Priority"
            value={filters.priority}
            onChange={(e) => setFilters({ priority: e.target.value })}
            options={[
              { value: 'all', label: 'All Priorities' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
          />
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
        </div>
      </Card>

      {filteredTasks.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-calm-600 dark:text-calm-400 mb-4">
            No tasks found. Create your first task to get started!
          </p>
          <Button variant="primary" size="large" onClick={handleAdd}>
            <Plus className="w-5 h-5 mr-2" />
            Add Task
          </Button>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {filteredTasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        variant="gradient"
                        className={`p-6 transition-all duration-300 ${snapshot.isDragging
                          ? 'shadow-elegant-lg scale-105 rotate-2'
                          : 'hover:scale-[1.02]'
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            {...provided.dragHandleProps}
                            className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing"
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2
                                className="w-6 h-6 text-green-600 dark:text-green-400"
                                onClick={() => toggleTaskStatus(task.id)}
                              />
                            ) : (
                              <Circle
                                className="w-6 h-6 text-calm-400 dark:text-calm-500 cursor-pointer"
                                onClick={() => toggleTaskStatus(task.id)}
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3
                              className={`text-lg font-semibold mb-1 ${task.status === 'completed'
                                ? 'line-through text-calm-500 dark:text-calm-500'
                                : 'text-calm-900 dark:text-calm-50'
                                }`}
                            >
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-sm text-calm-600 dark:text-calm-400 mb-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={priorityColors[task.priority]}>
                                {task.priority}
                              </Badge>
                              <Badge variant="default">{task.tag}</Badge>
                              {task.dueDate && (
                                <span className="text-xs text-calm-600 dark:text-calm-400">
                                  Due: {formatDate(task.dueDate)}
                                  {isToday(task.dueDate) && (
                                    <span className="ml-1 text-amber-600 dark:text-amber-400">
                                      (Today)
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(task)}
                              className="p-2 rounded-lg hover:bg-calm-100 dark:hover:bg-calm-700 focus-ring"
                              aria-label="Edit task"
                            >
                              <Edit className="w-5 h-5 text-calm-600 dark:text-calm-400" />
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 focus-ring"
                              aria-label="Delete task"
                            >
                              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={selectedTask}
      />
    </div>
  )
}

export default Tasks

