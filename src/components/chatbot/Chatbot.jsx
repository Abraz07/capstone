import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { getCoaching } from '../../services/coach'
import { useAuthStore } from '../../store/authStore'

const Chatbot = () => {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'bot',
      text: "Hi! I'm your FocusWave AI coach. I can help you with productivity, focus, tasks, motivation, and more! Try asking me anything - I'm powered by Gemini AI. 💪",
      timestamp: new Date(),
    },
  ])
  
  const exampleQuestions = [
    "How can I focus better?",
    "I'm feeling overwhelmed",
    "Help me with my tasks",
    "How do I stay motivated?",
    "What should I do when I'm tired?",
    "Tell me about Pomodoro technique"
  ]
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    if (!input.trim() || isLoading || !user) return

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const userInput = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      // Get coaching from ML service via backend
      const context = {
        user_message: userInput,
        current_task: null, // Could be enhanced to get current task
      }

      const coaching = await getCoaching(context)
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: coaching.message || "I'm here to help! Let's work on improving your focus and productivity.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error('Error getting coaching:', error)
      // Fallback response
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: "I'm having trouble connecting right now. But remember - break big tasks into small ones, and take regular breaks! 💪",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card variant="gradient" className="p-0 h-[500px] sm:h-[600px] flex flex-col relative overflow-hidden min-w-0">
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary-400/10 dark:bg-primary-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full min-h-0">
        <div className="p-6 border-b border-calm-200/60 dark:border-calm-700/60 bg-gradient-to-r from-primary-50/50 to-indigo-50/30 dark:from-primary-900/20 dark:to-indigo-900/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-glow">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-calm-900 dark:text-calm-50">
                AI Coach
              </h3>
              <p className="text-xs text-calm-600 dark:text-calm-400 font-medium">
                Online • Ready to help
              </p>
            </div>
          </div>
        </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 animate-slide-up ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.type === 'bot' && (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900 dark:to-indigo-900 flex items-center justify-center flex-shrink-0 shadow-md">
                <Bot className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-3xl px-5 py-3 shadow-elegant ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white'
                  : 'bg-white/80 dark:bg-calm-700/80 backdrop-blur-sm text-calm-900 dark:text-calm-50 border border-calm-200/50 dark:border-calm-600/50'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.type === 'user'
                    ? 'text-primary-100'
                    : 'text-calm-500 dark:text-calm-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {message.type === 'user' && (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center flex-shrink-0 shadow-md">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900 dark:to-indigo-900 flex items-center justify-center flex-shrink-0 shadow-md">
              <Bot className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="bg-white/80 dark:bg-calm-700/80 backdrop-blur-sm rounded-3xl px-5 py-3 shadow-elegant border border-calm-200/50 dark:border-calm-600/50">
              <div className="flex gap-2">
                <span className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Example Questions */}
      {messages.length === 1 && user && !isLoading && (
        <div className="px-6 pb-3 border-t border-calm-200/40 dark:border-calm-700/40 pt-4">
          <p className="text-xs font-semibold text-calm-600 dark:text-calm-400 mb-3">
            💡 Try asking:
          </p>
          <div className="flex flex-wrap gap-2">
            {exampleQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  setInput(question)
                  // Auto-send the message
                  setTimeout(() => {
                    handleSend(new Event('submit', { bubbles: true, cancelable: true }))
                  }, 50)
                }}
                className="px-3 py-2 text-xs bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/30 dark:to-indigo-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:from-primary-100 hover:to-indigo-100 dark:hover:from-primary-900/50 dark:hover:to-indigo-900/50 transition-all duration-200 border border-primary-200/50 dark:border-primary-800/50 hover:scale-105 hover:shadow-md"
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="p-6 border-t border-calm-200/60 dark:border-calm-700/60 bg-gradient-to-r from-calm-50/50 to-primary-50/30 dark:from-calm-800/50 dark:to-primary-900/20">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={user ? "Ask me anything about productivity, focus, or tasks..." : "Please login to chat"}
            className="flex-1"
            disabled={isLoading || !user}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!input.trim() || isLoading || !user}
            aria-label="Send message"
            className="px-6 flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        {user && (
          <p className="text-xs text-calm-500 dark:text-calm-400 mt-2 text-center">
            Ask about focus, tasks, motivation, breaks, Pomodoro, or anything productivity-related!
          </p>
        )}
      </form>
      </div>
    </Card>
  )
}

export default Chatbot

