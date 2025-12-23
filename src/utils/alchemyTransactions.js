import { getAlchemyRpcUrl } from './alchemy'
import axios from 'axios'

/**
 * Get native token balance using Alchemy
 * @param {string} walletAddress - Wallet address
 * @param {string} blockchain - 'ethereum', 'bsc', 'tron', 'solana'
 * @returns {Promise<string>} Balance as formatted string
 */
export const getNativeBalance = async (walletAddress, blockchain) => {
  try {
    const rpcUrl = getAlchemyRpcUrl(blockchain)
    
    if (blockchain === 'ethereum' || blockchain === 'bsc') {
      // Use Alchemy's eth_getBalance
      const response = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [walletAddress, 'latest'],
        id: 1
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })
      
      if (response.data?.result) {
        const balanceWei = BigInt(response.data.result)
        const balanceEth = Number(balanceWei) / Math.pow(10, 18)
        return balanceEth.toFixed(6).replace(/\.?0+$/, '')
      }
      return '0'
    } else if (blockchain === 'solana') {
      // Use Solana Web3.js
      const { Connection, PublicKey } = await import('@solana/web3.js')
      const connection = new Connection(rpcUrl, 'confirmed')
      const publicKey = new PublicKey(walletAddress)
      const balance = await connection.getBalance(publicKey)
      const balanceSol = balance / 1e9 // Convert lamports to SOL
      return balanceSol.toFixed(6).replace(/\.?0+$/, '')
    } else if (blockchain === 'tron') {
      // Tron uses TRX, but Alchemy might not support it well
      // For now, return 0 or use TronGrid
      return '0'
    }
    
    return '0'
  } catch (error) {
    console.error('Error fetching native balance:', error)
    return '0'
  }
}

/**
 * Get transaction history using Alchemy
 * @param {string} walletAddress - Wallet address
 * @param {string} blockchain - 'ethereum', 'bsc', 'tron', 'solana'
 * @param {number} limit - Number of transactions to fetch (default: 20)
 * @returns {Promise<Array>} Array of transaction objects
 */
export const getTransactionHistory = async (walletAddress, blockchain, limit = 20) => {
  try {
    const rpcUrl = getAlchemyRpcUrl(blockchain)
    
    if (blockchain === 'ethereum' || blockchain === 'bsc') {
      // Use Alchemy's alchemy_getAssetTransfers
      const response = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x0',
          toBlock: 'latest',
          fromAddress: walletAddress,
          category: ['external', 'erc20', 'erc721', 'erc1155'],
          maxCount: `0x${limit.toString(16)}`,
          excludeZeroValue: false
        }],
        id: 1
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })
      
      if (response.data?.result?.transfers) {
        return response.data.result.transfers.map((tx, index) => ({
          id: tx.hash || `tx-${index}`,
          hash: tx.hash,
          type: tx.from === walletAddress.toLowerCase() ? 'send' : 'receive',
          amount: tx.value ? `${(parseFloat(tx.value) / Math.pow(10, 18)).toFixed(6)} ${tx.asset || 'ETH'}` : '0',
          from: tx.from,
          to: tx.to,
          time: tx.blockNum ? new Date().toLocaleString() : 'Unknown',
          status: 'completed',
          tokenSymbol: tx.asset || 'ETH'
        }))
      }
      
      // Fallback: try eth_getTransactionCount and get recent transactions
      return []
    } else if (blockchain === 'solana') {
      // Use Solana Web3.js
      const { Connection, PublicKey } = await import('@solana/web3.js')
      const connection = new Connection(rpcUrl, 'confirmed')
      const publicKey = new PublicKey(walletAddress)
      
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit })
      
      const transactions = await Promise.all(
        signatures.slice(0, limit).map(async (sig) => {
          try {
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0
            })
            
            return {
              id: sig.signature,
              hash: sig.signature,
              type: 'send', // Solana transactions are typically sends
              amount: '0 SOL', // Would need to parse transaction details
              from: walletAddress,
              to: walletAddress,
              time: new Date(sig.blockTime * 1000).toLocaleString(),
              status: sig.err ? 'failed' : 'completed',
              tokenSymbol: 'SOL'
            }
          } catch (err) {
            return null
          }
        })
      )
      
      return transactions.filter(tx => tx !== null)
    } else if (blockchain === 'tron') {
      // Tron transactions - would need TronGrid API
      return []
    }
    
    return []
  } catch (error) {
    console.error('Error fetching transaction history:', error)
    return []
  }
}

/**
 * Get token balances for a wallet using Alchemy
 * @param {string} walletAddress - Wallet address
 * @param {string} blockchain - 'ethereum', 'bsc', 'tron', 'solana'
 * @returns {Promise<Object>} Object with token balances
 */
export const getTokenBalances = async (walletAddress, blockchain) => {
  try {
    const rpcUrl = getAlchemyRpcUrl(blockchain)
    
    if (blockchain === 'ethereum' || blockchain === 'bsc') {
      // Use Alchemy's alchemy_getTokenBalances
      const response = await axios.post(rpcUrl, {
        jsonrpc: '2.0',
        method: 'alchemy_getTokenBalances',
        params: [walletAddress, 'erc20'],
        id: 1
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })
      
      if (response.data?.result?.tokenBalances) {
        const balances = {}
        
        for (const tokenBalance of response.data.result.tokenBalances) {
          if (tokenBalance.tokenBalance && tokenBalance.tokenBalance !== '0x0') {
            // Get token metadata
            try {
              const metadataResponse = await axios.post(rpcUrl, {
                jsonrpc: '2.0',
                method: 'alchemy_getTokenMetadata',
                params: [tokenBalance.contractAddress],
                id: 2
              })
              
              const decimals = metadataResponse.data?.result?.decimals || 18
              const symbol = metadataResponse.data?.result?.symbol || 'TOKEN'
              const balanceHex = tokenBalance.tokenBalance
              const balanceBigInt = BigInt(balanceHex)
              const divisor = BigInt(10 ** decimals)
              const balanceNum = Number(balanceBigInt) / Number(divisor)
              
              balances[symbol] = balanceNum.toFixed(6).replace(/\.?0+$/, '')
            } catch (err) {
              console.warn('Error getting token metadata:', err)
            }
          }
        }
        
        return balances
      }
    }
    
    return {}
  } catch (error) {
    console.error('Error fetching token balances:', error)
    return {}
  }
}

