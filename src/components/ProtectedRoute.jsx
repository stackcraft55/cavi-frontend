import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('authToken')
  const user = localStorage.getItem('user')

  if (!token || !user) {
    // Redirect to sign in if not authenticated
    return <Navigate to="/signin" replace />
  }

  return children
}

