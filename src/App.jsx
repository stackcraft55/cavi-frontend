import { useState, useEffect, useMemo } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, bsc } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { WalletProvider as TronWalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks'
import { WalletModalProvider as TronWalletModalProvider } from '@tronweb3/tronwallet-adapter-react-ui'
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapters'
import { getAlchemyRpcUrl } from './utils/alchemy'
import '@solana/wallet-adapter-react-ui/styles.css'
import '@tronweb3/tronwallet-adapter-react-ui/style.css'
import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import { WalletContextProvider } from './contexts/WalletContext'

// Get Alchemy RPC URLs
const getEthereumRpcUrl = () => {
  try {
    return getAlchemyRpcUrl('ethereum')
  } catch {
    return undefined
  }
}

const getBSCRpcUrl = () => {
  try {
    return getAlchemyRpcUrl('bsc')
  } catch {
    return undefined
  }
}

// Wagmi configuration for EVM chains (Ethereum & BSC)
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''

const wagmiConfig = createConfig({
  chains: [mainnet, bsc],
  connectors: [
    injected(),
    metaMask(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [mainnet.id]: http(getEthereumRpcUrl()),
    [bsc.id]: http(getBSCRpcUrl()),
  },
  ssr: false,
})

// QueryClient for React Query (used by Wagmi)
const queryClient = new QueryClient()

// Solana wallet adapters



// Tron wallet adapters
const tronAdapters = [
  new TronLinkAdapter(),
]

function App() {
  const [theme, setTheme] = useState('dark') // 'light' or 'dark'

  useEffect(() => {
    // Apply theme to body
    document.body.className = `${theme}-theme`
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    // Save theme preference
    localStorage.setItem('theme', theme)
    document.body.className = `${theme}-theme`
  }, [theme])

  const solanaWallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* Wagmi Provider for EVM chains (Ethereum & BSC) */}
      <WagmiProvider config={wagmiConfig}>
        {/* Solana Wallet Providers */}
        <ConnectionProvider endpoint={getAlchemyRpcUrl('solana')}>
          <WalletProvider 
            wallets={solanaWallets}
            autoConnect={false}
            onError={(error) => {
              console.error('Solana wallet error:', error)
              // Show user-friendly error messages
              if (error.name === 'WalletConnectionError') {
                console.error('Connection error details:', error.message)
              } else if (error.name === 'WalletNotReadyError') {
                console.warn('Wallet not ready:', error.message)
              } else {
                console.error('Unexpected wallet error:', error)
              }
            }}
            localStorageKey="solana-wallet-adapter"
          >
            <WalletModalProvider>
              {/* Tron Wallet Provider */}
              <TronWalletProvider adapters={tronAdapters}>
                {/* Tron Wallet Modal Provider */}
                <TronWalletModalProvider>
                  {/* Custom Wallet Context Provider */}
                  <WalletContextProvider>
                    <Routes>
                      {/* Landing page - first page */}
                      <Route path="/" element={<Landing theme={theme} setTheme={setTheme} />} />
                      
                      {/* Public routes */}
                      <Route path="/signin" element={<SignIn theme={theme} />} />
                      <Route path="/signup" element={<SignUp theme={theme} />} />
                      <Route path="/forgot-password" element={<ForgotPassword theme={theme} />} />
                      
                      {/* Protected routes */}
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute>
                            <Dashboard theme={theme} setTheme={setTheme} />
                          </ProtectedRoute>
                        }
                      />
                      
                      {/* Catch all - redirect to landing */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    <ToastContainer
                      position="top-right"
                      autoClose={5000}
                      hideProgressBar={false}
                      newestOnTop={false}
                      closeOnClick
                      rtl={false}
                      pauseOnFocusLoss
                      draggable
                      pauseOnHover
                      theme={theme}
                    />
                  </WalletContextProvider>
                </TronWalletModalProvider>
              </TronWalletProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}

export default App
