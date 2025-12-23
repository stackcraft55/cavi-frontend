import { getAlchemyRpcUrl } from './alchemy'
import { getUSDCContract, getUSDTContract } from './tokenContracts'
import axios from 'axios'
// Import TronWeb - TronWeb v6 exports TronWeb as named export
import { TronWeb } from 'tronweb'

/**
 * Fetch token balance for different blockchains
 * @param {string} walletAddress - Wallet address to check balance for
 * @param {string} tokenContractAddress - Token contract address
 * @param {string} blockchain - 'ethereum', 'bsc', 'tron', or 'solana'
 * @returns {Promise<string>} Token balance as a formatted string
 */
export const getTokenBalance = async (walletAddress, tokenContractAddress, blockchain) => {
  try {
    // For EVM chains (Ethereum, BSC)
    if (blockchain === 'ethereum' || blockchain === 'bsc') {
      return await getEVMTokenBalance(walletAddress, tokenContractAddress, blockchain)
    }
    
    // For Tron
    if (blockchain === 'tron') {
      return await getTronTokenBalance(walletAddress, tokenContractAddress)
    }
    
    // For Solana
    if (blockchain === 'solana') {
      return await getSolanaTokenBalance(walletAddress, tokenContractAddress)
    }
    
    throw new Error(`Token balance fetching not supported for ${blockchain}`)
  } catch (error) {
    console.error('Error fetching token balance:', error)
    return '0'
  }
}

/**
 * Fetch ERC20 token balance for EVM chains using Alchemy RPC
 * @param {string} walletAddress - Wallet address to check balance for
 * @param {string} tokenContractAddress - ERC20 token contract address
 * @param {string} blockchain - 'ethereum' or 'bsc'
 * @returns {Promise<string>} Token balance as a formatted string
 */
const getEVMTokenBalance = async (walletAddress, tokenContractAddress, blockchain) => {
  try {
    // Get Alchemy RPC URL
    const rpcUrl = getAlchemyRpcUrl(blockchain)
    
    // For Ethereum, try Alchemy's enhanced API first
    if (blockchain === 'ethereum') {
      try {
        const response = await axios.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'alchemy_getTokenBalances',
          params: [walletAddress, [tokenContractAddress]],
          id: 1
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data?.result?.tokenBalances?.[0]) {
          const tokenBalance = response.data.result.tokenBalances[0]
          
          // Check if balance is available (not null)
          if (tokenBalance.tokenBalance && tokenBalance.tokenBalance !== '0x') {
            // Get token metadata for decimals
            const metadataResponse = await axios.post(rpcUrl, {
              jsonrpc: '2.0',
              method: 'alchemy_getTokenMetadata',
              params: [tokenContractAddress],
              id: 2
            })
            
            const decimals = metadataResponse.data?.result?.decimals || 18
            const balanceHex = tokenBalance.tokenBalance
            
            // Convert hex to BigInt, then to number
            const balanceBigInt = BigInt(balanceHex)
            const divisor = BigInt(10 ** decimals)
            const balanceNum = Number(balanceBigInt) / Number(divisor)
            
            return balanceNum.toFixed(6).replace(/\.?0+$/, '')
          }
        }
      } catch (alchemyError) {
        console.warn('Alchemy API call failed, falling back to direct contract call:', alchemyError)
      }
    }
    
    // Fallback to direct contract call (works for BSC and as fallback for Ethereum)
    const ethers = await import('ethers')
    
    // Create provider
    let provider
    if (ethers.JsonRpcProvider) {
      // ethers v6
      provider = new ethers.JsonRpcProvider(rpcUrl)
    } else {
      // ethers v5
      provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    }
    
    // ERC20 ABI for balanceOf and decimals
    const erc20ABI = [
      {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function'
      },
      {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        type: 'function'
      }
    ]
    
    // Create contract instance
    const tokenContract = new ethers.Contract(tokenContractAddress, erc20ABI, provider)
    
    // Get balance and decimals
    const [balance, decimals] = await Promise.all([
      tokenContract.balanceOf(walletAddress),
      tokenContract.decimals()
    ])
    
    // Format balance
    let formattedBalance
    if (ethers.formatUnits) {
      // ethers v6
      formattedBalance = ethers.formatUnits(balance, decimals)
    } else {
      // ethers v5
      formattedBalance = ethers.utils.formatUnits(balance, decimals)
    }
    
    // Parse to number and format with appropriate decimal places
    const balanceNum = parseFloat(formattedBalance)
    
    // Format with up to 6 decimal places, remove trailing zeros
    return balanceNum.toFixed(6).replace(/\.?0+$/, '')
  } catch (error) {
    console.error('Error fetching EVM token balance:', error)
    throw error
  }
}

