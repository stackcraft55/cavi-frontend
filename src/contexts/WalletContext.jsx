import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Network configurations
export const NETWORKS = {
  Ether: {
    id: 'Ether',
    name: 'Ether',
    chainId: 1,
    icon: '🔷',
  },
  BSC: {
    id: 'BSC',
    name: 'BSC',
    chainId: 56,
    icon: '🟡',
  },
  Solana: {
    id: 'Solana',
    name: 'Solana',
    chainId: 'solana',
    icon: '🟣',
  },
  Tron: {
    id: 'Tron',
    name: 'Tron',
    chainId: 'tron',
    icon: '🔴',
  },
}


// Wallet Context
const WalletContext = createContext(null)

export const useWalletContext = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWalletContext must be used within WalletContextProvider')
  }
  return context
}

// Wallet Context Provider Component
export const WalletContextProvider = ({ children }) => {
  const [connectedWallets, setConnectedWallets] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('connectedWallets')
    return saved ? JSON.parse(saved) : []
  })
  const [activeNetwork, setActiveNetwork] = useState(() => {
    const saved = localStorage.getItem('activeNetwork')
    return saved || 'Ether'
  })

  // Save to localStorage whenever connectedWallets changes
  useEffect(() => {
    localStorage.setItem('connectedWallets', JSON.stringify(connectedWallets))
  }, [connectedWallets])

  useEffect(() => {
    localStorage.setItem('activeNetwork', activeNetwork)
  }, [activeNetwork])

  const addConnectedWallet = useCallback((wallet) => {
    setConnectedWallets(prev => {
      // Check if wallet already exists
      const exists = prev.find(w => 
        w.address === wallet.address && w.network === wallet.network
      )
      if (exists) return prev
      return [...prev, wallet]
    })
  }, [])

  const removeConnectedWallet = useCallback((address, network) => {
    setConnectedWallets(prev => 
      prev.filter(w => !(w.address === address && w.network === network))
    )
  }, [])

  const disconnectAll = useCallback(() => {
    setConnectedWallets([])
  }, [])

  const value = {
    connectedWallets,
    activeNetwork,
    setActiveNetwork,
    addConnectedWallet,
    removeConnectedWallet,
    disconnectAll,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

