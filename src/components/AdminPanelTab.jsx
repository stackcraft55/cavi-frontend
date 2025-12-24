import { useState, useEffect } from 'react'
import { createdWalletAPI } from '../api/api'
import { getNativeBalance } from '../utils/alchemyTransactions'
import { getUSDCUSDTBalances } from '../utils/tokenBalances'

export default function AdminPanelTab({ theme = 'dark' }) {
  const [wallets, setWallets] = useState([])
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingBalances, setLoadingBalances] = useState(false)
  const [walletBalances, setWalletBalances] = useState(null)
  const [filterBlockchain, setFilterBlockchain] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch all created wallets
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setLoading(true)
        const response = await createdWalletAPI.getAllCreatedWalletsAdmin({ limit: 1000 })
        if (response.wallets) {
          setWallets(response.wallets)
        }
      } catch (error) {
        console.error('Error fetching wallets:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchWallets()
  }, [])

  // Fetch balances when wallet is selected
  useEffect(() => {
    const fetchBalances = async () => {
      if (!selectedWallet) {
        setWalletBalances(null)
        return
      }

      setLoadingBalances(true)
      try {
        const blockchain = selectedWallet.blockchain
        const [nativeBalance, tokenBalances] = await Promise.all([
          getNativeBalance(selectedWallet.address, blockchain),
          getUSDCUSDTBalances(selectedWallet.address, blockchain)
        ])

        const nativeSymbol = getNativeSymbol(blockchain)
        setWalletBalances({
          native: { balance: nativeBalance, symbol: nativeSymbol },
          usdc: tokenBalances.USDC || '0',
          usdt: tokenBalances.USDT || '0'
        })
      } catch (error) {
        console.error('Error fetching balances:', error)
        setWalletBalances(null)
      } finally {
        setLoadingBalances(false)
      }
    }

    fetchBalances()
  }, [selectedWallet])

  const getNativeSymbol = (blockchain) => {
    switch (blockchain) {
      case 'ethereum': return 'ETH'
      case 'bsc': return 'BNB'
      case 'tron': return 'TRX'
      case 'solana': return 'SOL'
      default: return 'TOKEN'
    }
  }

  const formatBlockchain = (blockchain) => {
    return blockchain.charAt(0).toUpperCase() + blockchain.slice(1).toUpperCase()
  }

  const filteredWallets = wallets.filter(wallet => {
    // Filter by blockchain
    const matchesBlockchain = filterBlockchain === 'all' || wallet.blockchain === filterBlockchain
    
    // Filter by search query (address, user email, user name)
    const matchesSearch = !searchQuery || 
      wallet.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wallet.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesBlockchain && matchesSearch
  })

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  return (
    <div className={`h-full flex flex-col ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
      <div className="flex gap-4 h-full">
        {/* Left Sidebar - Wallet List */}
        <div className={`w-80 flex flex-col border-r ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
        }`}>
          <div className={`p-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
          }`}>
            <h2 className="text-xl font-bold mb-3">All Wallets (Wallet B)</h2>
            
            {/* Search Field */}
            <div className="mb-3">
              <label className={`text-sm font-semibold mb-2 block ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Search:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by address, email, or name..."
                  className={`w-full px-3 py-2 pl-10 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-[#667eea]`}
                />
                <svg 
                  className={`absolute left-3 top-2.5 w-5 h-5 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-2.5 ${
                      theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {/* Filter by Blockchain */}
            <div className="mb-3">
              <label className={`text-sm font-semibold mb-2 block ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Filter by Blockchain:
              </label>
              <select
                value={filterBlockchain}
                onChange={(e) => setFilterBlockchain(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-800'
                } focus:outline-none focus:ring-2 focus:ring-[#667eea]`}
              >
                <option value="all">All Blockchains</option>
                <option value="ethereum">Ethereum</option>
                <option value="bsc">BSC</option>
                <option value="tron">Tron</option>
                <option value="solana">Solana</option>
              </select>
            </div>

            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Total: {filteredWallets.length} wallets
            </div>
          </div>

          {/* Wallet List */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#667eea] mx-auto"></div>
                <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading wallets...
                </p>
              </div>
            ) : filteredWallets.length === 0 ? (
              <div className={`text-center py-8 text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                No wallets found
              </div>
            ) : (
              filteredWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => setSelectedWallet(wallet)}
                  className={`w-full text-left p-3 mb-2 rounded-lg transition-all duration-200 ${
                    selectedWallet?.id === wallet.id
                      ? theme === 'dark'
                        ? 'bg-[#667eea]/20 border border-[#667eea]/50'
                        : 'bg-[#667eea]/10 border border-[#667eea]/30'
                      : theme === 'dark'
                        ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      wallet.blockchain === 'ethereum'
                        ? 'bg-blue-500/20 text-blue-300'
                        : wallet.blockchain === 'bsc'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : wallet.blockchain === 'tron'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-purple-500/20 text-purple-300'
                    }`}>
                      {formatBlockchain(wallet.blockchain)}
                    </span>
                  </div>
                  <div className={`text-sm font-mono truncate ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {wallet.address}
                  </div>
                  {wallet.user && (
                    <div className={`text-xs mt-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      User: {wallet.user.name || wallet.user.email}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side - Wallet Details */}
        <div className="flex-1 p-6 overflow-y-auto">
          {selectedWallet ? (
            <div>
              <h2 className="text-2xl font-bold mb-6">Wallet Details</h2>

              {/* Blockchain Badge */}
              <div className="mb-6">
                <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
                  selectedWallet.blockchain === 'ethereum'
                    ? 'bg-blue-500/20 text-blue-300'
                    : selectedWallet.blockchain === 'bsc'
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : selectedWallet.blockchain === 'tron'
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {formatBlockchain(selectedWallet.blockchain)}
                </span>
              </div>

              {/* Address */}
              <div className={`mb-6 p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <label className={`text-sm font-semibold mb-2 block ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Address
                </label>
                <div className="flex items-center gap-2">
                  <code className={`flex-1 font-mono text-sm break-all ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {selectedWallet.address}
                  </code>
                  <button
                    onClick={() => copyToClipboard(selectedWallet.address)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Private Key */}
              <div className={`mb-6 p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <label className={`text-sm font-semibold mb-2 block ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Private Key
                </label>
                <div className="flex items-center gap-2">
                  <code className={`flex-1 font-mono text-sm break-all ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {selectedWallet.privateKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(selectedWallet.privateKey)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* User Info */}
              {selectedWallet.user && (
                <div className={`mb-6 p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <label className={`text-sm font-semibold mb-2 block ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    User
                  </label>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    <div>Name: {selectedWallet.user.name || 'N/A'}</div>
                    <div>Email: {selectedWallet.user.email || 'N/A'}</div>
                  </div>
                </div>
              )}

              {/* Balances */}
              <div className={`mb-6 p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <label className={`text-sm font-semibold mb-3 block ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Balances
                </label>
                {loadingBalances ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#667eea] mx-auto"></div>
                    <p className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Loading balances...
                    </p>
                  </div>
                ) : walletBalances ? (
                  <div className="space-y-3">
                    {/* Native Token */}
                    <div className={`flex justify-between items-center p-3 rounded ${
                      theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-200/50'
                    }`}>
                      <span className={`text-sm font-semibold ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {walletBalances.native.symbol}
                      </span>
                      <span className={`text-sm font-mono ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {walletBalances.native.balance}
                      </span>
                    </div>

                    {/* USDC */}
                    <div className={`flex justify-between items-center p-3 rounded ${
                      theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-200/50'
                    }`}>
                      <span className={`text-sm font-semibold ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        USDC
                      </span>
                      <span className={`text-sm font-mono ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {walletBalances.usdc}
                      </span>
                    </div>

                    {/* USDT */}
                    <div className={`flex justify-between items-center p-3 rounded ${
                      theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-200/50'
                    }`}>
                      <span className={`text-sm font-semibold ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        USDT
                      </span>
                      <span className={`text-sm font-mono ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {walletBalances.usdt}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={`text-sm text-center py-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Failed to load balances
                  </div>
                )}
              </div>

              {/* Created Date */}
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <label className={`text-sm font-semibold mb-2 block ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Created At
                </label>
                <div className={`text-sm ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {new Date(selectedWallet.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <div className={`text-center py-16 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-lg">Select a wallet to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

