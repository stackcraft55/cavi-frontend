import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import TokenIcon from './TokenIcon'
import { createdWalletAPI, connectedWalletAPI, withdrawAPI } from '../api/api'
import { useWalletContext } from '../contexts/WalletContext'
import { networkToBlockchain } from '../utils/tokenContracts'
import { getUSDCUSDTBalances } from '../utils/tokenBalances'
import { getNativeBalance } from '../utils/alchemyTransactions'

export default function WithdrawTab({ theme = 'dark' }) {
  const [selectedWalletB, setSelectedWalletB] = useState(null)
  const [selectedWalletA, setSelectedWalletA] = useState(null)
  const [selectedTokens, setSelectedTokens] = useState({}) // { tokenId: { token, amount } }
  const [walletsB, setWalletsB] = useState([])
  const [walletsA, setWalletsA] = useState([])
  const [walletTokens, setWalletTokens] = useState([])
  const [walletABalances, setWalletABalances] = useState(null) // Store balances for wallet A across all chains
  const [loadingWalletA, setLoadingWalletA] = useState(false)
  const [walletBNativeBalance, setWalletBNativeBalance] = useState(null) // Store native balance for wallet B
  const [loadingWalletB, setLoadingWalletB] = useState(false)
  const [searchB, setSearchB] = useState('')
  const [searchA, setSearchA] = useState('')
  const [showDropdownB, setShowDropdownB] = useState(false)
  const [showDropdownA, setShowDropdownA] = useState(false)
  const [loadingWallets, setLoadingWallets] = useState(true)
  const dropdownRefB = useRef(null)
  const dropdownRefA = useRef(null)
  const { activeNetwork } = useWalletContext()

  // Fetch created wallets (Wallet B) from backend, filtered by active network
  useEffect(() => {
    const fetchCreatedWallets = async () => {
      try {
        // Map network name to blockchain name
        const blockchain = networkToBlockchain[activeNetwork] || 'ethereum'
        
        const response = await createdWalletAPI.getAllCreatedWallets({ blockchain })
        if (response.wallets && response.wallets.length > 0) {
          const walletNames = ['Business', 'Operations', 'Development', 'Marketing', 'Reserve', 'Staking', 'Trading', 'Savings', 'Investment', 'Personal']
          const transformedWallets = response.wallets.map((wallet, index) => {
            // Use note if available, otherwise generate default name
            const walletName = wallet.note || (walletNames[index % walletNames.length] + ` Wallet ${index + 1}`)
            const createdDate = new Date(wallet.createdAt).toISOString().split('T')[0]
            
            return {
              id: wallet.id || wallet._id,
              name: walletName,
              address: wallet.address,
              balance: '0.00 ETH', // Default balance, can be fetched separately
              createdDate: createdDate
            }
          })
          setWalletsB(transformedWallets)
        } else {
          setWalletsB([])
        }
      } catch (err) {
        console.error('Error fetching created wallets:', err)
        setWalletsB([])
      } finally {
        setLoadingWallets(false)
      }
    }
    
    fetchCreatedWallets()
    
    // Listen for wallet rename events to refresh the list
    const handleWalletRename = () => {
      fetchCreatedWallets()
    }
    
    window.addEventListener('walletRenamed', handleWalletRename)
    
    return () => {
      window.removeEventListener('walletRenamed', handleWalletRename)
    }
  }, [activeNetwork])

  // Fetch connected wallets (Wallet A) from backend, filtered by active network
  // BSC and Ethereum share the same wallet, so fetch from both when either is active
  useEffect(() => {
    const fetchConnectedWallets = async () => {
      try {
        // Map network name to blockchain name
        const blockchain = networkToBlockchain[activeNetwork] || 'ethereum'
        
        // If active network is Ether or BSC, fetch wallets from both blockchains
        let blockchainsToFetch = [blockchain]
        if (activeNetwork === 'Ether' || activeNetwork === 'BSC') {
          blockchainsToFetch = ['ethereum', 'bsc']
        }
        
        // Fetch wallets from all relevant blockchains
        const allWallets = []
        const seenAddresses = new Set()
        
        for (const chain of blockchainsToFetch) {
          try {
            const response = await connectedWalletAPI.getAllWallets({ blockchain: chain })
            if (response.wallets && response.wallets.length > 0) {
              // Deduplicate by address (same address might exist in both ethereum and bsc)
              for (const wallet of response.wallets) {
                const addressLower = wallet.address.toLowerCase()
                if (!seenAddresses.has(addressLower)) {
                  seenAddresses.add(addressLower)
                  allWallets.push(wallet)
                }
              }
            }
          } catch (err) {
            console.error(`Error fetching wallets for ${chain}:`, err)
          }
        }
        
        if (allWallets.length > 0) {
          const transformedWallets = allWallets.map((wallet, index) => {
            const walletName = wallet.note || `Connected Wallet ${index + 1}`
            
            return {
              id: wallet.id || wallet._id,
              name: walletName,
              address: wallet.address,
              balance: '0.00 ETH', // Default balance, can be fetched separately
              blockchain: wallet.blockchain
            }
          })
          setWalletsA(transformedWallets)
        } else {
          setWalletsA([])
        }
      } catch (err) {
        console.error('Error fetching connected wallets:', err)
        setWalletsA([])
      }
    }
    
    fetchConnectedWallets()
    
    // Listen for wallet rename events to refresh the list
    const handleWalletRename = () => {
      fetchConnectedWallets()
    }
    
    window.addEventListener('walletRenamed', handleWalletRename)
    
    return () => {
      window.removeEventListener('walletRenamed', handleWalletRename)
    }
  }, [activeNetwork])

  // Fetch native balance for wallet B when selected
  useEffect(() => {
    const fetchWalletBNativeBalance = async () => {
      if (selectedWalletB && selectedWalletB.address) {
        setLoadingWalletB(true)
        try {
          // Map network to blockchain
          const blockchain = networkToBlockchain[activeNetwork] || 'ethereum'
          
          const nativeBalance = await getNativeBalance(selectedWalletB.address, blockchain)
          
          const nativeSymbols = {
            ethereum: 'ETH',
            bsc: 'BNB',
            tron: 'TRX',
            solana: 'SOL'
          }
          
          setWalletBNativeBalance({
            balance: nativeBalance || '0',
            symbol: nativeSymbols[blockchain] || 'ETH',
            blockchain
          })
        } catch (error) {
          console.error('Error fetching wallet B native balance:', error)
          setWalletBNativeBalance(null)
        } finally {
          setLoadingWalletB(false)
        }
      } else {
        setWalletBNativeBalance(null)
      }
    }
    
    fetchWalletBNativeBalance()
  }, [selectedWalletB, activeNetwork])

  // Fetch USDC and USDT balances when wallet B is selected
  useEffect(() => {
    const fetchTokenBalances = async () => {
      if (selectedWalletB && selectedWalletB.address) {
        try {
          // Map network to blockchain
          const blockchain = networkToBlockchain[activeNetwork] || 'ethereum'
          
          // Fetch balances for all supported chains (Ethereum, BSC, Tron, Solana)
          if (blockchain === 'ethereum' || blockchain === 'bsc' || blockchain === 'tron' || blockchain === 'solana') {
            // Get USDC and USDT contract addresses from env based on selected blockchain
            const balances = await getUSDCUSDTBalances(selectedWalletB.address, blockchain)
            
            // Create token objects for display - always show USDC and USDT
            const tokens = []
            
            // USDC token
            tokens.push({
              id: 'usdc',
              symbol: 'USDC',
              name: 'USD Coin',
              balance: balances.USDC || '0',
              value: `$${parseFloat(balances.USDC || '0').toFixed(2)}` // Approximate USD value
            })
            
            // USDT token
            tokens.push({
              id: 'usdt',
              symbol: 'USDT',
              name: 'Tether USD',
              balance: balances.USDT || '0',
              value: `$${parseFloat(balances.USDT || '0').toFixed(2)}` // Approximate USD value
            })
            
            setWalletTokens(tokens)
          } else {
            // For non-EVM chains, show empty tokens list
            setWalletTokens([])
          }
        } catch (error) {
          console.error('Error fetching token balances:', error)
          setWalletTokens([])
        }
      } else {
        setWalletTokens([])
      }
    }
    
    fetchTokenBalances()
  }, [selectedWalletB, activeNetwork])

  // Fetch balances (native + USDC + USDT) for wallet A on selected chain
  useEffect(() => {
    const fetchWalletABalances = async () => {
      if (selectedWalletA && selectedWalletA.address) {
        setLoadingWalletA(true)
        try {
          // Map active network to blockchain
          const blockchain = networkToBlockchain[activeNetwork] || 'ethereum'
          
          const chainNames = {
            ethereum: 'Ethereum',
            bsc: 'BSC',
            tron: 'Tron',
            solana: 'Solana'
          }
          const nativeSymbols = {
            ethereum: 'ETH',
            bsc: 'BNB',
            tron: 'TRX',
            solana: 'SOL'
          }

          // Fetch balances for the selected chain only
          try {
            const [nativeBalance, tokenBalances] = await Promise.all([
              getNativeBalance(selectedWalletA.address, blockchain),
              getUSDCUSDTBalances(selectedWalletA.address, blockchain)
            ])

            setWalletABalances([{
              blockchain,
              chainName: chainNames[blockchain],
              nativeSymbol: nativeSymbols[blockchain],
              native: nativeBalance || '0',
              usdc: tokenBalances.USDC || '0',
              usdt: tokenBalances.USDT || '0'
            }])
          } catch (error) {
            console.error(`Error fetching balances for ${blockchain}:`, error)
            setWalletABalances([{
              blockchain,
              chainName: chainNames[blockchain],
              nativeSymbol: nativeSymbols[blockchain],
              native: '0',
              usdc: '0',
              usdt: '0',
              error: error.message
            }])
          }
        } catch (error) {
          console.error('Error fetching wallet A balances:', error)
          setWalletABalances(null)
        } finally {
          setLoadingWalletA(false)
        }
      } else {
        setWalletABalances(null)
      }
    }

    fetchWalletABalances()
  }, [selectedWalletA, activeNetwork])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRefB.current && !dropdownRefB.current.contains(event.target)) {
        setShowDropdownB(false)
      }
      if (dropdownRefA.current && !dropdownRefA.current.contains(event.target)) {
        setShowDropdownA(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Helper function to get native symbol for current chain
  const getNativeSymbol = () => {
    const blockchain = networkToBlockchain[activeNetwork] || 'ethereum'
    const nativeSymbols = {
      ethereum: 'ETH',
      bsc: 'BNB',
      tron: 'TRX',
      solana: 'SOL'
    }
    return nativeSymbols[blockchain] || 'ETH'
  }

  const filteredWalletsB = walletsB.filter(wallet =>
    wallet.address.toLowerCase().includes(searchB.toLowerCase()) ||
    wallet.name.toLowerCase().includes(searchB.toLowerCase())
  )

  const filteredWalletsA = walletsA.filter(wallet =>
    wallet.address.toLowerCase().includes(searchA.toLowerCase()) ||
    wallet.name.toLowerCase().includes(searchA.toLowerCase())
  )

  const handleSelectWalletB = (wallet) => {
    setSelectedWalletB(wallet)
    setSearchB(wallet.name)
    setShowDropdownB(false)
    setSelectedTokens({})
    setWalletBNativeBalance(null) // Reset balance when selecting new wallet
  }

  const handleSelectWalletA = (wallet) => {
    setSelectedWalletA(wallet)
    setSearchA(wallet.name)
    setShowDropdownA(false)
    setWalletABalances(null) // Reset balances when selecting new wallet
  }

  const handleSelectToken = (token) => {
    setSelectedTokens(prev => {
      if (prev[token.id]) {
        // Remove token if already selected
        const newTokens = { ...prev }
        delete newTokens[token.id]
        return newTokens
      } else {
        // Add token with empty amount
        return { ...prev, [token.id]: { token, amount: '' } }
      }
    })
  }

  const handleAmountChange = (tokenId, amount) => {
    setSelectedTokens(prev => ({
      ...prev,
      [tokenId]: { ...prev[tokenId], amount }
    }))
  }

  const [withdrawLoading, setWithdrawLoading] = useState(false)

  const handleWithdraw = async () => {
    const tokensWithAmounts = Object.values(selectedTokens).filter(st => st.amount)
    if (!selectedWalletB || !selectedWalletA || tokensWithAmounts.length === 0) {
      toast.warn('Please select wallets and tokens with amounts')
      return
    }

    setWithdrawLoading(true)

    try {
      // Map network to blockchain
      const blockchain = networkToBlockchain[activeNetwork] || 'ethereum'

      // Prepare tokens array
      const tokens = tokensWithAmounts.map(st => ({
        tokenType: st.token.symbol, // USDC or USDT
        amount: st.amount
      }))

      // Call withdraw from Wallet B endpoint
      const response = await withdrawAPI.withdrawFromWalletB({
        blockchain,
        fromWalletBId: selectedWalletB.id,
        toWalletAAddress: selectedWalletA.address,
        tokens
      })

      // Show success message
      if (response.results && response.results.length > 0) {
        const successCount = response.results.length
        toast.success(`Successfully withdrew ${successCount} token(s)!`)
        
        // Show transaction hashes
        response.results.forEach(result => {
          console.log(`${result.tokenType} withdrawal:`, result.transaction)
        })

        // If there were errors, show them
        if (response.errors && response.errors.length > 0) {
          response.errors.forEach(error => {
            toast.error(`${error.tokenType}: ${error.error}`)
          })
        }

        // Clear selected tokens and refresh balances
        setSelectedTokens({})
        // Optionally refresh token balances
        if (selectedWalletB) {
          const blockchain = networkToBlockchain[activeNetwork] || 'ethereum'
          const balances = await getUSDCUSDTBalances(selectedWalletB.address, blockchain)
          const tokens = []
          tokens.push({
            id: 'usdc',
            symbol: 'USDC',
            name: 'USD Coin',
            balance: balances.USDC || '0',
            value: `$${parseFloat(balances.USDC || '0').toFixed(2)}`
          })
          tokens.push({
            id: 'usdt',
            symbol: 'USDT',
            name: 'Tether USD',
            balance: balances.USDT || '0',
            value: `$${parseFloat(balances.USDT || '0').toFixed(2)}`
          })
          setWalletTokens(tokens)
        }
      } else {
        toast.error('Withdrawal failed. Please try again.')
      }
    } catch (error) {
      console.error('Error withdrawing:', error)
      toast.error(`Withdrawal failed: ${error.message}`)
    } finally {
      setWithdrawLoading(false)
    }
  }


  return (
    <div className="flex flex-col gap-6 mx-auto bg-transparent h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* From Wallet B Search */}
        <div className="relative">
          <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>From Wallet B</label>
          <div className="relative" ref={dropdownRefB}>
            <input
              type="text"
              placeholder="Search wallet by name or address..."
              value={searchB}
              onChange={(e) => {
                setSearchB(e.target.value)
                setShowDropdownB(true)
                if (!e.target.value) {
                  setSelectedWalletB(null)
                }
              }}
              onFocus={() => setShowDropdownB(true)}
              className={`w-full pl-4 pr-12 py-4 border-2 rounded-2xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-4 focus:ring-[#667eea]/20 shadow-md hover:shadow-lg ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-200 text-gray-800'
              }`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {showDropdownB && searchB && filteredWalletsB.length > 0 && (
              <div className={`absolute top-full left-0 right-0 border-2 border-t-0 rounded-b-2xl max-h-[300px] overflow-y-auto shadow-2xl z-50 -mt-0.5 custom-scrollbar ${
                theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                {filteredWalletsB.map(wallet => (
                  <div
                    key={wallet.id}
                    className={`p-4 cursor-pointer flex justify-between items-center border-b transition-all duration-200 last:border-b-0 rounded-lg mx-1 ${
                      theme === 'dark'
                        ? 'border-gray-700/50 hover:bg-gray-700/50'
                        : 'border-gray-100/50 hover:bg-gradient-to-r hover:from-[#667eea]/5 hover:to-[#764ba2]/5'
                    }`}
                    onClick={() => handleSelectWalletB(wallet)}
                  >
                    <div className="flex-1">
                      <div className={`font-bold mb-1 text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{wallet.name}</div>
                      <div className={`text-xs font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{wallet.address}</div>
                    </div>
                    <div className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2] text-sm ml-4">{wallet.balance}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* To Wallet A Search */}
        <div className="relative">
          <label className={`block text-sm font-bold mb-3 uppercase tracking-wider ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>To Wallet A</label>
          <div className="relative" ref={dropdownRefA}>
            <input
              type="text"
              placeholder="Search wallet by name or address..."
              value={searchA}
              onChange={(e) => {
                setSearchA(e.target.value)
                setShowDropdownA(true)
                if (!e.target.value) {
                  setSelectedWalletA(null)
                }
              }}
              onFocus={() => setShowDropdownA(true)}
              className={`w-full pl-4 pr-12 py-4 border-2 rounded-2xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-4 focus:ring-[#667eea]/20 shadow-md hover:shadow-lg ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-200 text-gray-800'
              }`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {showDropdownA && searchA && filteredWalletsA.length > 0 && (
              <div className={`absolute top-full left-0 right-0 border-2 border-t-0 rounded-b-2xl max-h-[300px] overflow-y-auto shadow-2xl z-50 -mt-0.5 custom-scrollbar ${
                theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}>
                {filteredWalletsA.map(wallet => (
                  <div
                    key={wallet.id}
                    className={`p-4 cursor-pointer flex justify-between items-center border-b transition-colors last:border-b-0 ${
                      theme === 'dark'
                        ? 'border-gray-700/50 hover:bg-gray-700/50'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectWalletA(wallet)}
                  >
                    <div className="flex-1">
                      <div className={`font-semibold mb-1 text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{wallet.name}</div>
                      <div className={`text-xs font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{wallet.address}</div>
                    </div>
                    <div className="font-semibold text-[#667eea] text-sm ml-4">{wallet.balance}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Token List (Left) and Withdraw Details (Right) */}
      <div className={`grid gap-6 flex-1 min-h-0 h-full ${
        selectedWalletB && walletTokens.length > 0 
          ? 'grid-cols-1 lg:grid-cols-[1fr_2fr]' 
          : 'grid-cols-1'
      }`}>
        {/* Token List Panel - Left */}
        {selectedWalletB && (
          <div className={`rounded-3xl shadow-2xl border flex flex-col overflow-hidden hover:shadow-glow transition-all duration-300 h-full ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200/50'
          }`}>
            <div className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white px-6 py-6 border-b border-white/20 relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse"></div>
              <h2 className="text-xl font-bold m-0 relative z-10 drop-shadow-md">Select Tokens</h2>
              <p className="text-sm text-white/90 mt-1 relative z-10">Choose tokens from {selectedWalletB.name}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0">
              {walletTokens.length === 0 ? (
                <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>No tokens found for this wallet.</p>
                  <p className="text-xs mt-2">Token fetching will be available when backend endpoint is implemented.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {walletTokens.map(token => {
                  const isSelected = selectedTokens[token.id]
                  const amount = isSelected ? selectedTokens[token.id].amount : ''
                  return (
                    <div
                      key={token.id}
                      className={`p-4 border-2 rounded-2xl transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10 border-[#667eea] shadow-xl scale-[1.02]'
                          : theme === 'dark'
                            ? 'bg-gray-700/50 border-gray-600 hover:border-[#667eea]/50 hover:shadow-lg hover:scale-[1.01]'
                            : 'bg-gray-50 border-gray-200 hover:border-[#667eea]/50 hover:shadow-lg hover:scale-[1.01]'
                      }`}
                      onClick={() => handleSelectToken(token)}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <TokenIcon symbol={token.symbol} className="w-12 h-12 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold mb-1 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{token.name}</div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Balance: {token.balance} {token.symbol}</div>
                          <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{token.value}</div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#667eea] flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-3 pt-3 border-t border-[#667eea]/20">
                          <label className={`text-sm font-semibold whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Amount:</label>
                          <input
                            type="text"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => handleAmountChange(token.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={`flex-1 px-3 py-2 border-2 rounded-lg text-base font-semibold transition-colors focus:outline-none focus:border-[#667eea] ${
                              theme === 'dark'
                                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                                : 'bg-white border-gray-200 text-gray-800'
                            }`}
                          />
                          <div className={`text-xs whitespace-nowrap ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Max: {token.balance}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Withdraw Details Panel - Right (Full Width when no wallet selected) */}
        <div className={`rounded-3xl shadow-2xl border flex flex-col flex-1 min-h-0 hover:shadow-glow transition-all duration-300 overflow-hidden h-full ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200/50'
        }`}>
          <div className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white px-6 py-6 border-b border-white/20 relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse"></div>
            <h2 className="text-xl font-bold m-0 relative z-10 drop-shadow-md">Withdraw Details</h2>
          </div>
          <div className="flex-1 p-8 overflow-y-auto flex flex-col items-start justify-start gap-6 custom-scrollbar min-h-0">
            {selectedWalletB && selectedWalletA ? (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className={`p-4 rounded-2xl border border-[#667eea]/20 ${
                  theme === 'dark' ? 'bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10' : 'bg-gradient-to-br from-[#667eea]/5 to-[#764ba2]/5'
                }`}>
                  <div className={`text-xs font-bold mb-3 uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>From:</div>
                  <div className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{selectedWalletB.name}</div>
                  <div className={`text-sm font-mono mb-2 break-all px-3 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'text-gray-300 bg-gray-700/50 border-gray-600'
                      : 'text-gray-600 bg-gray-50 border-gray-200'
                  }`}>{selectedWalletB.address}</div>
                  <div className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2]">
                    {loadingWalletB ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#667eea]"></span>
                        Loading...
                      </span>
                    ) : walletBNativeBalance ? (
                      `Balance: ${walletBNativeBalance.balance} ${walletBNativeBalance.symbol}`
                    ) : (
                      `Balance: 0.00 ${networkToBlockchain[activeNetwork] === 'ethereum' ? 'ETH' : networkToBlockchain[activeNetwork] === 'bsc' ? 'BNB' : networkToBlockchain[activeNetwork] === 'tron' ? 'TRX' : networkToBlockchain[activeNetwork] === 'solana' ? 'SOL' : 'ETH'}`
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border border-[#667eea]/20 ${
                    theme === 'dark' ? 'bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10' : 'bg-gradient-to-br from-[#667eea]/5 to-[#764ba2]/5'
                  }`}>
                    <div className={`text-xs font-bold mb-3 uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>To:</div>
                    <div className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{selectedWalletA.name}</div>
                    <div className={`text-sm font-mono mb-2 break-all px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'text-gray-300 bg-gray-700/50 border-gray-600'
                        : 'text-gray-600 bg-gray-50 border-gray-200'
                    }`}>{selectedWalletA.address}</div>
                  </div>

                  {/* Wallet A Balances across all chains */}
                  {loadingWalletA ? (
                    <div className={`p-6 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#667eea]"></div>
                      <p className="mt-2">Loading balances...</p>
                    </div>
                  ) : walletABalances ? (
                    <div className={`rounded-2xl border overflow-hidden ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200/50'
                    }`}>
                      <div className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white px-6 py-4 border-b border-white/20">
                        <h3 className="text-lg font-bold">Balances on {walletABalances[0]?.chainName || activeNetwork}</h3>
                      </div>
                      <div className="p-4">
                        {walletABalances.map((chainData) => (
                          <div
                            key={chainData.blockchain}
                            className="grid grid-cols-1 md:grid-cols-3 gap-3"
                          >
                            {/* Native Token */}
                            <div className={`p-4 rounded-xl border ${
                              theme === 'dark' 
                                ? 'bg-gray-700/30 border-gray-600/50' 
                                : 'bg-gray-50 border-gray-200/50'
                            }`}>
                              <div className={`text-xs mb-2 uppercase tracking-wider ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                Native ({chainData.nativeSymbol})
                              </div>
                              <div className={`text-xl font-bold ${
                                theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
                              }`}>
                                {chainData.native} {chainData.nativeSymbol}
                              </div>
                            </div>
                            
                            {/* USDC */}
                            <div className={`p-4 rounded-xl border ${
                              theme === 'dark' 
                                ? 'bg-gray-700/30 border-gray-600/50' 
                                : 'bg-gray-50 border-gray-200/50'
                            }`}>
                              <div className={`text-xs mb-2 uppercase tracking-wider ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                USDC
                              </div>
                              <div className={`text-xl font-bold ${
                                theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
                              }`}>
                                {chainData.usdc} USDC
                              </div>
                            </div>
                            
                            {/* USDT */}
                            <div className={`p-4 rounded-xl border ${
                              theme === 'dark' 
                                ? 'bg-gray-700/30 border-gray-600/50' 
                                : 'bg-gray-50 border-gray-200/50'
                            }`}>
                              <div className={`text-xs mb-2 uppercase tracking-wider ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                USDT
                              </div>
                              <div className={`text-xl font-bold ${
                                theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
                              }`}>
                                {chainData.usdt} USDT
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : selectedWalletB ? (
              <div className={`w-full p-4 rounded-2xl border border-[#667eea]/20 ${
                theme === 'dark' ? 'bg-gradient-to-br from-[#667eea]/10 to-[#764ba2]/10' : 'bg-gradient-to-br from-[#667eea]/5 to-[#764ba2]/5'
              }`}>
                <div className={`text-xs font-bold mb-3 uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>From:</div>
                <div className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{selectedWalletB.name}</div>
                <div className={`text-sm font-mono mb-2 break-all px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'text-gray-300 bg-gray-700/50 border-gray-600'
                    : 'text-gray-600 bg-white/50 border-gray-200/50'
                }`}>{selectedWalletB.address}</div>
                <div className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2]">
                  {loadingWalletB ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#667eea]"></span>
                      Loading...
                    </span>
                  ) : walletBNativeBalance ? (
                    `Balance: ${walletBNativeBalance.balance} ${walletBNativeBalance.symbol}`
                  ) : (
                    `Balance: 0.00 ${getNativeSymbol()}`
                  )}
                </div>
              </div>
            ) : (
              <div className={`p-12 text-center w-full ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                <p className="text-lg font-semibold">Search and select a wallet from Wallet B</p>
              </div>
            )}

            {Object.keys(selectedTokens).length > 0 && (
              <div className={`w-full p-4 rounded-2xl border ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-[#667eea]/15 to-[#764ba2]/15 border-[#667eea]/40' 
                  : 'bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10 border-[#667eea]/30'
              }`}>
                <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#667eea] to-[#764ba2] uppercase tracking-wider">
                  Selected: {Object.keys(selectedTokens).length} token(s)
                </div>
              </div>
            )}

            {selectedWalletB && selectedWalletA && Object.keys(selectedTokens).length > 0 && (
              <div className="w-full">
              <button
                className="w-full px-8 py-4 bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white rounded-xl text-base font-bold cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl relative overflow-auto group"
                onClick={handleWithdraw}
                disabled={withdrawLoading || Object.values(selectedTokens).every(st => !st.amount)}
              >
                <span className="relative z-10">{withdrawLoading ? 'Processing...' : 'Withdraw'}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] transition-transform duration-1000"></div>
              </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
