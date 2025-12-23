/**
 * Get token contract address for a specific blockchain and token type
 * @param {string} blockchain - Blockchain name (ethereum, bsc, tron, solana)
 * @param {string} tokenType - Token type (USDC, USDT)
 * @returns {string|null} Contract address or null if not configured
 */
export const getTokenContractAddress = (blockchain, tokenType) => {
  const blockchainUpper = blockchain.toUpperCase();
  const tokenTypeUpper = tokenType.toUpperCase();
  
  const envKey = `VITE_${tokenTypeUpper}_CONTRACT_${blockchainUpper}`;
  return import.meta.env[envKey] || null;
};

/**
 * Get USDC contract address for a blockchain
 * @param {string} blockchain - Blockchain name
 * @returns {string|null} USDC contract address
 */
export const getUSDCContract = (blockchain) => {
  return getTokenContractAddress(blockchain, 'USDC');
};

/**
 * Get USDT contract address for a blockchain
 * @param {string} blockchain - Blockchain name
 * @returns {string|null} USDT contract address
 */
export const getUSDTContract = (blockchain) => {
  return getTokenContractAddress(blockchain, 'USDT');
};

/**
 * Get all token contracts for a blockchain
 * @param {string} blockchain - Blockchain name
 * @returns {Object} Object with USDC and USDT contract addresses
 */
export const getTokenContracts = (blockchain) => {
  return {
    USDC: getUSDCContract(blockchain),
    USDT: getUSDTContract(blockchain)
  };
};

/**
 * Map frontend network names to backend blockchain names
 */
export const networkToBlockchain = {
  'Ether': 'ethereum',
  'BSC': 'bsc',
  'Tron': 'tron',
  'Solana': 'solana'
};

/**
 * Get backend wallet address for a specific blockchain from env
 * @param {string} blockchain - Blockchain name (ethereum, bsc, tron, solana)
 * @returns {string|null} Backend wallet address or null if not configured
 */
export const getBackendWalletAddress = (blockchain) => {
  const blockchainUpper = blockchain.toUpperCase();
  const envKey = `VITE_BACKEND_WALLET_${blockchainUpper}`;
  return import.meta.env[envKey] || null;
};

