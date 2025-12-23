import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useWalletContext } from '../contexts/WalletContext'
import logo from '../img/logo.png'
import img from '../img/hero.png'

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
          <Link to="/" className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
            <img src={logo} alt="CAVI Logo" className="h-10 w-auto" />
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
              {/* Left Column - Text Content */}
              <div>
                <h2 className={`text-5xl md:text-6xl lg:text-7xl font-bold mb-6 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Powering{' '}
                  <span className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] bg-clip-text text-transparent">
                    Multi-Chain Yields
                  </span>
                  <br />
                  & Validator Rewards
                </h2>
                <p className={`text-xl md:text-2xl mb-8 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Earn secure on-chain yields through virtual validator nodes, staking strategies, and transaction reward optimization across leading blockchains.
                </p>
                <div className="flex flex-wrap gap-4 mb-8">
                  <span className={`px-4 py-2 rounded-lg font-semibold ${
                    theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    ✔ Ethereum
                  </span>
                  <span className={`px-4 py-2 rounded-lg font-semibold ${
                    theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    ✔ Binance Smart Chain
                  </span>
                  <span className={`px-4 py-2 rounded-lg font-semibold ${
                    theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    ✔ Solana
                  </span>
                  <span className={`px-4 py-2 rounded-lg font-semibold ${
                    theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    ✔ TRON
                  </span>
                </div>
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
                        <span className="relative z-10">Start Earning</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      </Link>
                      <Link
                        to="/signup"
                        className={`px-8 py-4 rounded-xl font-bold text-lg border-2 transition-all duration-300 hover:scale-105 ${
                          theme === 'dark'
                            ? 'border-gray-600 text-gray-300 hover:border-[#667eea] hover:text-white hover:bg-gray-800'
                            : 'border-gray-300 text-gray-700 hover:border-[#667eea] hover:text-[#667eea] hover:bg-gray-50'
                        }`}
                      >
                        Deploy Capital
                      </Link>
                      <Link
                        to="/signup"
                        className={`px-8 py-4 rounded-xl font-bold text-lg border-2 transition-all duration-300 hover:scale-105 ${
                          theme === 'dark'
                            ? 'border-gray-600 text-gray-300 hover:border-[#667eea] hover:text-white hover:bg-gray-800'
                            : 'border-gray-300 text-gray-700 hover:border-[#667eea] hover:text-[#667eea] hover:bg-gray-50'
                        }`}
                      >
                        Scale Securely
                      </Link>
                    </>
                  )}
                </div>
              </div>
              
              {/* Right Column - Main Image */}
              <div className="relative">
                <div className={`rounded-3xl overflow-hidden`}>
                  <div className="aspect-square flex items-center justify-center p-8">
                    {/* Main hero image - Replace src with your image path */}
                    <img
                      src={img}
                      alt="CAVI Multi-Chain Yields & Validator Rewards Platform"
                      className="w-full"
                      onError={(e) => {
                        // Fallback to gradient background if image fails to load
                        e.target.style.display = 'none'
                        e.target.parentElement.className = `aspect-square flex items-center justify-center p-8 rounded-2xl ${
                          theme === 'dark' ? 'bg-gradient-to-br from-[#667eea]/30 to-[#764ba2]/30' : 'bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20'
                        }`
                        const fallback = document.createElement('div')
                        fallback.className = 'text-center'
                        fallback.innerHTML = `
                          <div class="text-9xl mb-4">⚡</div>
                          <div class="text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}">
                            Multi-Chain Yields
                          </div>
                        `
                        e.target.parentElement.appendChild(fallback)
                      }}
                    />
                  </div>
                </div>
                {/* Decorative gradient overlay */}
                <div className="absolute -z-10 top-8 left-8 w-full h-full rounded-3xl bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 blur-3xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Do Section */}
        <section className={`py-20 px-4 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className={`text-4xl md:text-5xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                WHAT WE DO
              </h3>
              <p className={`text-2xl font-semibold mb-6 max-w-3xl mx-auto ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                One Platform. Multiple Blockchains. Continuous Yield.
              </p>
              <p className={`text-lg max-w-3xl mx-auto ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                We provide a unified platform that enables users to earn sustainable yields by participating in virtual validator services, native staking, and transaction reward mechanisms across multiple blockchains — without managing complex node infrastructure.
              </p>
              <p className={`text-lg max-w-3xl mx-auto mt-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Your assets stay on-chain. Rewards are distributed transparently.
              </p>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className={`text-4xl md:text-5xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                CORE FEATURES
              </h3>
            </div>
            <div className="space-y-12">
              {/* Multi-Chain Compatibility */}
              <div className={`p-8 rounded-2xl border transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">🔗</div>
                  <div className="flex-1">
                    <h4 className={`text-2xl font-bold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Multi-Chain Compatibility
                    </h4>
                    <p className={`text-lg mb-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Operate seamlessly across:
                    </p>
                    <ul className={`space-y-2 mb-4 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <li>• Ethereum (ETH & ERC-20)</li>
                      <li>• Binance Smart Chain (BNB & BEP-20)</li>
                      <li>• Solana (SOL & SPL)</li>
                      <li>• TRON (TRX & TRC-20)</li>
                    </ul>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      One dashboard. One wallet. Multiple ecosystems.
                    </p>
                  </div>
                </div>
              </div>

              {/* Virtual Validator Node Services */}
              <div className={`p-8 rounded-2xl border transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">⚙️</div>
                  <div className="flex-1">
                    <h4 className={`text-2xl font-bold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Virtual Validator Node Services
                    </h4>
                    <p className={`text-lg mb-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Access validator-level rewards without running physical infrastructure.
                    </p>
                    <ul className={`space-y-2 mb-4 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <li>• Stake using native or stable tokens</li>
                      <li>• Participate in consensus & transaction validation pools</li>
                      <li>• Earn proportional validator rewards</li>
                      <li>• Auto-compounding options available</li>
                    </ul>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Ideal for users seeking validator exposure without hardware or DevOps overhead.
                    </p>
                  </div>
                </div>
              </div>

              {/* Yield Optimization Engine */}
              <div className={`p-8 rounded-2xl border transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">📈</div>
                  <div className="flex-1">
                    <h4 className={`text-2xl font-bold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Yield Optimization Engine
                    </h4>
                    <p className={`text-lg mb-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Our smart routing system allocates capital across:
                    </p>
                    <ul className={`space-y-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <li>• Native staking</li>
                      <li>• Validator reward pools</li>
                      <li>• Network transaction incentives</li>
                    </ul>
                    <p className={`text-sm mt-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Maximize yield while maintaining protocol-level security and decentralization.
                    </p>
                  </div>
                </div>
              </div>

              {/* Earn Transaction Rewards */}
              <div className={`p-8 rounded-2xl border transition-all duration-300 ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">💰</div>
                  <div className="flex-1">
                    <h4 className={`text-2xl font-bold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Earn Transaction Rewards
                    </h4>
                    <p className={`text-lg mb-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Participate in network activity and earn from:
                    </p>
                    <ul className={`space-y-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <li>• Block validation incentives</li>
                      <li>• Transaction fee sharing</li>
                      <li>• Network reward distributions</li>
                    </ul>
                    <p className={`text-sm mt-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Rewards are paid directly in native tokens or approved stable assets on the same chain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Assets Section */}
        <section className={`py-20 px-4 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h3 className={`text-4xl md:text-5xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                SUPPORTED ASSETS
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={`p-8 rounded-2xl border ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <h4 className={`text-xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Native Tokens
                </h4>
                <p className={`text-2xl font-semibold ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  ETH • BNB • SOL • TRX
                </p>
              </div>
              <div className={`p-8 rounded-2xl border ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <h4 className={`text-xl font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Stable Tokens
                </h4>
                <p className={`text-2xl font-semibold ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  USDT • USDC (Chain-specific)
                </p>
              </div>
            </div>
            <p className={`text-center mt-8 text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Assets remain on their native chain — no forced wrapping or unnecessary bridging.
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className={`text-4xl md:text-5xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                HOW IT WORKS
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-bold ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                    : 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                }`}>
                  1️⃣
                </div>
                <h4 className={`text-xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Connect Your Wallet
                </h4>
                <p className={`${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Use MetaMask, Trust Wallet, Phantom, or WalletConnect.
                </p>
              </div>
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-bold ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                    : 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                }`}>
                  2️⃣
                </div>
                <h4 className={`text-xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Choose Network & Strategy
                </h4>
                <p className={`${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Select Ethereum, BSC, Solana, or TRON and your preferred earning model.
                </p>
              </div>
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-bold ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                    : 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                }`}>
                  3️⃣
                </div>
                <h4 className={`text-xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Stake or Allocate Capital
                </h4>
                <p className={`${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Deploy funds into validator services or yield pools.
                </p>
              </div>
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-bold ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                    : 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
                }`}>
                  4️⃣
                </div>
                <h4 className={`text-xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Earn & Track Rewards
                </h4>
                <p className={`${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Monitor real-time rewards, APR, and transaction earnings from your dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Transparency Section */}
        <section className={`py-20 px-4 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className={`text-4xl md:text-5xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                SECURITY & TRANSPARENCY
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className={`p-8 rounded-2xl border text-center ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="text-5xl mb-4">🔒</div>
                <h4 className={`text-xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Non-Custodial Architecture
                </h4>
                <p className={`${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Funds remain in smart contracts governed by protocol logic.
                </p>
              </div>
              <div className={`p-8 rounded-2xl border text-center ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="text-5xl mb-4">🔍</div>
                <h4 className={`text-xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  On-Chain Verifiability
                </h4>
                <p className={`${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  All transactions, rewards, and validator activity are publicly verifiable.
                </p>
              </div>
              <div className={`p-8 rounded-2xl border text-center ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="text-5xl mb-4">🛡</div>
                <h4 className={`text-xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Network-Level Security
                </h4>
                <p className={`${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Built directly on Ethereum, BSC, Solana, and TRON consensus mechanisms.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className={`text-4xl md:text-5xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                USE CASES
              </h3>
            </div>
            <div className={`p-8 rounded-2xl border ${
              theme === 'dark'
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <ul className={`space-y-3 text-lg ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <li>• Passive income through blockchain validation</li>
                <li>• Validator exposure without running nodes</li>
                <li>• Stable-yield strategies using network rewards</li>
                <li>• Multi-chain portfolio yield management</li>
                <li>• Web3 funds & professional stakers</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className={`py-20 px-4 ${theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className={`text-4xl md:text-5xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                WHY CHOOSE US
              </h3>
            </div>
            <div className={`p-8 rounded-2xl border ${
              theme === 'dark'
                ? 'bg-gray-800/50 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <ul className={`space-y-3 text-lg ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <li>✔ Multi-Chain Native Support</li>
                <li>✔ Validator-Grade Rewards</li>
                <li>✔ No Hardware or Node Management</li>
                <li>✔ Transparent On-Chain Earnings</li>
                <li>✔ Designed for Individuals & Institutions</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Supported Blockchains Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h3 className={`text-4xl md:text-5xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Supported Blockchains
              </h3>
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

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className={`text-4xl md:text-5xl font-bold mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Ready to Start Earning?
            </h3>
            <p className={`text-xl mb-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              CAVI – One Platform. Multiple Blockchains. Real Yield
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
