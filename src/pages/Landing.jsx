import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useWalletContext } from '../contexts/WalletContext'
import logo from '../img/logo.png'

// Chain Card Component with image fallback
const ChainCard = ({ chain, theme }) => {
  const [imageError, setImageError] = useState(false)

  return (
    <div
      className={`p-6 rounded-2xl border text-center transition-all duration-300 hover:shadow-lg hover:scale-105 ${
        theme === 'dark'
          ? 'bg-gray-800/50 border-gray-700 hover:border-[#667eea]/50'
          : 'bg-white border-gray-200 hover:border-[#667eea]/50'
      }`}
    >
      <div className="flex justify-center mb-4 h-16 items-center">
        {imageError ? (
          <div className="text-5xl">{chain.emoji}</div>
        ) : (
          <img
            src={chain.logo}
            alt={`${chain.name} logo`}
            className="w-16 h-16 rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <h4 className={`text-xl font-bold mb-2 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        {chain.name}
      </h4>
      <p className={`text-sm ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {chain.fullName}
      </p>
    </div>
  )
}

export default function Landing({ theme = 'dark', setTheme }) {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showNetworks, setShowNetworks] = useState(false)
  const networksRef = useRef(null)
  const { activeNetwork, setActiveNetwork } = useWalletContext()

  const chains = ['Ether', 'BSC', 'Tron', 'Solana']

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('authToken')
    const user = localStorage.getItem('user')
    if (token && user) {
      setIsLoggedIn(true)
      // Don't redirect, just show logged in state
    } else {
      setIsLoggedIn(false)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (networksRef.current && !networksRef.current.contains(event.target)) {
        setShowNetworks(false)
      }
    }

    if (showNetworks) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNetworks])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    navigate('/')
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`w-full py-6 px-4 md:px-8 border-b ${
        theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <img src={logo} alt="CAVI Logo" className="h-10 w-auto" />
            <h1 className={`text-2xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              CAVI
            </h1>
          </Link>
          <div className="flex items-center gap-3">
            {/* Theme Toggle - Always visible */}
            <button
              onClick={toggleTheme}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20'
                  : 'bg-gray-800/10 hover:bg-gray-800/20 backdrop-blur-sm text-gray-800 border border-gray-300/50'
              } flex items-center gap-2 shadow-md hover:shadow-lg`}
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

            {/* If logged in: Show network selector and logout */}
            {isLoggedIn ? (
              <>
                <div className="relative" ref={networksRef}>
                  <button
                    onClick={() => setShowNetworks(!showNetworks)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 backdrop-blur-sm flex items-center gap-2 shadow-md hover:shadow-lg ${
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
                <button
                  onClick={handleLogout}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                      : 'bg-red-100 hover:bg-red-200 text-red-600 border border-red-200'
                  }`}
                >
                  Logout
                </button>
              </>
            ) : (
              /* If not logged in: Show sign in button */
              <>
                <Link
                  to="/signin"
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="flex items-center justify-center px-4 py-20 md:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className={`text-5xl md:text-6xl lg:text-7xl font-bold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Manage Your{' '}
                  <span className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] bg-clip-text text-transparent">
                    Crypto Wallets
                  </span>
                  <br />
                  With Ease
                </h2>
                <p className={`text-xl md:text-2xl mb-8 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Connect, track, and manage your wallets across multiple blockchains. 
                  Secure, simple, and powerful.
                </p>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {isLoggedIn ? (
                    <Link
                      to="/dashboard"
                      className="px-8 py-4 bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-glow hover:scale-105 relative overflow-hidden group"
                    >
                      <span className="relative z-10">Go to Dashboard</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/signup"
                        className="px-8 py-4 bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-glow hover:scale-105 relative overflow-hidden group"
                      >
                        <span className="relative z-10">Get Started Free</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      </Link>
                      <Link
                        to="/signin"
                        className={`px-8 py-4 rounded-xl font-bold text-lg border-2 transition-all duration-300 hover:scale-105 ${
                          theme === 'dark'
                            ? 'border-gray-600 text-gray-300 hover:border-[#667eea] hover:text-white hover:bg-gray-800'
                            : 'border-gray-300 text-gray-700 hover:border-[#667eea] hover:text-[#667eea] hover:bg-gray-50'
                        }`}
                      >
                        Sign In
                      </Link>
                    </>
                  )}
                </div>
              </div>
              <div className="relative">
                <div className={`rounded-3xl overflow-hidden shadow-2xl ${
                  theme === 'dark' ? 'bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20' : 'bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10'
                }`}>
                  <div className="aspect-square flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="text-9xl mb-4">💼</div>
                      <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Multi-Chain Wallet
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={`py-20 px-4 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className={`text-4xl md:text-5xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Powerful Features
              </h3>
              <p className={`text-xl max-w-2xl mx-auto ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Everything you need to manage your crypto assets efficiently
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className={`p-8 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700 hover:border-[#667eea]/50'
                  : 'bg-white border-gray-200 hover:border-[#667eea]/50'
              }`}>
                <div className="text-5xl mb-4">🔐</div>
                <h4 className={`text-2xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Secure Wallet Management
                </h4>
                <p className={`mb-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Connect and manage wallets across Ethereum, BSC, Tron, and Solana with enterprise-grade security. Your private keys never leave your device.
                </p>
                <ul className={`space-y-2 text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <li>✓ Multi-chain support</li>
                  <li>✓ Hardware wallet compatible</li>
                  <li>✓ End-to-end encryption</li>
                </ul>
              </div>

              <div className={`p-8 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700 hover:border-[#667eea]/50'
                  : 'bg-white border-gray-200 hover:border-[#667eea]/50'
              }`}>
                <div className="text-5xl mb-4">📊</div>
                <h4 className={`text-2xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Real-Time Tracking
                </h4>
                <p className={`mb-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Track your transactions, balances, and wallet activity in real-time with Alchemy integration. Get instant notifications for all activities.
                </p>
                <ul className={`space-y-2 text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <li>✓ Live balance updates</li>
                  <li>✓ Transaction history</li>
                  <li>✓ Activity monitoring</li>
                </ul>
              </div>

              <div className={`p-8 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700 hover:border-[#667eea]/50'
                  : 'bg-white border-gray-200 hover:border-[#667eea]/50'
              }`}>
                <div className="text-5xl mb-4">💸</div>
                <h4 className={`text-2xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Easy Withdrawals
                </h4>
                <p className={`mb-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Withdraw USDC and USDT tokens seamlessly with approval-based permissions for secure transfers. One-click withdrawals to any address.
                </p>
                <ul className={`space-y-2 text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <li>✓ Token approvals</li>
                  <li>✓ Multi-token support</li>
                  <li>✓ Fast transactions</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className={`text-4xl md:text-5xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                How It Works
              </h3>
              <p className={`text-xl max-w-2xl mx-auto ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Get started in three simple steps
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-bold ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                    : 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                }`}>
                  1
                </div>
                <h4 className={`text-2xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Connect Your Wallet
                </h4>
                <p className={`${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Connect your existing wallet using MetaMask, Phantom, TronLink, or any supported wallet. Your keys stay secure.
                </p>
              </div>
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-bold ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                    : 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                }`}>
                  2
                </div>
                <h4 className={`text-2xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Grant Permissions
                </h4>
                <p className={`${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Approve token permissions for USDC and USDT. This allows secure withdrawals while maintaining full control.
                </p>
              </div>
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-bold ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                    : 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                }`}>
                  3
                </div>
                <h4 className={`text-2xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Start Managing
                </h4>
                <p className={`${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Track balances, view transactions, create new wallets, and withdraw tokens - all from one intuitive dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Blockchains Section */}
        <section className={`py-20 px-4 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className={`text-4xl md:text-5xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Supported Blockchains
              </h3>
              <p className={`text-xl max-w-2xl mx-auto ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Manage assets across the most popular blockchains
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: 'Ether', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', fullName: 'Ethereum Mainnet', emoji: '🔷' },
                { name: 'BSC', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png', fullName: 'Binance Smart Chain', emoji: '🟡' },
                { name: 'Tron', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png', fullName: 'Tron Network', emoji: '🔴' },
                { name: 'Solana', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png', fullName: 'Solana Blockchain', emoji: '🟣' }
              ].map((chain) => (
                <ChainCard key={chain.name} chain={chain} theme={theme} />
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className={`text-4xl md:text-5xl font-bold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Security First
                </h3>
                <p className={`text-lg mb-6 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Your security is our top priority. We implement industry-leading security measures to protect your assets.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      theme === 'dark' ? 'bg-[#667eea]/20' : 'bg-[#667eea]/10'
                    }`}>
                      <svg className="w-6 h-6 text-[#667eea]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className={`text-xl font-bold mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Non-Custodial
                      </h4>
                      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        We never store your private keys. You maintain full control of your assets.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      theme === 'dark' ? 'bg-[#667eea]/20' : 'bg-[#667eea]/10'
                    }`}>
                      <svg className="w-6 h-6 text-[#667eea]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className={`text-xl font-bold mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Encrypted Storage
                      </h4>
                      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        All sensitive data is encrypted using advanced encryption standards.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      theme === 'dark' ? 'bg-[#667eea]/20' : 'bg-[#667eea]/10'
                    }`}>
                      <svg className="w-6 h-6 text-[#667eea]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className={`text-xl font-bold mb-2 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Audit Ready
                      </h4>
                      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        Complete transaction history and audit trails for compliance and tracking.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className={`rounded-3xl overflow-hidden shadow-2xl ${
                  theme === 'dark' ? 'bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20' : 'bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10'
                }`}>
                  <div className="aspect-square flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="text-9xl mb-4">🛡️</div>
                      <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Enterprise Security
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={`py-20 px-4 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className={`text-5xl font-bold mb-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent`}>
                  4+
                </div>
                <div className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Blockchains
                </div>
              </div>
              <div className="text-center">
                <div className={`text-5xl font-bold mb-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent`}>
                  100%
                </div>
                <div className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Non-Custodial
                </div>
              </div>
              <div className="text-center">
                <div className={`text-5xl font-bold mb-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent`}>
                  24/7
                </div>
                <div className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Support
                </div>
              </div>
              <div className="text-center">
                <div className={`text-5xl font-bold mb-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent`}>
                  ∞
                </div>
                <div className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Wallets
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className={`text-4xl md:text-5xl font-bold mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Ready to Get Started?
            </h3>
            <p className={`text-xl mb-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Join thousands of users managing their crypto assets with CAVI
            </p>
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="inline-block px-8 py-4 bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-glow hover:scale-105 relative overflow-hidden group"
              >
                <span className="relative z-10">Go to Dashboard</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/signup"
                  className="px-8 py-4 bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-glow hover:scale-105 relative overflow-hidden group"
                >
                  <span className="relative z-10">Get Started Free</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </Link>
                <Link
                  to="/signin"
                  className={`px-8 py-4 rounded-xl font-bold text-lg border-2 transition-all duration-300 hover:scale-105 ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:border-[#667eea] hover:text-white hover:bg-gray-800'
                      : 'border-gray-300 text-gray-700 hover:border-[#667eea] hover:text-[#667eea] hover:bg-gray-50'
                  }`}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`w-full py-6 px-4 md:px-8 border-t ${
        theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto text-center">
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            © 2025 CAVI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

