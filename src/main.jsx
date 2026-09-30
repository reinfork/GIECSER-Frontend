import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Layout from './layout.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Courses from './pages/Courses.jsx'
import CourseDetail from './pages/CourseDetail.jsx'
import { getToken } from './auth'

const RequireAuth = ({ children }) =>
  getToken() ? children : <Navigate to="/login" replace />
const GuestOnly = ({ children }) =>
  getToken() ? <Navigate to="/dashboard" replace /> : children

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <GuestOnly><Login /></GuestOnly> },
  { path: '/register', element: <GuestOnly><Register /></GuestOnly> },
  {
    element: <RequireAuth><Layout /></RequireAuth>,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'courses', element: <Courses /> },
      { path: 'courses/:id', element: <CourseDetail /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
