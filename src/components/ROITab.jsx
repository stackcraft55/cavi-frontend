import { useState, useEffect } from 'react'
import { useWalletContext } from '../contexts/WalletContext'
import { createdWalletAPI, roiAPI } from '../api/api'
import { networkToBlockchain } from '../utils/tokenContracts'
import { getNativeBalance } from '../utils/alchemyTransactions'
import { getUSDCUSDTBalances } from '../utils/tokenBalances'

export default function ROITab({ theme = 'dark' }) {
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [walletsB, setWalletsB] = useState([])
  const [searchB, setSearchB] = useState('')
  const [roiData, setRoiData] = useState(null)
  const [loadingROI, setLoadingROI] = useState(false)
  const [loadingWallets, setLoadingWallets] = useState(true)
  const [currentBalance, setCurrentBalance] = useState(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const { activeNetwork } = useWalletContext()

  // Fetch created wallets (Wallet B) from backend, filtered by active network
  useEffect(() => {
    const fetchCreatedWallets = async () => {
      setLoadingWallets(true)
      try {
        const blockchain = networkToBlockchain[activeNetwork] || 'ethereum'
        
        const response = await createdWalletAPI.getAllCreatedWallets({ blockchain })
        if (response.wallets && response.wallets.length > 0) {
          const walletNames = ['Business', 'Operations', 'Development', 'Marketing', 'Reserve', 'Staking', 'Trading', 'Savings', 'Investment', 'Personal']
          const transformedWallets = await Promise.all(
            response.wallets.map(async (wallet, index) => {
              const walletName = wallet.note || (walletNames[index % walletNames.length] + ` Wallet ${index + 1}`)
              const createdDate = new Date(wallet.createdAt).toISOString().split('T')[0]
              
              // Fetch balance using Alchemy
              let balanceDisplay = '0.00'
              try {
                const nativeBalance = await getNativeBalance(wallet.address, blockchain)
                const symbol = blockchain === 'ethereum' ? 'ETH' : blockchain === 'bsc' ? 'BNB' : blockchain === 'solana' ? 'SOL' : blockchain === 'tron' ? 'TRX' : ''
                balanceDisplay = `${nativeBalance} ${symbol}`
              } catch (err) {
                console.error('Error fetching balance for wallet:', wallet.address, err)
              }
              
              return {
                id: wallet.id || wallet._id,
                name: walletName,
                address: wallet.address,
                balance: balanceDisplay,
                createdDate: createdDate,
                blockchain: wallet.blockchain
              }
            })
          )
          setWalletsB(transformedWallets)
        } else {
          setWalletsB([])
        }
      } catch (err) {
        console.error('Error fetching created wallets:', err)
        setWalletsB([])
      } finally {
        setLoadingWallets(false)
      }
    }
    
    fetchCreatedWallets()
  }, [activeNetwork])

  // Fetch ROI data when wallet is selected
  useEffect(() => {
    const fetchROIData = async () => {
      if (selectedWallet && selectedWallet.id) {
        setLoadingROI(true)
        setLoadingBalance(true)
        try {
          const response = await roiAPI.getWalletROI(selectedWallet.id)
          setRoiData(response)
          
          // If no ROI records, fetch current balance
          if (!response.records || response.records.length === 0) {
            try {
              const blockchain = selectedWallet.blockchain || networkToBlockchain[activeNetwork] || 'ethereum'
              const balances = await getUSDCUSDTBalances(selectedWallet.address, blockchain)
              const totalBalance = parseFloat(balances.USDC || '0') + parseFloat(balances.USDT || '0')
              setCurrentBalance(totalBalance)
            } catch (err) {
              console.error('Error fetching current balance:', err)
              setCurrentBalance(0)
            }
          } else {
            setCurrentBalance(null)
          }
        } catch (err) {
          console.error('Error fetching ROI data:', err)
          setRoiData(null)
          setCurrentBalance(null)
        } finally {
          setLoadingROI(false)
          setLoadingBalance(false)
        }
      } else {
        setRoiData(null)
        setCurrentBalance(null)
      }
    }
    
    fetchROIData()
  }, [selectedWallet?.id, selectedWallet?.address, selectedWallet?.blockchain, activeNetwork])

  const filteredWalletsB = walletsB.filter(wallet =>
    wallet.address.toLowerCase().includes(searchB.toLowerCase()) ||
    wallet.name.toLowerCase().includes(searchB.toLowerCase())
  )

  const handleWalletSelect = (wallet) => {
    setSelectedWallet(wallet)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mx-auto h-full">
      {/* Wallet B Panel - Left */}
      <div className={`rounded-3xl shadow-2xl flex flex-col overflow-hidden hover:shadow-glow transition-all duration-300 h-full ${
        theme === 'dark' ? 'bg-gray-800 border border-gray-700/50' : 'bg-white border border-gray-200/50'
      }`}>
        <div className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white px-6 py-6 border-b border-white/20 relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse"></div>
          <h2 className="text-xl font-bold m-0 relative z-10 drop-shadow-md">Wallet B</h2>
        </div>
        <div className={`p-6 border-b flex-shrink-0 ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
          <input
            type="text"
            placeholder="Search wallet..."
            value={searchB}
            onChange={(e) => setSearchB(e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20 shadow-sm hover:shadow-md ${
              theme === 'dark' 
                ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-0">
          {loadingWallets ? (
            <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>Loading wallets...</p>
            </div>
          ) : filteredWalletsB.length === 0 ? (
            <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>No wallets found</p>
            </div>
          ) : (
            filteredWalletsB.map(wallet => (
              <div
                key={wallet.id}
                className={`p-4 m-2 rounded-xl cursor-pointer transition-all duration-300 border-2 flex justify-between items-center group ${
                  selectedWallet?.id === wallet.id
                    ? 'bg-gradient-to-r from-[#667eea]/15 to-[#764ba2]/15 border-[#667eea] shadow-lg translate-x-1 scale-[1.02]'
                    : theme === 'dark'
                      ? 'border-gray-700/50 hover:bg-gray-700/50 hover:border-[#667eea]/50 hover:shadow-md hover:translate-x-1'
                      : 'border-gray-200/50 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 hover:border-[#667eea]/50 hover:shadow-md hover:translate-x-1'
                }`}
                onClick={() => handleWalletSelect(wallet)}
              >
                <div className="flex-1">
                  <div className={`font-semibold mb-1 text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                    {wallet.name}
                  </div>
                  <div className={`text-xs font-mono mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                  </div>
                  {wallet.createdDate && (
                    <div className={`text-xs flex items-center gap-1 mt-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Created: {wallet.createdDate}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Profit Info Panel - Right (3/4 width) */}
      <div className={`rounded-3xl shadow-2xl border flex flex-col overflow-hidden hover:shadow-glow transition-all duration-300 h-full md:col-span-3 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700/50' : 'bg-white border-gray-200/50'
      }`}>
        <div className="bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] text-white px-6 py-6 border-b border-white/20 relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-pulse"></div>
          <h2 className="text-xl font-bold m-0 relative z-10 drop-shadow-md">Profit Information</h2>
        </div>
        {selectedWallet ? (
          <>
            <div className={`p-6 border-b flex-shrink-0 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                {selectedWallet.name}
              </div>
              <div className={`text-sm font-mono break-all px-3 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'text-gray-300 bg-gray-700/50 border-gray-600' 
                  : 'text-gray-600 bg-gray-50 border-gray-200'
              }`}>
                {selectedWallet.address}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
              {loadingROI ? (
                <div className={`p-12 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#667eea]"></div>
                  <p className="mt-2">Loading profit data...</p>
                </div>
              ) : roiData ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-6 rounded-2xl border ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-green-700/20 to-emerald-700/20 border-green-600/30'
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50'
                    }`}>
                      <div className={`text-xs font-bold mb-2 uppercase tracking-wider ${
                        theme === 'dark' ? 'text-green-300' : 'text-green-700'
                      }`}>
                        Total Profit
                      </div>
                      <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-green-100' : 'text-green-800'}`}>
                        ${parseFloat(roiData.summary?.totalProfit || '0').toFixed(6)}
                      </div>
                    </div>
                    <div className={`p-6 rounded-2xl border ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-purple-700/20 to-pink-700/20 border-purple-600/30'
                        : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/50'
                    }`}>
                      <div className={`text-xs font-bold mb-2 uppercase tracking-wider ${
                        theme === 'dark' ? 'text-purple-300' : 'text-purple-700'
                      }`}>
                        Cumulative Balance
                      </div>
                      <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-purple-100' : 'text-purple-800'}`}>
                        {loadingBalance ? (
                          <span className="text-lg">Loading...</span>
                        ) : roiData.summary?.latestROI?.cumulativeBalance ? (
                          `$${parseFloat(roiData.summary.latestROI.cumulativeBalance || '0').toFixed(6)}`
                        ) : currentBalance !== null ? (
                          `$${currentBalance.toFixed(6)}`
                        ) : (
                          '$0.000000'
                        )}
                      </div>
                      {!roiData.summary?.latestROI?.cumulativeBalance && currentBalance !== null && (
                        <div className={`text-xs mt-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                          Current Deposited Amount
                        </div>
                      )}
                    </div>
                    <div className={`p-6 rounded-2xl border ${
                      theme === 'dark'
                        ? 'bg-gradient-to-br from-blue-700/20 to-purple-700/20 border-blue-600/30'
                        : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200/50'
                    }`}>
                      <div className={`text-xs font-bold mb-2 uppercase tracking-wider ${
                        theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                      }`}>
                        Total Cycles
                      </div>
                      <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-blue-100' : 'text-blue-800'}`}>
                        {roiData.summary?.totalCycles || 0}
                      </div>
                    </div>
                  </div>

                  {/* Latest ROI */}
                  {roiData.summary?.latestROI && (
                    <div className={`p-6 rounded-2xl border ${
                      theme === 'dark'
                        ? 'bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10 border-[#667eea]/30'
                        : 'bg-gradient-to-r from-[#667eea]/5 to-[#764ba2]/5 border-[#667eea]/20'
                    }`}>
                      <div className={`text-sm font-bold mb-4 uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Latest ROI Cycle
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Date:</span>
                          <span className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                            {new Date(roiData.summary.latestROI.cycleDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Daily ROI:</span>
                          <span className={`font-semibold text-green-500`}>
                            {parseFloat(roiData.summary.latestROI.dailyROI || '0').toFixed(6)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Profit:</span>
                          <span className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                            ${parseFloat(roiData.summary.latestROI.profit || '0').toFixed(6)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Cumulative Balance:</span>
                          <span className={`font-semibold text-green-500`}>
                            ${parseFloat(roiData.summary.latestROI.cumulativeBalance || '0').toFixed(6)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Daily ROI Logs */}
                  {roiData.records && roiData.records.length > 0 && (
                    <div>
                      <div className={`text-lg font-bold mb-4 uppercase tracking-wider ${
                        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        Daily ROI Logs
                      </div>
                      <div className={`rounded-2xl border overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200/50'
                      }`}>
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-4">
                          <div className="space-y-3">
                            {roiData.records.map((record, index) => {
                              const date = new Date(record.cycleDate)
                              const formattedDate = date.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })
                              const formattedTime = date.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                              
                              return (
                                <div
                                  key={record._id || index}
                                  className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                                    theme === 'dark'
                                      ? 'bg-gray-700/50 border-gray-600/50 hover:bg-gray-700/70'
                                      : 'bg-white border-gray-200/50 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <div className={`text-base font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                                          {formattedDate}
                                        </div>
                                        <div className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                          theme === 'dark' 
                                            ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30' 
                                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                                        }`}>
                                          {parseFloat(record.dailyROI || '0').toFixed(6)}% ROI
                                        </div>
                                      </div>
                                      <div className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {formattedTime} • Cycle #{roiData.records.length - index}
                                      </div>
                                      <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div>
                                          <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                            Cumulative Balance
                                          </div>
                                          <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            ${parseFloat(record.cumulativeBalance || '0').toFixed(6)}
                                          </div>
                                        </div>
                                        <div>
                                          <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                            Profit Details
                                          </div>
                                          <div className={`text-sm font-bold text-green-500 mb-1`}>
                                            +${parseFloat(record.profit || '0').toFixed(6)}
                                          </div>
                                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Cumulative: ${parseFloat(record.cumulativeProfit || '0').toFixed(6)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {(!roiData.records || roiData.records.length === 0) && (
                    <div className={`p-12 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                      <p>No ROI records found for this wallet</p>
                      <p className="text-xs mt-2">ROI is calculated daily at 5 AM PKT</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`p-12 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  <p>No profit data available</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={`p-12 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            <p>Select a Wallet B to view profit information</p>
          </div>
        )}
      </div>
    </div>
  )
}

