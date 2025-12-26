import { useState, useEffect } from 'react'
import { useWalletContext } from '../contexts/WalletContext'
import { createdWalletAPI, connectedWalletAPI, withdrawAPI } from '../api/api'
import { networkToBlockchain } from '../utils/tokenContracts'
import { getNativeBalance, getTransactionHistory, getTokenBalances } from '../utils/alchemyTransactions'

export default function TrackTab({ theme = 'dark', setActiveTab }) {
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [selectedWalletType, setSelectedWalletType] = useState(null) // 'A' or 'B'
  const [searchA, setSearchA] = useState('')
  const [searchB, setSearchB] = useState('')
  const [walletsA, setWalletsA] = useState([])
  const [walletsB, setWalletsB] = useState([])
  const [transactions, setTransactions] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [walletCount, setWalletCount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loadingWallets, setLoadingWallets] = useState(true)
  const [renamingWallet, setRenamingWallet] = useState(null)
  const [newWalletName, setNewWalletName] = useState('')
  const { activeNetwork } = useWalletContext()

  // Fetch connected wallets (Wallet A) from backend, filtered by active network
  useEffect(() => {
    const fetchConnectedWallets = async () => {
      setLoadingWallets(true)
      try {
        // Map network name to blockchain name
        const blockchain = networkToBlockchain[activeNetwork] || 'ethereum'
        console.log('Fetching connected wallets for blockchain:', blockchain, 'from network:', activeNetwork)
        
        const response = await connectedWalletAPI.getAllWallets({ blockchain })
        if (response.wallets && response.wallets.length > 0) {
          // Transform backend wallets to frontend format
          const transformedWallets = await Promise.all(
            response.wallets.map(async (wallet, index) => {
              const walletName = wallet.note || `Connected Wallet ${index + 1}`
              
              // Fetch balance using Alchemy
              let balanceDisplay = '0.00'
              try {
                const nativeBalance = await getNativeBalance(wallet.address, blockchain)
                const symbol = blockchain === 'ethereum' ? 'ETH' : blockchain === 'bsc' ? 'BNB' : blockchain === 'solana' ? 'SOL' : blockchain === 'tron' ? 'TRX' : ''
                balanceDisplay = `${nativeBalance} ${symbol}`
              } catch (err) {
                console.error('Error fetching balance for wallet:', wallet.address, err)
              }
              
              return {
                id: wallet.id || wallet._id,
                name: walletName,
                address: wallet.address,
                balance: balanceDisplay,
                blockchain: wallet.blockchain
              }
            })
          )
          setWalletsA(transformedWallets)
        } else {
          setWalletsA([])
        }
      } catch (err) {
        console.error('Error fetching connected wallets:', err)
        setWalletsA([])
      } finally {
        setLoadingWallets(false)
      }
    }
    
    fetchConnectedWallets()
  }, [activeNetwork])

  // Fetch created wallets (Wallet B) from backend, filtered by active network
  useEffect(() => {
    const fetchCreatedWallets = async () => {
      try {
        // Map network name to blockchain name
        const blockchain = networkToBlockchain[activeNetwork] || 'ethereum'
        console.log('Fetching created wallets for blockchain:', blockchain, 'from network:', activeNetwork)
        
        const response = await createdWalletAPI.getAllCreatedWallets({ blockchain })
        if (response.wallets && response.wallets.length > 0) {
          // Transform backend wallets to frontend format
          const walletNames = ['Business', 'Operations', 'Development', 'Marketing', 'Reserve', 'Staking', 'Trading', 'Savings', 'Investment', 'Personal']
          const transformedWallets = await Promise.all(
            response.wallets.map(async (wallet, index) => {
              // Use note if available, otherwise generate default name
              const walletName = wallet.note || (walletNames[index % walletNames.length] + ` Wallet ${index + 1}`)
              const createdDate = new Date(wallet.createdAt).toISOString().split('T')[0]
              
              // Fetch balance using Alchemy
              let balanceDisplay = '0.00'
              try {
                const nativeBalance = await getNativeBalance(wallet.address, blockchain)
                const symbol = blockchain === 'ethereum' ? 'ETH' : blockchain === 'bsc' ? 'BNB' : blockchain === 'solana' ? 'SOL' : blockchain === 'tron' ? 'TRX' : ''
                balanceDisplay = `${nativeBalance} ${symbol}`
              } catch (err) {
                console.error('Error fetching balance for wallet:', wallet.address, err)
              }
              
              return {
                id: wallet.id || wallet._id,
                name: walletName,
                address: wallet.address,
                balance: balanceDisplay,
                createdDate: createdDate
              }
            })
          )
          setWalletsB(transformedWallets)
        } else {
          setWalletsB([])
        }
      } catch (err) {
        console.error('Error fetching created wallets:', err)
        setWalletsB([])
      }
    }
    
    fetchCreatedWallets()
  }, [activeNetwork])

  // Fetch transactions when wallet is selected using Alchemy
  useEffect(() => {
    const fetchTransactions = async () => {
      if (selectedWallet) {
        try {
          const blockchain = networkToBlockchain[activeNetwork] || 'ethereum'
          console.log('Fetching transactions for wallet:', selectedWallet.address, 'on blockchain:', blockchain)
          
          // Fetch transactions using Alchemy
          const txHistory = await getTransactionHistory(selectedWallet.address, blockchain, 20)
          setTransactions(txHistory)
          
          // Also update balance for selected wallet
          try {
            const nativeBalance = await getNativeBalance(selectedWallet.address, blockchain)
            const symbol = blockchain === 'ethereum' ? 'ETH' : blockchain === 'bsc' ? 'BNB' : blockchain === 'solana' ? 'SOL' : blockchain === 'tron' ? 'TRX' : ''
            const balanceDisplay = `${nativeBalance} ${symbol}`
            
            // Update balance in wallets list first
            setWalletsA(prev => prev.map(w => 
              w.id === selectedWallet.id ? { ...w, balance: balanceDisplay } : w
            ))
            setWalletsB(prev => prev.map(w => 
              w.id === selectedWallet.id ? { ...w, balance: balanceDisplay } : w
            ))
            
            // Update selectedWallet balance only if it's different to prevent infinite loop
            setSelectedWallet(prev => {
              if (prev && prev.balance !== balanceDisplay) {
                return { ...prev, balance: balanceDisplay }
              }
              return prev
            })
          } catch (err) {
            console.error('Error updating balance:', err)
          }
        } catch (err) {
          console.error('Error fetching transactions:', err)
          setTransactions([])
        }
      } else {
        setTransactions([])
      }
    }
    
    fetchTransactions()
    // Only depend on selectedWallet.id and address, not the entire object to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWallet?.id, selectedWallet?.address, activeNetwork])

  // Fetch withdrawals when wallet is selected
  useEffect(() => {
    const fetchWithdrawals = async () => {
      if (selectedWallet && selectedWallet.address) {
        setLoadingWithdrawals(true)
        try {
          const blockchain = networkToBlockchain[activeNetwork] || 'ethereum'
          console.log('Fetching withdrawals for wallet:', selectedWallet.address, 'on blockchain:', blockchain)
          
          const response = await withdrawAPI.getWithdrawals({
            walletAddress: selectedWallet.address,
            blockchain
          })
          
          if (response.withdrawals) {
            setWithdrawals(response.withdrawals)
          } else {
            setWithdrawals([])
          }
        } catch (err) {
          console.error('Error fetching withdrawals:', err)
          setWithdrawals([])
        } finally {
          setLoadingWithdrawals(false)
        }
      } else {
        setWithdrawals([])
      }
    }
    
    fetchWithdrawals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWallet?.id, selectedWallet?.address, activeNetwork])

  const filteredWalletsA = walletsA.filter(wallet =>
    wallet.address.toLowerCase().includes(searchA.toLowerCase()) ||
    wallet.name.toLowerCase().includes(searchA.toLowerCase())
  )

  const filteredWalletsB = walletsB.filter(wallet =>
    wallet.address.toLowerCase().includes(searchB.toLowerCase()) ||
    wallet.name.toLowerCase().includes(searchB.toLowerCase())
  )

  const handleWalletSelect = (wallet, walletType) => {
    setSelectedWallet(wallet)
    setSelectedWalletType(walletType) // 'A' or 'B'
  }

  const handleRenameClick = (e, wallet, walletType) => {
    e.stopPropagation()
    setRenamingWallet({ id: wallet.id, type: walletType, currentName: wallet.name })
    setNewWalletName(wallet.name)
  }

  const handleRenameSubmit = async (e, walletId, walletType) => {
    e.stopPropagation()
    if (!newWalletName.trim()) {
      return
    }

    try {
      if (walletType === 'A') {
        // Update connected wallet note
        await connectedWalletAPI.updateConnectedWalletNote(walletId, newWalletName.trim())
        setWalletsA(prev => prev.map(w => 
          w.id === walletId ? { ...w, name: newWalletName.trim() } : w
        ))
        if (selectedWallet?.id === walletId) {
          setSelectedWallet({ ...selectedWallet, name: newWalletName.trim() })
        }
      } else if (walletType === 'B') {
        // Update created wallet note
        await createdWalletAPI.updateCreatedWalletNote(walletId, newWalletName.trim())
        setWalletsB(prev => prev.map(w => 
          w.id === walletId ? { ...w, name: newWalletName.trim() } : w
        ))
        if (selectedWallet?.id === walletId) {
          setSelectedWallet({ ...selectedWallet, name: newWalletName.trim() })
        }
      }
      setRenamingWallet(null)
      setNewWalletName('')
    } catch (error) {
      console.error('Error renaming wallet:', error)
      alert('Failed to rename wallet. Please try again.')
    }
  }

  const handleRenameCancel = (e) => {
    e.stopPropagation()
    setRenamingWallet(null)
    setNewWalletName('')
  }

  const generateRandomAddress = () => {
    const chars = '0123456789abcdef'
    return '0x' + Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  const handleCreateWallet = async () => {
    const count = parseInt(walletCount)
    if (!count || count <= 0 || count > 100) {
      setError('Please enter a number between 1 and 100')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Map network name to blockchain name
      const blockchainMap = {
        'Ether': 'ethereum',
        'BSC': 'bsc',
        'Tron': 'tron',
        'Solana': 'solana'
      }
      
      const blockchain = blockchainMap[activeNetwork] || networkToBlockchain[activeNetwork] || 'ethereum'
      
      // Call backend API to create wallets
      const response = await createdWalletAPI.createWallets(blockchain, count)
      
      // Transform created wallets to frontend format
      const walletNames = ['Business', 'Operations', 'Development', 'Marketing', 'Reserve', 'Staking', 'Trading', 'Savings', 'Investment', 'Personal']
      const newWallets = response.wallets.map((wallet, index) => {
        const randomName = walletNames[index % walletNames.length] + ` Wallet ${walletsB.length + index + 1}`
        const createdDate = new Date(wallet.createdAt).toISOString().split('T')[0]
        
        return {
          id: wallet.id,
          name: randomName,
          address: wallet.address,
          balance: '0.00 ETH', // Default balance
          createdDate: createdDate
        }
      })
      
      // Add new wallets to the list
      setWalletsB([...walletsB, ...newWallets])
      setSuccess(`Successfully created ${response.count} wallet(s) on ${activeNetwork}`)
      setWalletCount('')
      
      // Refresh wallets list from backend (filtered by active network)
      // blockchain is already declared above, reuse it
      const refreshResponse = await createdWalletAPI.getAllCreatedWallets({ blockchain })
      if (refreshResponse.wallets && refreshResponse.wallets.length > 0) {
        const walletNames = ['Business', 'Operations', 'Development', 'Marketing', 'Reserve', 'Staking', 'Trading', 'Savings', 'Investment', 'Personal']
        const refreshedWallets = refreshResponse.wallets.map((wallet, index) => {
          const randomName = walletNames[index % walletNames.length] + ` Wallet ${index + 1}`
          const createdDate = new Date(wallet.createdAt).toISOString().split('T')[0]
          
          return {
            id: wallet.id || wallet._id,
            name: randomName,
            address: wallet.address,
            balance: '0.00 ETH',
            createdDate: createdDate
          }
        })
        setWalletsB(refreshedWallets)
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowCreateModal(false)
        setSuccess(null)
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to create wallets. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr] gap-6 mx-auto h-full">
      {/* Wallet A Panel */}
      <div className={`rounded-3xl shadow-2xl flex flex-col overflow-hidden hover:shadow-glow transition-all duration-300 h-full ${
        theme === 'dark' ? 'bg-gray-800 border border-gray-700/50' : 'bg-white border border-gray-200/50'
      }`}>
        <div className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white px-6 py-6 border-b border-white/20 relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse"></div>
          <div className="flex justify-between items-center relative z-10">
            <h2 className="text-xl font-bold m-0 drop-shadow-md">Wallet A</h2>
            <button
              onClick={() => setActiveTab('wallets')}
              className="px-4 py-2 bg-white/25 hover:bg-white/40 backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 border border-white/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Connect Wallet
            </button>
          </div>
        </div>
        <div className={`p-6 border-b flex-shrink-0 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
          <input
            type="text"
            placeholder="Search wallet..."
            value={searchA}
            onChange={(e) => setSearchA(e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 shadow-sm hover:shadow-md ${
              theme === 'dark' 
                ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-0">
          {loadingWallets ? (
            <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>Loading wallets...</p>
            </div>
          ) : filteredWalletsA.length === 0 ? (
            <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>No connected wallets. Click "Connect Wallet" to add one.</p>
            </div>
          ) : (
            filteredWalletsA.map(wallet => (
            <div
              key={wallet.id}
              className={`p-4 m-2 rounded-2xl cursor-pointer transition-all duration-300 border-2 flex justify-between items-center group ${
                selectedWallet?.id === wallet.id
                  ? 'bg-gradient-to-r from-[#667eea]/15 to-[#764ba2]/15 border-[#667eea] shadow-lg translate-x-1 scale-[1.02]'
                  : theme === 'dark'
                    ? 'border-gray-700/50 hover:bg-gray-700/50 hover:border-[#667eea]/50 hover:shadow-md hover:translate-x-1'
                    : 'border-gray-200/50 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 hover:border-[#667eea]/50 hover:shadow-md hover:translate-x-1'
              }`}
              onClick={() => handleWalletSelect(wallet, 'A')}
            >
              <div className="flex-1">
                {renamingWallet?.id === wallet.id && renamingWallet?.type === 'A' ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={newWalletName}
                      onChange={(e) => setNewWalletName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameSubmit(e, wallet.id, 'A')
                        } else if (e.key === 'Escape') {
                          handleRenameCancel(e)
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`flex-1 px-2 py-1 text-sm rounded border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-800'
                      } focus:outline-none focus:ring-2 focus:ring-[#667eea]`}
                      autoFocus
                    />
                    <button
                      onClick={(e) => handleRenameSubmit(e, wallet.id, 'A')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        theme === 'dark'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      ✓
                    </button>
                    <button
                      onClick={(e) => handleRenameCancel(e)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        theme === 'dark'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className={`font-bold mb-1 text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                    <span>{wallet.name}</span>
                    <button
                      onClick={(e) => handleRenameClick(e, wallet, 'A')}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-600/50 ${
                        theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title="Rename wallet"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                )}
                <div className={`text-xs font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}</div>
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* Wallet B Panel */}
      <div className={`rounded-3xl shadow-2xl flex flex-col overflow-hidden hover:shadow-glow transition-all duration-300 h-full ${
        theme === 'dark' ? 'bg-gray-800 border border-gray-700/50' : 'bg-white border border-gray-200/50'
      }`}>
        <div className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white px-6 py-6 border-b border-white/20 flex justify-between items-center relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse"></div>
          <h2 className="text-xl font-bold m-0 relative z-10 drop-shadow-md">Wallet B</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-white/25 hover:bg-white/40 backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 relative z-10 border border-white/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Wallet
          </button>
        </div>
        <div className={`p-6 border-b flex-shrink-0 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
          <input
            type="text"
            placeholder="Search wallet..."
            value={searchB}
            onChange={(e) => setSearchB(e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 shadow-sm hover:shadow-md ${
              theme === 'dark' 
                ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-0">
          {filteredWalletsB.length === 0 ? (
            <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>No created wallets. Click "Create Wallet" to add one.</p>
            </div>
          ) : (
            filteredWalletsB.map(wallet => (
            <div
              key={wallet.id}
              className={`p-4 m-2 rounded-xl cursor-pointer transition-all duration-300 border-2 flex justify-between items-center group ${
                selectedWallet?.id === wallet.id
                  ? 'bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10 border-[#667eea] translate-x-1'
                  : theme === 'dark'
                    ? 'border-transparent hover:bg-gray-700/50 hover:translate-x-1'
                    : 'border-transparent hover:bg-gray-50 hover:translate-x-1'
              }`}
              onClick={() => handleWalletSelect(wallet, 'B')}
            >
              <div className="flex-1">
                {renamingWallet?.id === wallet.id && renamingWallet?.type === 'B' ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={newWalletName}
                      onChange={(e) => setNewWalletName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameSubmit(e, wallet.id, 'B')
                        } else if (e.key === 'Escape') {
                          handleRenameCancel(e)
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`flex-1 px-2 py-1 text-sm rounded border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-800'
                      } focus:outline-none focus:ring-2 focus:ring-[#667eea]`}
                      autoFocus
                    />
                    <button
                      onClick={(e) => handleRenameSubmit(e, wallet.id, 'B')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        theme === 'dark'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      ✓
                    </button>
                    <button
                      onClick={(e) => handleRenameCancel(e)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        theme === 'dark'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className={`font-semibold mb-1 text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                    <span>{wallet.name}</span>
                    <button
                      onClick={(e) => handleRenameClick(e, wallet, 'B')}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-600/50 ${
                        theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title="Rename wallet"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                )}
                <div className={`text-xs font-mono mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}</div>
                {wallet.createdDate && (
                  <div className={`text-xs flex items-center gap-1 mt-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Created: {wallet.createdDate}
                  </div>
                )}
              </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* Transactions Panel */}
      <div className={`rounded-3xl shadow-2xl border flex flex-col overflow-hidden hover:shadow-glow transition-all duration-300 h-full ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200/50'
      }`}>
        <div className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white px-6 py-6 border-b border-white/20 relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse"></div>
          <h2 className="text-xl font-bold m-0 relative z-10 drop-shadow-md">Transactions</h2>
        </div>
        {selectedWallet ? (
          <div className={`p-6 border-b flex-shrink-0 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{selectedWallet.name}</div>
            <div className={`text-sm font-mono mb-2 break-all px-3 py-2 rounded-lg border ${
              theme === 'dark' 
                ? 'text-gray-300 bg-gray-700/50 border-gray-600' 
                : 'text-gray-600 bg-gray-50 border-gray-200'
            }`}>{selectedWallet.address}</div>
            <div className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2]">Balance: {selectedWallet.balance}</div>
          </div>
        ) : (
          <div className={`p-12 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            <p>Select a wallet to view transactions</p>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0">
          {loadingWithdrawals ? (
            <div className={`p-12 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#667eea]"></div>
              <p className="mt-2">Loading withdrawals...</p>
            </div>
          ) : selectedWallet && withdrawals.length > 0 ? (
            <div className="space-y-3">
              {withdrawals.map(withdrawal => {
                const isFromWallet = withdrawal.fromWalletAddress.toLowerCase() === selectedWallet.address.toLowerCase()
                const otherAddress = isFromWallet ? withdrawal.toWalletAddress : withdrawal.fromWalletAddress
                const date = new Date(withdrawal.createdAt)
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
                
                return (
                  <div key={withdrawal._id || withdrawal.id} className={`p-4 rounded-2xl border flex items-start gap-4 transition-all duration-300 hover:shadow-lg hover:translate-x-1 hover:scale-[1.01] ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-700/30 to-purple-700/30 border-blue-600/50 hover:from-blue-700/40 hover:to-purple-700/40'
                      : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50 hover:from-blue-100 hover:to-purple-100'
                  }`}>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg">
                      {isFromWallet ? '↓' : '↑'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                          {withdrawal.amount} {withdrawal.tokenType}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${theme === 'dark' ? 'bg-blue-600/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                          WITHDRAWAL
                        </span>
                      </div>
                      <div className={`text-xs font-mono mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {isFromWallet ? `To: ${otherAddress.slice(0, 10)}...${otherAddress.slice(-8)}` : `From: ${otherAddress.slice(0, 10)}...${otherAddress.slice(-8)}`}
                      </div>
                      <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        TX: <span className="font-mono">{withdrawal.transactionHash.slice(0, 10)}...{withdrawal.transactionHash.slice(-8)}</span>
                      </div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{formattedDate}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex-shrink-0 shadow-sm ${
                      withdrawal.status === 'success' 
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                        : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                    }`}>
                      {withdrawal.status}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : selectedWallet ? (
            <div className={`p-12 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
              <p>No withdrawals found for this wallet</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Create Wallet Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in" onClick={() => setShowCreateModal(false)}>
          <div className={`rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 border animate-in zoom-in-95 ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">Create New Wallet</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                  Network
                </label>
                <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                    {activeNetwork || 'Ether'}
                  </div>
                  <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Wallets will be created on {activeNetwork || 'Ether'} network
                  </div>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Number of Wallets</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Enter number of wallets to create"
                  value={walletCount}
                  onChange={(e) => setWalletCount(e.target.value)}
                  disabled={loading}
                  className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-200 text-gray-800'
                  }`}
                />
                <p className={`text-xs mt-2 flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Enter a number between 1 and 100
                </p>
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
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setWalletCount('')
                }}
                className={`flex-1 px-4 py-3 border-2 rounded-xl font-semibold transition-all duration-300 shadow-sm hover:shadow-md ${
                  theme === 'dark'
                    ? 'border-gray-600 text-gray-200 hover:bg-gray-700/50'
                    : 'border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWallet}
                disabled={loading || !walletCount || parseInt(walletCount) <= 0 || parseInt(walletCount) > 100}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white rounded-xl font-semibold hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-[1.02] relative overflow-hidden group"
              >
                <span className="relative z-10">{loading ? 'Creating...' : 'Create Wallets'}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