/**
 * Fetch TRC20 token balance for Tron
 * @param {string} walletAddress - Tron wallet address
 * @param {string} tokenContractAddress - TRC20 token contract address
 * @returns {Promise<string>} Token balance as a formatted string
 */
const getTronTokenBalance = async (walletAddress, tokenContractAddress) => {
  try {
    console.log('Fetching Tron token balance:', {
      walletAddress,
      tokenContractAddress
    })
    
    // Use Alchemy's alchemy_getTokenBalances API for Tron
    const rpcUrl = getAlchemyRpcUrl('tron')
    
    // Use Alchemy's enhanced API to get token balances
    const response = await axios.post(rpcUrl, {
      jsonrpc: '2.0',
      method: 'alchemy_getTokenBalances',
      params: [walletAddress, [tokenContractAddress]], // Pass specific token address
      id: 1
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })
    
    // Check for Alchemy API errors
    if (response.data?.error) {
      const errorMessage = response.data.error.message || ''
      
      // Check if Enhanced APIs are not enabled (e.g., on testnet)
      if (errorMessage.includes('EAPIs not enabled') || errorMessage.includes('not enabled')) {
        console.warn('Alchemy Enhanced APIs not available for this network, returning 0:', errorMessage)
        return '0'
      }
      
      // Other errors
      console.error('Alchemy API error:', response.data.error)
      return '0'
    }
    
    if (response.data?.result?.tokenBalances?.[0]) {
      const tokenBalance = response.data.result.tokenBalances[0]
      
      // Check if balance is available (not null)
      if (tokenBalance.tokenBalance) {
        // Get token metadata for decimals
        const metadataResponse = await axios.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'alchemy_getTokenMetadata',
          params: [tokenContractAddress],
          id: 2
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        })
        
        // Check for metadata API errors
        if (metadataResponse.data?.error) {
          console.warn('Alchemy metadata API error, using default decimals:', metadataResponse.data.error)
        }
        
        const decimals = metadataResponse.data?.result?.decimals || 6
        const balanceHex = tokenBalance.tokenBalance
        
        // Convert hex to BigInt, then to number
        const balanceBigInt = BigInt(balanceHex)
        const divisor = BigInt(10 ** decimals)
        const balanceNum = Number(balanceBigInt) / Number(divisor)
        
        return balanceNum.toFixed(6).replace(/\.?0+$/, '')
      } else {
        // Token balance is null, means balance is 0
        return '0'
      }
    } else {
      // No token balance found
      return '0'
    }
  } catch (error) {
    console.error('Error fetching Tron token balance:', {
      error,
      errorType: typeof error,
      message: error?.message,
      response: error?.response?.data,
      stack: error?.stack,
      walletAddress,
      tokenContractAddress
    })
    
    // Check if error is about Enhanced APIs not being enabled
    if (error?.response?.data?.error?.message?.includes('EAPIs not enabled')) {
      console.warn('Alchemy Enhanced APIs not available for this network')
      return '0'
    }
    
    // Return '0' instead of throwing to prevent UI errors
    return '0'
  }
}

/**
 * Fetch SPL token balance for Solana
 * @param {string} walletAddress - Solana wallet address (base58 string)
 * @param {string} tokenContractAddress - SPL token mint address
 * @returns {Promise<string>} Token balance as a formatted string
 */
