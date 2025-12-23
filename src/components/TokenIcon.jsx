// Token Icon Component
import { useState } from 'react'

function TokenIcon({ symbol, className = "w-12 h-12" }) {
  const [imageErrors, setImageErrors] = useState({})

  const handleImageError = (tokenSymbol) => {
    setImageErrors(prev => ({ ...prev, [tokenSymbol]: true }))
  }

  const getTokenIcon = (symbol) => {
    const icons = {
      'ETH': (
        <div className={`${className} rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs`}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
          </svg>
        </div>
      ),
      'USDC': imageErrors.USDC ? (
        <div className={`${className} rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs`}>
          <span className="text-xs font-bold">USDC</span>
        </div>
      ) : (
        <img 
          src="https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png" 
          alt="USDC" 
          className={`${className} rounded-full object-cover`}
          onError={() => handleImageError('USDC')}
        />
      ),
      'USDT': imageErrors.USDT ? (
        <div className={`${className} rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xs`}>
          <span className="text-xs font-bold">USDT</span>
        </div>
      ) : (
        <img 
          src="https://s2.coinmarketcap.com/static/img/coins/64x64/825.png" 
          alt="USDT" 
          className={`${className} rounded-full object-cover`}
          onError={() => handleImageError('USDT')}
        />
      ),
      'WBTC': (
        <div className={`${className} rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs`}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.243 15.533.358 9.105 1.96 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546z"/>
          </svg>
        </div>
      ),
      'DAI': (
        <div className={`${className} rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-xs`}>
          <span className="text-xs font-bold">DAI</span>
        </div>
      ),
      'LINK': (
        <div className={`${className} rounded-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center text-white font-bold text-xs`}>
          <span className="text-xs font-bold">LINK</span>
        </div>
      ),
      'UNI': (
        <div className={`${className} rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-bold text-xs`}>
          <span className="text-xs font-bold">UNI</span>
        </div>
      ),
      'AAVE': (
        <div className={`${className} rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-xs`}>
          <span className="text-xs font-bold">AAVE</span>
        </div>
      ),
    }
    return icons[symbol] || (
      <div className={`${className} rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-xs`}>
        <span className="text-xs font-bold">{symbol}</span>
      </div>
    )
  }

  return getTokenIcon(symbol)
}

export default TokenIcon

