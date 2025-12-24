import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WalletConnectModal from '../components/WalletConnectModal'
import Header from '../components/Header'
import TrackTab from '../components/TrackTab'
import WithdrawTab from '../components/WithdrawTab'
import WalletsTab from '../components/WalletsTab'
import MyPageTab from '../components/MyPageTab'
import AdminPanelTab from '../components/AdminPanelTab'

// Admin emails that can access admin panel (case-insensitive)
const ADMIN_EMAILS = ['kashifmahi271@gmail.com', 'superdev5597@gmail.com']

const isAdmin = (email) => {
  if (!email) return false
  const emailLower = email.toLowerCase()
  return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === emailLower)
}

export default function Dashboard({ theme, setTheme }) {
  const [activeTab, setActiveTab] = useState('track')
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Get user from localStorage
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  useEffect(() => {
    // Redirect non-admin users away from admin tab
    if (activeTab === 'admin' && !isAdmin(user?.email)) {
      setActiveTab('track')
    }
  }, [activeTab, user, setActiveTab])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    window.location.href = '/signin'
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        theme={theme} 
        setTheme={setTheme} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        user={user}
      />

      <main className={`flex-1 p-4 md:p-8 h-full overflow-hidden transition-colors duration-300 ${
        theme === 'dark' 
            ? 'bg-gray-800' 
            : 'bg-white'
      }`}>
        {activeTab === 'track' && <TrackTab theme={theme} setActiveTab={setActiveTab} />}
        {activeTab === 'withdraw' && <WithdrawTab theme={theme} />}
        {activeTab === 'wallets' && <WalletsTab theme={theme} onConnectWallet={() => setShowWalletModal(true)} />}
        {activeTab === 'mypage' && <MyPageTab theme={theme} user={user} onLogout={handleLogout} />}
        {activeTab === 'admin' && isAdmin(user?.email) && <AdminPanelTab theme={theme} />}
      </main>

      <WalletConnectModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)}
        theme={theme}
      />
    </div>
  )
}

