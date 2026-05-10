import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from './hooks/useAuth.tsx'
import Login from './pages/admin/Login'
import RedeemCodeGenerate from './pages/admin/RedeemCodeGenerate'
import RedeemCodeList from './pages/admin/RedeemCodeList'
import Redeem from './pages/Redeem'

function App() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/admin/login"
        element={isAuthenticated ? <Navigate to="/admin/redeem-codes" replace /> : <Login />}
      />
      <Route
        path="/admin/redeem-codes"
        element={isAuthenticated ? <RedeemCodeList /> : <Navigate to="/admin/login" replace />}
      />
      <Route
        path="/admin/redeem-codes/generate"
        element={isAuthenticated ? <RedeemCodeGenerate /> : <Navigate to="/admin/login" replace />}
      />
      <Route path="/redeem" element={<Redeem />} />
      <Route path="/" element={<Navigate to="/redeem" replace />} />
    </Routes>
  )
}

export default App
