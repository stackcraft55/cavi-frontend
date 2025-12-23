import { useState } from 'react'

export default function AuthModal({ theme = 'dark', onLogin }) {
  const [mode, setMode] = useState('signin') // 'signin', 'signup', 'forgot'
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('email') // 'email' or 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [countdown, setCountdown] = useState(0)

  const handleRequestOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      let endpoint = '/auth/login'
      let body = { email }
      
      if (mode === 'signup') {
        endpoint = '/auth/signup'
        body = { email, name: name || email.split('@')[0] }
      } else if (mode === 'forgot') {
        endpoint = '/auth/forgot-password'
        body = { email }
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP')
      }

      setSuccess(mode === 'signup' 
        ? 'OTP sent! Verify to complete registration.' 
        : mode === 'forgot'
        ? 'OTP sent! Check your email to reset.'
        : 'OTP sent to your email!')
      setStep('otp')
      setCountdown(60) // 60 second countdown
      
      // Countdown timer
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
      setError(err.message || 'Failed to send OTP. Please try again.')
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
      const endpoint = mode === 'signup' ? '/auth/verify-signup' : '/auth/verify'
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP')
      }

      // Store token and user info
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      setSuccess(mode === 'signup' ? 'Sign up successful!' : 'Login successful!')
      
      // Call onLogin callback
      if (onLogin) {
        onLogin(data.user, data.token)
      }
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP')
      }

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

  const resetForm = () => {
    setEmail('')
    setName('')
    setOtp('')
    setStep('email')
    setError(null)
    setSuccess(null)
    setCountdown(0)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
      <div
        className={`rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 border animate-in zoom-in-95 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
            {mode === 'signup' ? 'Sign Up' : mode === 'forgot' ? 'Reset Account' : 'Sign In'}
          </h2>
        </div>

        {/* Mode Tabs */}
        {step === 'email' && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setMode('signin'); resetForm() }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                  : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); resetForm() }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                  : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            {mode === 'signup' && (
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
            )}

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
              disabled={loading || !email}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : mode === 'signup' ? 'Sign Up' : mode === 'forgot' ? 'Send Reset OTP' : 'Send OTP'}
            </button>

            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => {
                  setMode('forgot')
                  resetForm()
                }}
                className={`w-full text-sm text-center ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
              >
                Forgot Password?
              </button>
            )}

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  resetForm()
                }}
                className={`w-full text-sm text-center ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
              >
                Back to Sign In
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                Enter 6-Digit OTP
              </label>
              <div className="flex items-center gap-2">
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
                  className={`flex-1 px-4 py-3 border-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 shadow-sm hover:shadow-md text-center text-2xl font-bold tracking-widest ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                />
              </div>
              <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Check your email for the 6-digit code
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
                  setStep('email')
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
                {loading ? 'Verifying...' : mode === 'signup' ? 'Complete Sign Up' : 'Verify OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