const getSolanaTokenBalance = async (walletAddress, tokenContractAddress) => {
  try {
    const { Connection, PublicKey } = await import('@solana/web3.js')
    const { getAssociatedTokenAddress, getAccount } = await import('@solana/spl-token')
    
    // Get Alchemy RPC URL for Solana
    const rpcUrl = getAlchemyRpcUrl('solana')
    
    // Create connection using Alchemy RPC
    const connection = new Connection(rpcUrl, 'confirmed')
    
    // Convert addresses to PublicKey
    const walletPublicKey = new PublicKey(walletAddress)
    const tokenMint = new PublicKey(tokenContractAddress)
    
    // Get associated token account address
    const tokenAccountAddress = await getAssociatedTokenAddress(
      tokenMint,
      walletPublicKey
    )
    
    // Get token account info
    try {
      const tokenAccount = await getAccount(connection, tokenAccountAddress)
      
      // Get decimals from mint
      const mintInfo = await connection.getParsedAccountInfo(tokenMint)
      const decimals = mintInfo.value?.data?.parsed?.info?.decimals || 6
      
      // Convert balance (stored as BigInt) to readable format
      const balanceNum = Number(tokenAccount.amount) / Math.pow(10, decimals)
      
      // Format with up to 6 decimal places, remove trailing zeros
      return balanceNum.toFixed(6).replace(/\.?0+$/, '')
    } catch (accountError) {
      // Token account doesn't exist, balance is 0
      if (accountError.message?.includes('InvalidAccountData') || 
          accountError.message?.includes('could not find account')) {
        return '0'
      }
      throw accountError
    }
  } catch (error) {
    console.error('Error fetching Solana token balance:', error)
    throw error
  }
}

/**
 * Fetch USDC and USDT balances for a wallet
 * @param {string} walletAddress - Wallet address
 * @param {string} blockchain - 'ethereum', 'bsc', 'tron', or 'solana'
 * @returns {Promise<Object>} Object with usdc and usdt balances
 */
export const getUSDCUSDTBalances = async (walletAddress, blockchain) => {
  try {
    // Get contract addresses from env based on selected blockchain
    const usdcContract = getUSDCContract(blockchain)
    const usdtContract = getUSDTContract(blockchain)
    
    // Log for debugging
    console.log(`Fetching token balances for ${blockchain}:`, {
      walletAddress,
      usdcContract,
      usdtContract
    })
    
    // Validate contract addresses are configured
    if (!usdcContract && !usdtContract) {
      console.warn(`No USDC/USDT contract addresses configured for ${blockchain}`)
      return {
        USDC: '0',
        USDT: '0'
      }
    }
    
    const balances = {
      USDC: '0',
      USDT: '0'
    }
    
    // Fetch USDC balance if contract address is configured
    if (usdcContract) {
      try {
        balances.USDC = await getTokenBalance(walletAddress, usdcContract, blockchain)
      } catch (error) {
        console.error(`Error fetching USDC balance for ${blockchain}:`, error)
        balances.USDC = '0'
      }
    } else {
      console.warn(`USDC contract address not configured for ${blockchain}. Set VITE_USDC_CONTRACT_${blockchain.toUpperCase()} in .env`)
    }
    
    // Fetch USDT balance if contract address is configured
    if (usdtContract) {
      try {
        balances.USDT = await getTokenBalance(walletAddress, usdtContract, blockchain)
      } catch (error) {
        console.error(`Error fetching USDT balance for ${blockchain}:`, error)
        balances.USDT = '0'
      }
    } else {
      console.warn(`USDT contract address not configured for ${blockchain}. Set VITE_USDT_CONTRACT_${blockchain.toUpperCase()} in .env`)
    }
    
    return balances
  } catch (error) {
    console.error('Error fetching USDC/USDT balances:', error)
    return {
      USDC: '0',
      USDT: '0'
    }
  }
}

