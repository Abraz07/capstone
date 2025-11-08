import React, { useState, createContext, useContext } from 'react'

const TabsContext = createContext()

const Tabs = ({ children, defaultValue, onValueChange, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue)

  const handleTabChange = (value) => {
    setActiveTab(value)
    onValueChange?.(value)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsList = ({ children, className = '' }) => {
  return (
    <div
      className={`flex gap-2 border-b border-calm-200 dark:border-calm-700 ${className}`}
      role="tablist"
    >
      {children}
    </div>
  )
}

const TabsTrigger = ({ value, children, className = '' }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  const isActive = activeTab === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
      onClick={() => setActiveTab(value)}
      className={`
        px-4 py-2 font-medium text-sm border-b-2 transition-colors
        ${isActive
          ? 'border-primary-600 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-calm-600 dark:text-calm-400 hover:text-calm-900 dark:hover:text-calm-200'
        }
        ${className}
      `}
    >
      {children}
    </button>
  )
}

const TabsContent = ({ value, children, className = '' }) => {
  const { activeTab } = useContext(TabsContext)
  
  if (activeTab !== value) return null

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={`mt-4 ${className}`}
    >
      {children}
    </div>
  )
}

Tabs.List = TabsList
Tabs.Trigger = TabsTrigger
Tabs.Content = TabsContent

export default Tabs

