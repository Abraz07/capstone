import React, { useEffect, useState } from 'react'
import { useTaskStore } from '../../store/taskStore'
import { validateTask } from '../../utils/validation'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Select from '../ui/Select'
import Button from '../ui/Button'

const TaskModal = ({ isOpen, onClose, task = null }) => {
  const { addTask, updateTask, loading } = useTaskStore()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tag: 'general',
    priority: 'medium',
    dueDate: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        tag: task.tag || 'general',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      })
    } else {
      setFormData({
        title: '',
        description: '',
        tag: 'general',
        priority: 'medium',
        dueDate: '',
      })
    }
    setErrors({})
  }, [task, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validation = validateTask(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    const taskData = {
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
    }

    let result
    if (task) {
      result = await updateTask(task.id, taskData)
    } else {
      result = await addTask(taskData)
    }

    if (result.success) {
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Add New Task'}
      size="medium"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={loading}
          >
            {task ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          required
          placeholder="Enter task title"
        />

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Enter task description (optional)"
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tag"
            name="tag"
            value={formData.tag}
            onChange={handleChange}
            options={[
              { value: 'general', label: 'General' },
              { value: 'work', label: 'Work' },
              { value: 'personal', label: 'Personal' },
              { value: 'health', label: 'Health' },
              { value: 'learning', label: 'Learning' },
            ]}
          />

          <Select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
        </div>

        <Input
          label="Due Date"
          type="date"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
        />
      </form>
    </Modal>
  )
}

export default TaskModal

