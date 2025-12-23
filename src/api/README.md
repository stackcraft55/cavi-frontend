# Simple API Structure

## Overview
This is a simple, clean API structure for the CAVI wallet application.

## Usage

### Basic API Calls

```javascript
import { api } from './api/api'

// GET request
const data = await api.get('/wallets')

// POST request
const result = await api.post('/wallets', { name: 'My Wallet' })

// PUT request
await api.put('/wallets/123', { name: 'Updated Wallet' })

// DELETE request
await api.delete('/wallets/123')
```

### Wallet API

```javascript
import { walletAPI } from './api/api'

// Get all wallets
const wallets = await walletAPI.getWallets('A')

// Get single wallet
const wallet = await walletAPI.getWallet('A1')

// Create wallet
const newWallet = await walletAPI.createWallet({
  name: 'New Wallet',
  type: 'B'
})

// Get transactions
const transactions = await walletAPI.getTransactions('A1')

// Get tokens
const tokens = await walletAPI.getWalletTokens('A1')
```

### Transaction API

```javascript
import { transactionAPI } from './api/api'

// Create transaction
const transaction = await transactionAPI.createTransaction({
  from: '0x123...',
  to: '0x456...',
  amount: '1.5',
  token: 'ETH'
})

// Withdraw tokens
await transactionAPI.withdraw({
  fromWallet: 'A1',
  toWallet: 'B1',
  tokens: [
    { symbol: 'ETH', amount: '1.5' }
  ]
})
```

### Auth API

```javascript
import { authAPI } from './api/api'

// Connect wallet
await authAPI.connectWallet('0x123...')

// Get connection status
const status = await authAPI.getStatus()

// Disconnect
await authAPI.disconnect()
```

### Network API

```javascript
import { networkAPI } from './api/api'

// Get networks
const networks = await networkAPI.getNetworks()

// Switch network
await networkAPI.switchNetwork('Ether')
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Error Handling

All API calls throw errors that can be caught:

```javascript
try {
  const wallets = await walletAPI.getWallets('A')
} catch (error) {
  console.error('Error fetching wallets:', error.message)
}
```

## Authentication

Tokens are automatically added from localStorage if available:
- Token key: `authToken`
- Header format: `Authorization: Bearer <token>`

