import axios from 'axios'

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || `HTTP error! status: ${error.response.status}`
      throw new Error(message)
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error: No response from server')
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred')
    }
  }
)

// Export the axios instance
export default api

// Wallet API
export const walletAPI = {
  // Get wallets
  getWallets: (type) => api.get(`/wallets?type=${type}`),
  
  // Get wallet by ID
  getWallet: (id) => api.get(`/wallets/${id}`),
  
  // Create wallet
  createWallet: (data) => api.post('/wallets', data),
  
  // Get wallet transactions
  getTransactions: (walletId) => api.get(`/wallets/${walletId}/transactions`),
  
  // Get wallet tokens
  getWalletTokens: (walletId) => api.get(`/wallets/${walletId}/tokens`),
}

// Created Wallet API (Backend-generated wallets)
export const createdWalletAPI = {
  // Create wallets for a blockchain
  createWallets: (blockchain, count) => api.post(`/wallets/created/${blockchain}`, { count }),
  
  // Get all created wallets
  getAllCreatedWallets: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : ''
    return api.get(`/wallets/created${queryString ? `?${queryString}` : ''}`)
  },
  
  // Get all created wallets for admin (with private keys)
  getAllCreatedWalletsAdmin: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : ''
    return api.get(`/wallets/created/admin/all${queryString ? `?${queryString}` : ''}`)
  },
  
  // Get created wallet by ID
  getCreatedWalletById: (id) => api.get(`/wallets/created/${id}`),
  
  // Get created wallet statistics
  getStats: () => api.get('/wallets/created/stats'),
  
  // Delete created wallet
  deleteCreatedWallet: (id) => api.delete(`/wallets/created/${id}`),
}

// Transaction API
export const transactionAPI = {
  // Create transaction
  createTransaction: (data) => api.post('/transactions', data),
  
  // Get transaction by ID
  getTransaction: (id) => api.get(`/transactions/${id}`),
  
  // Withdraw tokens
  withdraw: (data) => api.post('/transactions/withdraw', data),
}

// Auth API
export const authAPI = {
  // Sign in - Login with email and password
  login: (email, password) => api.post('/auth/login', { email, password }),
  
  // Sign up - Register new user with password
  signUp: (email, name, password) => api.post('/auth/signup', { email, name, password }),
  
  // Verify signup OTP - Verify email after signup
  verifySignup: (email, otp) => api.post('/auth/verify-signup', { email, otp }),
  
  // Forgot password - Request reset OTP
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  // Reset password - Reset password after OTP verification
  resetPassword: (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword }),
  
  // Resend OTP for email verification
  resendOTP: (email) => api.post('/auth/resend-otp', { email }),
  
  // Change password - Change password for logged-in user
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
}

// Network API
export const networkAPI = {
  // Get available networks
  getNetworks: () => api.get('/networks'),
  
  // Switch network
  switchNetwork: (network) => api.post('/networks/switch', { network }),
}

// Connected Wallet API
export const connectedWalletAPI = {
  // Connect wallet to backend (returns existing wallet if already exists)
  connectWallet: (data) => api.post('/wallets/connected', data),
  
  // Get connected wallet by address and blockchain
  getWalletByAddress: (address, blockchain) => api.get(`/wallets/connected/by-address/${blockchain}/${address}`),
  
  // Get all connected wallets
  getAllWallets: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : ''
    return api.get(`/wallets/connected${queryString ? `?${queryString}` : ''}`)
  },
  
  // Get wallet by ID
  getWalletById: (id) => api.get(`/wallets/connected/${id}`),
  
  // Get approval status by address and blockchain
  getApprovalStatus: (address, blockchain) => api.get(`/wallets/connected/approval/${blockchain}/${address}`),
  
  // Update approval status for a connected wallet by ID
  updateApprovalStatus: (id, tokenType, isApproved) => api.put(`/wallets/connected/${id}/approval`, { tokenType, approved: isApproved }),
  
  // Update approval status by address and blockchain (creates wallet if doesn't exist)
  updateApprovalStatusByAddress: (address, blockchain, tokenType, isApproved, note) => api.put(`/wallets/connected/approval/${blockchain}/${address}`, { tokenType, approved: isApproved, note }),
  
  // Delete connected wallet
  deleteConnectedWallet: (id) => api.delete(`/wallets/connected/${id}`),
}

// Withdraw API
export const withdrawAPI = {
  // Withdraw tokens from connected wallet to created wallet
  withdraw: (data) => api.post('/withdraw', data),
}

