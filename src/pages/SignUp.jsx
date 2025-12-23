import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import logo from '../img/logo.png'
import { authAPI } from '../api/api'

export default function SignUp({ theme = 'dark' }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('signup') // 'signup' or 'verify'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    // Check if already logged in, redirect to dashboard
    const token = localStorage.getItem('authToken')
    const user = localStorage.getItem('user')
    if (token && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validate passwords
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await authAPI.signUp(email, name, password)
      setSuccess('Account created! Please verify your email with the OTP sent to your inbox.')
      setStep('verify')
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
      setError(err.message || 'Failed to create account. Please try again.')
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
      
      setSuccess('Email verified! Redirecting to dashboard...')
      
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

  const handleResendOTP = async () => {
    if (countdown > 0) return
    
    setLoading(true)
    setError(null)

    try {
      await authAPI.resendOTP(email)
      setSuccess('OTP resent to your email!')
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
            Sign Up
          </h2>
          <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Create your account to get started
          </p>
        </div>

        {step === 'signup' ? (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 shadow-sm hover:shadow-md ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-800'
                }`}
              />
            </div>

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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password (min 6 characters)"
                required
                minLength={6}
                className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 shadow-sm hover:shadow-md ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-800'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={6}
                className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 shadow-sm hover:shadow-md ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-200 text-gray-800'
                }`}
              />
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
              disabled={loading || !email || !password || !confirmPassword}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>

            <div className="text-center pt-4 border-t border-gray-700">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Already have an account?{' '}
                <Link
                  to="/signin"
                  className="text-[#667eea] hover:underline font-semibold"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
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
              <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Check your email for the 6-digit verification code
              </p>
            </div>

            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <span>Sent to: {email}</span>
              {countdown > 0 ? (
                <span className="ml-2">Resend in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="ml-2 text-[#667eea] hover:underline disabled:opacity-50"
                >
                  Resend OTP
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
                  setStep('signup')
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
                Back
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
        )}
      </div>
    </div>
  )
}
