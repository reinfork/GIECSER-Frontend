import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import './index.css'
import './theme.jsx'
import Layout from './layout.jsx'
import Landing from './pages/Landing.jsx'
import TeacherLogin from './pages/TeacherLogin.jsx'
import Teacher from './pages/Teacher.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Courses from './pages/Courses.jsx'
import CourseDetail from './pages/CourseDetail.jsx'
import ChapterClose from './pages/ChapterClose.jsx'
import LessonPlayer from './pages/LessonPlayer.jsx'
import { getKind, getToken } from './auth'

const RequireAuth = ({ children }) =>
  getToken() ? children : <Navigate to="/" replace />
const RequireTeacher = ({ children }) =>
  getToken() && getKind() === 'teacher' ? children : <Navigate to="/teacher/login" replace />
const GuestOnly = ({ children, to = '/dashboard' }) =>
  getToken() ? <Navigate to={to} replace /> : children

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/teacher/login', element: <GuestOnly to="/teacher"><TeacherLogin /></GuestOnly> },
  { path: '/teacher', element: <RequireTeacher><Teacher /></RequireTeacher> },
  {
    element: <RequireAuth><Layout /></RequireAuth>,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'chapters/:id', element: <CourseDetail /> },
      { path: 'chapters/:id/reflection', element: <ChapterClose mode="reflection" /> },
      { path: 'chapters/:id/mastery', element: <ChapterClose mode="mastery" /> },
      { path: 'courses/:id', element: <Courses /> },
      { path: 'modules/:id', element: <LessonPlayer /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
