import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import logo from '../img/logo.png'
import { authAPI } from '../api/api'

export default function ForgotPassword({ theme = 'dark' }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [step, setStep] = useState('email') // 'email', 'otp', or 'reset'
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

  const handleRequestOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await authAPI.forgotPassword(email)
      setSuccess('OTP sent! Check your email to reset password.')
      setStep('otp')
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

    // OTP will be verified when resetting password
    // Just move to reset step
    if (otp.length === 6) {
      setSuccess('Please set your new password.')
      setStep('reset')
    } else {
      setError('Please enter a valid 6-digit OTP')
    }
    setLoading(false)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validate passwords
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      await authAPI.resetPassword(email, otp, newPassword)
      setSuccess('Password reset successful! Redirecting to sign in...')
      
      // Redirect to sign in
      setTimeout(() => {
        navigate('/signin')
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return
    
    setLoading(true)
    setError(null)

    try {
      await authAPI.forgotPassword(email)
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
            Reset Password
          </h2>
          <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {step === 'email' && 'Enter your email to receive a reset code'}
            {step === 'otp' && 'Enter the OTP sent to your email'}
            {step === 'reset' && 'Set your new password'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleRequestOTP} className="space-y-4">
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
              {loading ? 'Sending OTP...' : 'Send Reset OTP'}
            </button>

            <div className="text-center">
              <Link
                to="/signin"
                className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        ) : step === 'otp' ? (
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
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 shadow-sm hover:shadow-md ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {showNewPassword ? (
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

            <div>
              <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 shadow-sm hover:shadow-md ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {showConfirmPassword ? (
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

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('otp')
                  setNewPassword('')
                  setConfirmPassword('')
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
                disabled={loading || !newPassword || !confirmPassword}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
