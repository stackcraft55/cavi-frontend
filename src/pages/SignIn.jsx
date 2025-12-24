import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import logo from '../img/logo.png'
import { authAPI } from '../api/api'

export default function SignIn({ theme = 'dark' }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [otp, setOtp] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    // Check if already logged in, redirect to dashboard
    const token = localStorage.getItem('authToken')
    const user = localStorage.getItem('user')
    if (token && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await authAPI.login(email, password)
      
      // Store token and user info
      localStorage.setItem('authToken', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      setSuccess('Login successful! Redirecting...')
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } catch (err) {
      const errorMessage = err.message || 'Invalid email or password. Please try again.'
      setError(errorMessage)
      
      // If error is about unverified email, show verification option
      if (errorMessage.includes('verify your email') || errorMessage.includes('Please verify')) {
        setShowVerifyModal(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0 || !email) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await authAPI.resendOTP(email)
      setSuccess('Verification OTP sent to your email!')
      setCountdown(60)
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setError(err.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await authAPI.verifySignup(email, otp)
      
      // Store token and user info
      localStorage.setItem('authToken', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      setSuccess('Email verified successfully! Redirecting...')
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className={`rounded-3xl shadow-2xl max-w-md w-full p-8 border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="text-center mb-8">
          <img src={logo} alt="CAVI Logo" className="h-16 w-auto mx-auto mb-4" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
            Sign In
          </h2>
          <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Enter your credentials to access your account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 shadow-sm hover:shadow-md ${
                theme === 'dark'
                  ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-200 text-gray-800'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className={`w-full px-4 py-3 pr-12 border-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 shadow-sm hover:shadow-md ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-800'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                  theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L9.88 9.88m-3.59-3.59l3.59 3.59M12 12l.879.879m-6.5 6.5L3 21M21 21l-3.29-3.29m0 0l-3.59-3.59m3.59 3.59L12 12m-3.59-3.59L12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full px-4 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
            >
              Forgot Password?
            </Link>
          </div>

          <div className="text-center pt-4 border-t border-gray-700">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-[#667eea] hover:underline font-semibold"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </form>

        {/* Email Verification Modal */}
        {showVerifyModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in" onClick={() => setShowVerifyModal(false)}>
            <div className={`rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 border animate-in zoom-in-95 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">Verify Your Email</h3>
                <button
                  onClick={() => {
                    setShowVerifyModal(false)
                    setOtp('')
                    setError(null)
                    setSuccess(null)
                  }}
                  className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Your email address needs to be verified before you can sign in. Enter the 6-digit OTP sent to <strong>{email}</strong>
                  </p>
                  <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setOtp(value)
                    }}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 shadow-sm hover:shadow-md text-center text-2xl font-bold tracking-widest ${
                      theme === 'dark'
                        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-200 text-gray-800'
                    }`}
                  />
                </div>

                <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {countdown > 0 ? (
                    <span>Resend OTP in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-[#667eea] hover:underline disabled:opacity-50"
                    >
                      Resend Verification OTP
                    </button>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
                    {success}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVerifyModal(false)
                      setOtp('')
                      setError(null)
                      setSuccess(null)
                    }}
                    className={`flex-1 px-4 py-3 border-2 rounded-xl font-semibold transition-all duration-300 ${
                      theme === 'dark'
                        ? 'border-gray-600 text-gray-200 hover:bg-gray-700/50'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
