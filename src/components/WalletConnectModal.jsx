import { useState, useEffect, useRef } from 'react'
import { useAccount, useDisconnect, useSwitchChain, useChainId, useConnect, useConnectors } from 'wagmi'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useWalletModal as useTronWalletModal } from '@tronweb3/tronwallet-adapter-react-ui'
import { useWallet as useTronWallet } from '@tronweb3/tronwallet-adapter-react-hooks'
import { useWalletContext, NETWORKS } from '../contexts/WalletContext'
import { connectedWalletAPI } from '../api/api'
import { toast } from 'react-toastify'
import { networkToBlockchain } from '../utils/tokenContracts'

const WalletConnectModal = ({ isOpen, onClose, theme = 'dark' }) => {
  const modalRef = useRef(null)

  const { connectedWallets, addConnectedWallet, removeConnectedWallet, activeNetwork, setActiveNetwork } = useWalletContext()
  const { address: evmAddress, isConnected: isEvmConnected, connector } = useAccount()
  const { disconnect: disconnectEvm } = useDisconnect()
  const { connect, isPending, connectors: connectConnectors } = useConnect()
  const { connectors: hookConnectors } = useConnectors()
  
  // Use connectors from useConnect if available, otherwise from useConnectors
  const connectors = connectConnectors && connectConnectors.length > 0 ? connectConnectors : hookConnectors
  
  // Debug: Log available connectors
  useEffect(() => {
    console.log('Connectors from useConnect:', connectConnectors)
    console.log('Connectors from useConnectors:', hookConnectors)
    console.log('Final connectors to use:', connectors)
    
    if (connectors && connectors.length > 0) {
      console.log('Available EVM connectors:', connectors.map(c => ({ 
        id: c.id, 
        name: c.name, 
        ready: c.ready,
        type: c.type 
      })))
    } else {
      console.warn('No EVM connectors available')
      console.warn('Check browser console for window.ethereum:', typeof window !== 'undefined' ? !!window.ethereum : 'N/A')
    }
  }, [connectors, connectConnectors, hookConnectors])
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  const { publicKey: solanaPublicKey, disconnect: disconnectSolana, connected: isSolanaConnected, select, wallet, wallets, connect: connectSolana } = useWallet()
  const { setVisible: setSolanaModalVisible } = useWalletModal()
  
  // Tron wallet hooks
  const { setVisible: setTronModalVisible } = useTronWalletModal()
  const { address: tronAddress, connected: isTronConnected, adapter: tronAdapter } = useTronWallet()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handle Solana wallet connection
  const handleSolanaConnect = () => {
    setSolanaModalVisible(true)
  }

  // Debug: Log wallet state
  useEffect(() => {
    if (wallet) {
      console.log('Selected wallet:', {
        name: wallet.name,
        readyState: wallet.readyState,
        connected: isSolanaConnected,
        hasConnect: typeof wallet.connect === 'function',
        hasAdapter: !!wallet.adapter,
        walletObject: wallet
      })
    }
    if (wallets && wallets.length > 0) {
      console.log('Available wallets:', wallets.map(w => ({
        name: w.name,
        readyState: w.readyState,
        installed: w.readyState === 'Installed'
      })))
    }
  }, [wallet, wallets, isSolanaConnected])

  // Listen for wallet selection and manually trigger connection if needed
  useEffect(() => {
    if (wallet && !isSolanaConnected && wallet.readyState) {
      // Wallet is selected but not connected
      const connectWallet = async () => {
        try {
          // Check if wallet is ready to connect
          if (wallet.readyState === 'Installed' || wallet.readyState === 'Loadable') {
            console.log('Attempting to connect wallet:', wallet.name, 'Ready state:', wallet.readyState)
            
            // Try using the connect function from useWallet hook first
            if (typeof connectSolana === 'function') {
              console.log('Using connect function from useWallet hook')
              await connectSolana()
            } 
            // Fallback: Try to connect using the wallet's connect method
            else if (typeof wallet.connect === 'function') {
              console.log('Using wallet.connect() method')
              await wallet.connect()
            } 
            // Fallback: Try using adapter directly
            else if (wallet.adapter && typeof wallet.adapter.connect === 'function') {
              console.log('Using wallet.adapter.connect() method')
              await wallet.adapter.connect()
            } 
            else {
              console.warn('No connect method available. Wallet object:', wallet)
              toast.error(`Unable to connect ${wallet.name}. Please try selecting it again.`)
            }
          } else {
            console.warn('Wallet not ready. State:', wallet.readyState)
            if (wallet.readyState === 'NotFound') {
              toast.error(`${wallet.name} is not installed. Please install the wallet extension.`)
            }
          }
        } catch (error) {
          console.error('Error connecting Solana wallet:', error)
          if (error.message && !error.message.includes('User rejected') && !error.message.includes('User cancelled')) {
            toast.error(`Failed to connect ${wallet?.name || 'wallet'}: ${error.message || 'Unknown error'}`)
          }
        }
      }
      
      // Small delay to let the modal handle it first, then try manual connection
      const timeoutId = setTimeout(connectWallet, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [wallet, isSolanaConnected, connectSolana])

  // Handle EVM wallet connection (Ethereum/BSC)
  const handleEvmConnect = async (connectorToUse) => {
    try {
      // Determine target chain based on active network
      const targetChainId = activeNetwork === 'BSC' ? 56 : 1
      
      // Connect wallet
      connect(
        { 
          connector: connectorToUse, 
          chainId: targetChainId 
        },
        {
          onSuccess: async () => {
            // Wait a bit for the connection to be established
            setTimeout(async () => {
              try {
                // Get the connected address from useAccount
                const accounts = await connectorToUse.getAccounts()
                const address = accounts?.[0]
                
                if (address) {
                  // Save to backend
                  const blockchain = networkToBlockchain[activeNetwork] || (activeNetwork === 'BSC' ? 'bsc' : 'ethereum')
                  await connectedWalletAPI.connectWallet({
                    blockchain: blockchain,
                    address: address,
                    publicKey: '',
                    note: `${connectorToUse.name} Wallet`
                  })
                  
                  // Add to context
                  addConnectedWallet({
                    address: address,
                    network: activeNetwork,
                    walletType: connectorToUse.name,
                    name: `${connectorToUse.name} Wallet`,
                  })
                  toast.success(`${activeNetwork} wallet connected successfully!`)
                }
              } catch (error) {
                console.error('Error saving wallet to backend:', error)
                toast.warning('Wallet connected but failed to save to backend. Please try again.')
              }
            }, 500)
          },
          onError: (error) => {
            console.error('Connection error:', error)
            toast.error(`Failed to connect: ${error.message || 'Unknown error'}`)
          }
        }
      )
    } catch (error) {
      console.error('Failed to connect EVM wallet:', error)
      toast.error('Failed to connect wallet. Please try again.')
    }
  }

  // Handle Tron wallet connection - open modal
  const handleTronConnect = () => {
    setTronModalVisible(true)
  }

  // Save connected wallets when they connect
  useEffect(() => {
    if (isEvmConnected && evmAddress) {
      const network = activeNetwork === 'BSC' ? 'BSC' : 'Ether'
      addConnectedWallet({
        address: evmAddress,
        network,
        walletType: connector?.name || 'Unknown',
        name: `${connector?.name || 'EVM'} Wallet`,
      })
    }
  }, [isEvmConnected, evmAddress, activeNetwork, connector, addConnectedWallet])

  useEffect(() => {
    const saveSolanaWallet = async () => {
    if (isSolanaConnected && solanaPublicKey) {
        const address = solanaPublicKey.toString()
        
        // Check if wallet is already in context to avoid duplicate saves
        const alreadyAdded = connectedWallets.some(
          w => w.address === address && w.network === 'Solana'
        )
        
        if (!alreadyAdded) {
          try {
            // Save to backend
            const blockchain = networkToBlockchain['Solana'] || 'solana'
            await connectedWalletAPI.connectWallet({
              blockchain: blockchain,
              address: address,
              publicKey: solanaPublicKey.toBase58(),
              note: 'Solana Wallet'
            })
            
            // Add to context
            addConnectedWallet({
              address,
              network: 'Solana',
              walletType: window.solana?.isPhantom ? 'Phantom' : window.solana?.isSolflare ? 'Solflare' : 'Solana Wallet',
              name: window.solana?.isPhantom ? 'Phantom Wallet' : window.solana?.isSolflare ? 'Solflare Wallet' : 'Solana Wallet',
            })
            toast.success('Solana wallet connected successfully!')
          } catch (error) {
            console.error('Error saving Solana wallet to backend:', error)
            // Still add to context even if backend save fails
      addConnectedWallet({
              address,
        network: 'Solana',
              walletType: window.solana?.isPhantom ? 'Phantom' : window.solana?.isSolflare ? 'Solflare' : 'Solana Wallet',
              name: window.solana?.isPhantom ? 'Phantom Wallet' : window.solana?.isSolflare ? 'Solflare Wallet' : 'Solana Wallet',
      })
            toast.warning('Wallet connected but failed to save to backend. Please try again.')
          }
        }
      }
    }
    
    saveSolanaWallet()
  }, [isSolanaConnected, solanaPublicKey, addConnectedWallet, connectedWallets])

  // Disconnect handlers
  const handleDisconnect = async (wallet) => {
    try {
      // Map network to blockchain
      const blockchain = networkToBlockchain[wallet.network] || wallet.network.toLowerCase()
      
      // Get wallet ID from backend
      let walletId = null
      try {
        const walletResponse = await connectedWalletAPI.getWalletByAddress(wallet.address, blockchain)
        if (walletResponse && walletResponse.wallet) {
          walletId = walletResponse.wallet.id || walletResponse.wallet._id
        }
      } catch (error) {
        console.error('Error fetching wallet ID for disconnect:', error)
        // Continue with disconnect even if we can't find the wallet ID
      }
      
      // Delete from backend if wallet ID exists
      if (walletId) {
        try {
          await connectedWalletAPI.deleteConnectedWallet(walletId)
          toast.success('Wallet disconnected successfully')
        } catch (error) {
          console.error('Error deleting wallet from backend:', error)
          toast.error('Failed to remove wallet from backend')
        }
      }
      
      // Disconnect from browser wallet
      if (wallet.network === 'Ether' || wallet.network === 'BSC') {
      if (isEvmConnected && evmAddress === wallet.address) {
        disconnectEvm()
      }
    } else if (wallet.network === 'Solana') {
      if (isSolanaConnected && solanaPublicKey?.toString() === wallet.address) {
        disconnectSolana()
      }
      } else if (wallet.network === 'Tron') {
        // Disconnect Tron wallet using adapter
        if (tronAdapter && tronAdapter.state === 'Connected') {
          try {
            await tronAdapter.disconnect()
            // The 'disconnect' event handler will handle removing from context
          } catch (error) {
            console.error('Error disconnecting Tron wallet:', error)
            // Still remove from context even if disconnect fails
            removeConnectedWallet(wallet.address, wallet.network)
          }
        } else {
          // Just remove from context if adapter is not available
    removeConnectedWallet(wallet.address, wallet.network)
        }
      }
      
      // Remove from context
      removeConnectedWallet(wallet.address, wallet.network)
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
      toast.error('Failed to disconnect wallet')
    }
  }

  if (!isOpen) return null

  const currentNetwork = NETWORKS[activeNetwork]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
      <div
        ref={modalRef}
        className={`rounded-3xl shadow-2xl max-w-2xl w-full mx-4 p-8 border animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
            Connect Wallet
          </h3>
          <button
            onClick={onClose}
            className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selected Network Display (Read-only) */}
        <div className="mb-6">
          <label className={`block text-sm font-bold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            Selected Network
          </label>
          <div className="p-4 rounded-xl border-2 bg-gradient-to-r from-[#667eea]/15 to-[#764ba2]/15 border-[#667eea] shadow-lg">
            <div className="text-2xl mb-2">{currentNetwork?.icon}</div>
                <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
              {currentNetwork?.name || activeNetwork}
            </div>
            <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Change network from the main dashboard
                </div>
          </div>
        </div>

        {/* Wallet Options - Using Native Modals */}
        <div className="space-y-3">
          {activeNetwork === 'Ether' || activeNetwork === 'BSC' ? (
            <div className="space-y-2">
              {isEvmConnected && evmAddress ? (
                <div className="space-y-2">
                  {/* Connected State */}
                  <div className={`p-4 rounded-xl border-2 ${
                    theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                      Connected: {connector?.name || 'EVM Wallet'}
                    </div>
                    <div className={`text-xs font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {evmAddress}
                    </div>
                    <div className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                      Chain ID: {chainId} ({chainId === 1 ? 'Ethereum' : chainId === 56 ? 'BSC' : 'Unknown'})
                    </div>
                    {chainId !== (activeNetwork === 'BSC' ? 56 : 1) && (
                      <button
                        onClick={() => switchChain({ chainId: activeNetwork === 'BSC' ? 56 : 1 })}
                        className={`mt-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          theme === 'dark'
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        Switch to {activeNetwork}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={disconnectEvm}
                    className={`w-full px-4 py-2 rounded-lg border-2 transition-all duration-300 ${
                      theme === 'dark'
                        ? 'border-red-600 hover:border-red-500 hover:bg-red-900/50 text-red-400'
                        : 'border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600'
                    }`}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                /* Wagmi Connectors - Show all available connectors */
                <div className="space-y-2 w-full">
                  {connectors && connectors.length > 0 ? (
                    connectors.map((connector) => (
                      <button
                        key={connector.id}
                        onClick={() => handleEvmConnect(connector)}
                        disabled={isPending}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 ${
                          theme === 'dark'
                            ? 'border-gray-600 hover:border-[#667eea] hover:bg-gray-700/50 text-white disabled:opacity-50'
                            : 'border-gray-200 hover:border-[#667eea] hover:bg-gray-50 text-gray-800 disabled:opacity-50'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                          {connector.id === 'metaMask' ? '🦊' : connector.id === 'injected' ? '🔷' : '💼'}
                        </div>
                        <div className="flex-1 text-left">
                          <div className={`font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                            {connector.name}
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {connector.ready ? `Connect to ${activeNetwork}` : 'Click to connect'}
                          </div>
                          {!connector.ready && (
                            <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                              May require wallet extension
                            </div>
                          )}
                        </div>
                        {isPending && (
                          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className={`p-4 rounded-xl border-2 ${
                      theme === 'dark' ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className={`text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div className="font-semibold mb-2">No wallets available</div>
                        <div className="text-xs">
                          Please install MetaMask or another EVM-compatible wallet extension
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeNetwork === 'Solana' ? (
            <div className="space-y-2">
              {isSolanaConnected && solanaPublicKey ? (
                <div className="space-y-2">
                  <div className={`p-4 rounded-xl border-2 ${
                    theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                      Connected: {wallet?.name || 'Solana Wallet'}
                    </div>
                    <div className={`text-xs font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {solanaPublicKey.toString()}
                    </div>
                  </div>
                  <button
                    onClick={disconnectSolana}
                    className={`w-full px-4 py-2 rounded-lg border-2 transition-all duration-300 ${
                      theme === 'dark'
                        ? 'border-red-600 hover:border-red-500 hover:bg-red-900/50 text-red-400'
                        : 'border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600'
                    }`}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSolanaConnect}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 ${
                    theme === 'dark'
                      ? 'border-gray-600 hover:border-[#667eea] hover:bg-gray-700/50'
                      : 'border-gray-200 hover:border-[#667eea] hover:bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    🟣
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                      Connect Solana Wallet
                    </div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Opens Solana wallet selection modal
                    </div>
                  </div>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          ) : activeNetwork === 'Tron' ? (
            <div className="space-y-2">
              {isTronConnected && tronAddress ? (
                <div className="space-y-2">
                  <div className={`p-4 rounded-xl border-2 ${
                    theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                      Connected: TronLink
                    </div>
                    <div className={`text-xs font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {tronAddress}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (tronAdapter && isTronConnected) {
                        try {
                          await tronAdapter.disconnect()
                        } catch (error) {
                          console.error('Error disconnecting Tron wallet:', error)
                        }
                      }
                    }}
                    className={`w-full px-4 py-2 rounded-lg border-2 transition-all duration-300 ${
                      theme === 'dark'
                        ? 'border-red-600 hover:border-red-500 hover:bg-red-900/50 text-red-400'
                        : 'border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600'
                    }`}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleTronConnect}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 ${
                    theme === 'dark'
                      ? 'border-gray-600 hover:border-[#667eea] hover:bg-gray-700/50'
                      : 'border-gray-200 hover:border-[#667eea] hover:bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-xl">
                    🔴
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                      Connect Tron Wallet
                    </div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Opens Tron wallet selection modal
                    </div>
                  </div>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          ) : null}
        </div>

        {/* Connected Wallets List (Filtered by active network) */}
        {connectedWallets.filter(w => w.network === activeNetwork).length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-600">
            <h4 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
              Connected Wallets ({activeNetwork})
            </h4>
            <div className="space-y-2">
              {connectedWallets.filter(w => w.network === activeNetwork).map((wallet, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                      {wallet.name}
                    </div>
                    <div className={`text-xs font-mono truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {wallet.address}
                    </div>
                    <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                      {NETWORKS[wallet.network]?.name || wallet.network}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDisconnect(wallet)}
                    className={`ml-4 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      theme === 'dark'
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                    }`}
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletConnectModal

