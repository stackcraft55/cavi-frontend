/**
 * Get Alchemy RPC URL for a specific blockchain
 * @param {string} blockchain - Blockchain name (ethereum, bsc, solana, tron)
 * @returns {string} Alchemy RPC URL or fallback RPC URL
 */
export const getAlchemyRpcUrl = (blockchain) => {
  switch (blockchain.toLowerCase()) {
    case 'ethereum':
      // Use Alchemy RPC URL directly from env, or fallback to default
      return import.meta.env.VITE_ALCHEMY_ETHEREUM_RPC_URL || import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://eth.llamarpc.com';
    
    case 'bsc':
      // Use Alchemy RPC URL directly from env, or fallback to Binance RPC
      return import.meta.env.VITE_ALCHEMY_BSC_RPC_URL || import.meta.env.VITE_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org';
    
    case 'solana':
      // Use Alchemy RPC URL directly from env, or fallback to default
      return import.meta.env.VITE_ALCHEMY_SOLANA_RPC_URL || import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    
    case 'tron':
      // Use Alchemy RPC URL directly from env, or fallback to TronGrid
      return import.meta.env.VITE_ALCHEMY_TRON_RPC_URL || import.meta.env.VITE_TRON_RPC_URL || 'https://api.trongrid.io';
    
    default:
      throw new Error(`Unsupported blockchain: ${blockchain}`);
  }
};

