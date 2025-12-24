import { useState } from 'react'
import { authAPI } from '../api/api'

export default function MyPageTab({ theme = 'dark', user, onLogout }) {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      setLoading(false)
      return
    }

    try {
      const response = await authAPI.changePassword(currentPassword, newPassword)
      setSuccess(response.message || 'Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // Close form after 2 seconds
      setTimeout(() => {
        setShowChangePassword(false)
        setSuccess(null)
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to change password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 mx-auto max-w-4xl h-full">
      {/* User Info Card */}
      <div className={`rounded-3xl shadow-2xl border flex flex-col overflow-hidden hover:shadow-glow transition-all duration-300 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200/50'
      }`}>
        <div className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white px-6 py-6 border-b border-white/20 relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse"></div>
          <h2 className="text-2xl font-bold m-0 relative z-10 drop-shadow-md">My Account</h2>
          <p className="text-sm text-white/90 mt-1 relative z-10">Manage your account settings</p>
        </div>
        
        <div className="p-6 flex-1">
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${
              theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`text-xs font-bold mb-2 uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Name
              </div>
              <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                {user?.name || 'N/A'}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${
              theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`text-xs font-bold mb-2 uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Email
              </div>
              <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                {user?.email || 'N/A'}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${
              theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`text-xs font-bold mb-2 uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Account Status
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  user?.isVerified 
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                    : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200'
                }`}>
                  {user?.isVerified ? 'Verified' : 'Unverified'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className={`rounded-3xl shadow-2xl border flex flex-col overflow-hidden hover:shadow-glow transition-all duration-300 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200/50'
      }`}>
        <div className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white px-6 py-6 border-b border-white/20 relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse"></div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h2 className="text-2xl font-bold m-0 drop-shadow-md">Change Password</h2>
              <p className="text-sm text-white/90 mt-1">Update your account password</p>
            </div>
            <button
              onClick={() => {
                setShowChangePassword(!showChangePassword)
                setError(null)
                setSuccess(null)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
              }}
              className="px-4 py-2 bg-white/25 hover:bg-white/40 backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 border border-white/30"
            >
              {showChangePassword ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Change Password
                </>
              )}
            </button>
          </div>
        </div>

        {showChangePassword && (
          <div className="p-6">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className={`w-full px-4 py-3 pr-12 border-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 shadow-sm hover:shadow-md ${
                      theme === 'dark'
                        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-200 text-gray-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {showCurrentPassword ? (
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

              <button
                type="submit"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full px-4 py-3 bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white rounded-xl font-semibold hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105 relative overflow-auto group"
              >
                <span className="relative z-10">{loading ? 'Changing Password...' : 'Change Password'}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <div className={`rounded-3xl shadow-2xl border flex flex-col overflow-hidden hover:shadow-glow transition-all duration-300 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200/50'
      }`}>
        <div className="p-6">
          <button
            onClick={onLogout}
            className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

