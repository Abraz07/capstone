import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import PomodoroTimer from './pages/PomodoroTimer'
import MoodJournal from './pages/MoodJournal'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

function App() {
  const { user } = useAuthStore()

  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Protected routes */}
        <Route
          element={
            user ? <MainLayout /> : <Navigate to="/login" replace />
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/timer" element={<PomodoroTimer />} />
          <Route path="/mood" element={<MoodJournal />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  )
}

export default App

