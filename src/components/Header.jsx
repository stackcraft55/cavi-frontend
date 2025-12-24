import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useWalletContext } from '../contexts/WalletContext'
import logo from '../img/logo.png'

// Admin emails that can access admin panel
const ADMIN_EMAILS = ['Kashifmahi271@gmail.com', 'superdev5597@gmail.com']

const isAdmin = (email) => {
  return email && ADMIN_EMAILS.includes(email)
}

export default function Header({ theme, setTheme, activeTab, setActiveTab, user }) {
  const [showNetworks, setShowNetworks] = useState(false)
  const networksRef = useRef(null)
  const { activeNetwork, setActiveNetwork } = useWalletContext()

  const chains = ['Ether', 'BSC', 'Tron', 'Solana'] // Ether first as default

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (networksRef.current && !networksRef.current.contains(event.target)) {
        setShowNetworks(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <header className={`shadow-xl sticky top-0 z-50 px-4 md:px-8 py-5 flex justify-between items-center transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-[#1a1f3a] via-[#2d1b4e] to-[#1a1f3a] border-b border-gray-700/50'
          : 'bg-gradient-to-r from-[#f5f7fa] via-[#c3cfe2] to-[#f5f7fa] border-b border-gray-300/50'
      }`}>
        <Link to="/" className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
          <img src={logo} alt="CAVI Logo" className="h-20 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20'
                : 'bg-gray-800/10 hover:bg-gray-800/20 backdrop-blur-sm text-gray-800 border border-gray-300/50'
            } flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5`}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <div className="relative" ref={networksRef}>
            <button
              onClick={() => setShowNetworks(!showNetworks)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 backdrop-blur-sm flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                theme === 'dark'
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  : 'bg-gray-800/10 hover:bg-gray-800/20 text-gray-800 border border-gray-300/50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              {activeNetwork || 'Ether'}
              <svg className={`w-4 h-4 transition-transform ${showNetworks ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showNetworks && (
              <div className={`absolute right-0 mt-2 rounded-xl shadow-2xl min-w-[220px] z-50 overflow-auto animate-in fade-in slide-in-from-top-2 ${
                theme === 'dark'
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white border border-gray-200'
              }`}>
                <div className="p-2">
                  {chains.map((chain) => (
                    <button
                      key={chain}
                      onClick={() => {
                        setActiveNetwork(chain)
                        setShowNetworks(false)
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between ${
                        activeNetwork === chain
                          ? theme === 'dark'
                            ? 'bg-[#667eea]/20 text-white border border-[#667eea]/50'
                            : 'bg-[#667eea]/10 text-[#667eea] border border-[#667eea]/30'
                          : theme === 'dark'
                            ? 'hover:bg-gray-700/50 text-gray-300'
                            : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="font-semibold">{chain}</span>
                      {activeNetwork === chain && (
                        <svg className="w-5 h-5 text-[#667eea]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={`flex gap-2 px-4 md:px-8 py-4 sticky top-[85px] z-40 shadow-sm transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-[#1a1f3a] via-[#2d1b4e] to-[#1a1f3a] border-b border-gray-700/50'
          : 'bg-gradient-to-r from-[#f5f7fa] via-[#c3cfe2] to-[#f5f7fa] border-b border-gray-300/50'
      }`}>
        <button
          className={`px-8 py-3 rounded-t-xl font-semibold text-sm transition-all duration-300 border-b-3 relative ${
            activeTab === 'track' 
              ? `bg-gradient-to-b from-[#667eea]/20 to-transparent ${theme === 'dark' ? 'text-white' : 'text-gray-800'} border-[#667eea] shadow-sm` 
              : theme === 'dark'
                ? 'text-gray-300 hover:bg-gradient-to-b hover:from-[#667eea]/10 hover:to-transparent hover:text-white border-transparent'
                : 'text-gray-600 hover:bg-gradient-to-b hover:from-[#667eea]/10 hover:to-transparent hover:text-[#667eea] border-transparent'
          }`}
          onClick={() => setActiveTab('track')}
        >
          Track
          {activeTab === 'track' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#667eea] to-[#764ba2]"></div>
          )}
        </button>
        <button
          className={`px-8 py-3 rounded-t-xl font-semibold text-sm transition-all duration-300 border-b-3 relative ${
            activeTab === 'withdraw' 
              ? `bg-gradient-to-b from-[#667eea]/20 to-transparent ${theme === 'dark' ? 'text-white' : 'text-gray-800'} border-[#667eea] shadow-sm` 
              : theme === 'dark'
                ? 'text-gray-300 hover:bg-gradient-to-b hover:from-[#667eea]/10 hover:to-transparent hover:text-white border-transparent'
                : 'text-gray-600 hover:bg-gradient-to-b hover:from-[#667eea]/10 hover:to-transparent hover:text-[#667eea] border-transparent'
          }`}
          onClick={() => setActiveTab('withdraw')}
        >
          Withdraw
          {activeTab === 'withdraw' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#667eea] to-[#764ba2]"></div>
          )}
        </button>
        <button
          className={`px-8 py-3 rounded-t-xl font-semibold text-sm transition-all duration-300 border-b-3 relative ${
            activeTab === 'wallets' 
              ? `bg-gradient-to-b from-[#667eea]/20 to-transparent ${theme === 'dark' ? 'text-white' : 'text-gray-800'} border-[#667eea] shadow-sm` 
              : theme === 'dark'
                ? 'text-gray-300 hover:bg-gradient-to-b hover:from-[#667eea]/10 hover:to-transparent hover:text-white border-transparent'
                : 'text-gray-600 hover:bg-gradient-to-b hover:from-[#667eea]/10 hover:to-transparent hover:text-[#667eea] border-transparent'
          }`}
          onClick={() => setActiveTab('wallets')}
        >
          Wallets
          {activeTab === 'wallets' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#667eea] to-[#764ba2]"></div>
          )}
        </button>
        <button
          className={`px-8 py-3 rounded-t-xl font-semibold text-sm transition-all duration-300 border-b-3 relative ${
            activeTab === 'mypage' 
              ? `bg-gradient-to-b from-[#667eea]/20 to-transparent ${theme === 'dark' ? 'text-white' : 'text-gray-800'} border-[#667eea] shadow-sm` 
              : theme === 'dark'
                ? 'text-gray-300 hover:bg-gradient-to-b hover:from-[#667eea]/10 hover:to-transparent hover:text-white border-transparent'
                : 'text-gray-600 hover:bg-gradient-to-b hover:from-[#667eea]/10 hover:to-transparent hover:text-[#667eea] border-transparent'
          }`}
          onClick={() => setActiveTab('mypage')}
        >
          My Page
          {activeTab === 'mypage' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#667eea] to-[#764ba2]"></div>
          )}
        </button>
        {isAdmin(user?.email) && (
          <button
            className={`px-8 py-3 rounded-t-xl font-semibold text-sm transition-all duration-300 border-b-3 relative ${
              activeTab === 'admin' 
                ? `bg-gradient-to-b from-[#667eea]/20 to-transparent ${theme === 'dark' ? 'text-white' : 'text-gray-800'} border-[#667eea] shadow-sm` 
                : theme === 'dark'
                  ? 'text-gray-300 hover:bg-gradient-to-b hover:from-[#667eea]/10 hover:to-transparent hover:text-white border-transparent'
                  : 'text-gray-600 hover:bg-gradient-to-b hover:from-[#667eea]/10 hover:to-transparent hover:text-[#667eea] border-transparent'
            }`}
            onClick={() => setActiveTab('admin')}
          >
            Admin
            {activeTab === 'admin' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#667eea] to-[#764ba2]"></div>
            )}
          </button>
        )}
      </div>
    </>
  )
}

