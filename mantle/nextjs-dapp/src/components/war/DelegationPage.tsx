'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, CheckCircle, Loader2, ExternalLink, Lock, Zap } from 'lucide-react'
import Image from 'next/image'

interface DelegationPageProps {
  userAddress: string
  leaderAddress: string
  leaderName: string
  leaderImage: string
  onDelegationComplete: (txHash: string, amount: number) => void
  onSkip?: () => void
}

export function DelegationPage({
  userAddress,
  leaderAddress,
  leaderName,
  leaderImage,
  onDelegationComplete,
  onSkip
}: DelegationPageProps) {
  const [step, setStep] = useState<'intro' | 'signing' | 'confirming' | 'success' | 'error'>('intro')
  const [txHash, setTxHash] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [walletReady, setWalletReady] = useState<boolean>(false)
  const [checking, setChecking] = useState<boolean>(true)
  const [delegationAmount, setDelegationAmount] = useState<string>('0.1') // Editable amount
  const [balance, setBalance] = useState<string>('0')

  // Check wallet status on mount
  useEffect(() => {
    checkWalletStatus()
  }, [])

  const checkWalletStatus = async () => {
    setChecking(true)
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        setWalletReady(false)
        setError('MetaMask not detected. Please install MetaMask extension.')
        setChecking(false)
        return
      }

      // Check if accounts are connected
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (!accounts || accounts.length === 0) {
        setWalletReady(false)
        setError('Wallet not connected. Please connect your MetaMask wallet.')
        setChecking(false)
        return
      }

      // Check network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      const mantleSepolia = '0x138b' // 5003 in hex
      if (chainId !== mantleSepolia) {
        setWalletReady(false)
        setError('Wrong network. Please switch to Mantle Sepolia in MetaMask.')
        setChecking(false)
        return
      }

      // Get balance
      try {
        const balanceWei = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [userAddress, 'latest']
        })
        const balanceEth = parseInt(balanceWei, 16) / 1e18
        setBalance(balanceEth.toFixed(4))
        console.log('💰 Wallet balance:', balanceEth.toFixed(4), 'MNT')
      } catch (err) {
        console.error('Failed to get balance:', err)
        setBalance('0')
      }

      setWalletReady(true)
      setError('')
      console.log('✅ Wallet ready for delegation')
    } catch (err: any) {
      console.error('Wallet check failed:', err)
      setWalletReady(false)
      setError('Failed to check wallet status')
    }
    setChecking(false)
  }

  const handleDelegate = async () => {
    try {
      // Validate amount
      const amount = parseFloat(delegationAmount)
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount greater than 0')
        return
      }

      const balanceNum = parseFloat(balance)
      if (amount > balanceNum) {
        setError(`Insufficient balance. You have ${balance} MNT`)
        return
      }

      setStep('signing')
      setError('')
      
      // Check if MetaMask is installed
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask extension to continue.')
      }
      
      // Import the real blockchain function
      const { delegateToLeader } = await import('@/lib/warBattleContract')
      
      console.log('🔐 Starting delegation process...')
      console.log('👤 From:', userAddress)
      console.log('👑 To:', leaderAddress)
      console.log('💰 Amount:', delegationAmount, 'MNT')
      
      // Execute REAL blockchain transaction
      // This will trigger MetaMask popup
      const result = await delegateToLeader(leaderAddress, delegationAmount)
      
      if (!result.success) {
        throw new Error(result.error || 'Transaction failed')
      }
      
      setStep('confirming')
      setTxHash(result.txHash || '')
      
      console.log('✅ Transaction confirmed!')
      console.log('📝 Tx Hash:', result.txHash)
      
      // Wait a bit to show confirmation
      setTimeout(() => {
        setStep('success')
        setTimeout(() => {
          onDelegationComplete(result.txHash || '', parseFloat(delegationAmount))
        }, 2000)
      }, 1500)
      
    } catch (err: any) {
      console.error('❌ Delegation failed:', err)
      setError(err.message || 'Transaction failed')
      setStep('error')
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-950 via-black to-red-950 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-2xl w-full my-8"
          >
            <div className="bg-gradient-to-br from-purple-900/90 to-red-900/90 backdrop-blur-xl rounded-3xl p-8 border-4 border-yellow-500 shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-block p-4 bg-yellow-500/20 rounded-full mb-4">
                  <Shield className="w-16 h-16 text-yellow-500" />
                </div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Grant Permission (ERC-7715)
                </h1>
                <p className="text-xl text-gray-300">
                  Contribute to team pool - funds stay with you!
                </p>
              </div>

              {/* Team Leader Info */}
              <div className="bg-black/50 rounded-2xl p-6 mb-6 border-2 border-yellow-500/30">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative w-20 h-20">
                    <Image
                      src={leaderImage}
                      alt={leaderName}
                      fill
                      className="object-cover rounded-full border-4 border-yellow-500"
                      unoptimized
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Contributing to</div>
                    <div className="text-2xl font-bold text-yellow-400">Team Pool</div>
                    <div className="text-xs text-gray-500">Democratic voting system</div>
                  </div>
                </div>
              </div>

              {/* Delegation Details */}
              <div className="bg-black/50 rounded-2xl p-6 mb-6 border-2 border-purple-500/30">
                <h3 className="text-lg font-bold mb-4 text-purple-400">Transaction Details</h3>
                
                <div className="space-y-4">
                  {/* Editable Amount Input */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Maximum Amount (Funds stay in your wallet!):</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        max={balance}
                        value={delegationAmount}
                        onChange={(e) => setDelegationAmount(e.target.value)}
                        className="w-full bg-black/70 border-2 border-purple-500/50 rounded-lg px-4 py-3 text-2xl font-bold text-green-400 focus:border-purple-500 focus:outline-none"
                        placeholder="0.1"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                        MNT
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs">
                      <span className="text-gray-500">Your balance: {balance} MNT</span>
                      <button
                        onClick={() => {
                          const maxAmount = Math.max(0, parseFloat(balance) - 0.01) // Leave some for gas
                          setDelegationAmount(maxAmount.toFixed(4))
                        }}
                        className="text-purple-400 hover:text-purple-300 font-semibold"
                      >
                        Use Max
                      </button>
                    </div>
                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {['0.05', '0.1', '0.5', '1.0'].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setDelegationAmount(amount)}
                          className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                            delegationAmount === amount
                              ? 'bg-purple-600 text-white border-2 border-purple-400'
                              : 'bg-black/50 text-gray-400 border border-gray-600 hover:border-purple-500 hover:text-purple-400'
                          }`}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                    <span className="text-gray-400">Duration:</span>
                    <span className="font-bold text-white">24 hours</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Contract:</span>
                    <span className="text-xs font-mono text-blue-400">TeamDelegation</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Network:</span>
                    <span className="font-bold text-white">Mantle Sepolia</span>
                  </div>
                </div>
              </div>

              {/* What This Means */}
              <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div className="text-sm text-gray-300">
                    <p className="font-semibold text-blue-400 mb-1">What happens (ERC-7715 Style):</p>
                    <ul className="space-y-1 text-xs">
                      <li>• ✅ Your {delegationAmount} MNT STAYS in YOUR wallet!</li>
                      <li>• ✅ You only grant PERMISSION to spend (no transfer!)</li>
                      <li>• ✅ Funds are spent ONLY when weapons are used</li>
                      <li>• ✅ You can revoke permission anytime</li>
                      <li>• ✅ No refund needed - funds never left your wallet!</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Lock className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                  <div className="text-sm text-gray-300">
                    <p className="font-semibold text-green-400 mb-1">🎉 Your Funds Stay Safe:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• 💰 Funds remain in YOUR wallet (not transferred!)</li>
                      <li>• ✅ Only spent when team leader uses weapons</li>
                      <li>• 🚨 Instant revoke - no waiting for refunds</li>
                      <li>• 🔐 You control your funds at all times</li>
                      <li>• 📊 All transactions are on-chain and verifiable</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Wallet Status Check */}
              {!walletReady && !checking && (
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-400 mb-1">Wallet Issue Detected</p>
                      <p className="text-sm text-gray-300 mb-3">{error}</p>
                      <button
                        onClick={checkWalletStatus}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                      >
                        Retry Wallet Check
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {checking && (
                <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                    <span className="text-sm text-gray-300">Checking wallet status...</span>
                  </div>
                </div>
              )}

              {walletReady && (
                <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-gray-300">✅ Wallet ready! You can proceed with delegation.</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleDelegate}
                  disabled={!walletReady || checking || parseFloat(delegationAmount) <= 0 || parseFloat(delegationAmount) > parseFloat(balance)}
                  className={`w-full font-bold py-4 px-6 rounded-xl text-xl transition-all transform shadow-lg flex items-center justify-center space-x-2 ${
                    walletReady && !checking && parseFloat(delegationAmount) > 0 && parseFloat(delegationAmount) <= parseFloat(balance)
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:scale-105 cursor-pointer'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Shield className="w-6 h-6" />
                  <span>
                    {checking 
                      ? 'Checking Wallet...' 
                      : !walletReady 
                      ? 'Fix Wallet Issues First'
                      : parseFloat(delegationAmount) <= 0
                      ? 'Enter Amount to Grant'
                      : parseFloat(delegationAmount) > parseFloat(balance)
                      ? 'Insufficient Balance'
                      : `Grant Permission for ${delegationAmount} MNT`
                    }
                  </span>
                </button>
                
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    Skip (Watch Only Mode)
                  </button>
                )}
              </div>

              <p className="text-xs text-center text-gray-500 mt-4">
                By granting permission, you allow the team leader to spend up to {delegationAmount} MNT from your wallet for team weapons. Your funds stay in your wallet until actually spent!
              </p>
            </div>
          </motion.div>
        )}

        {step === 'signing' && (
          <motion.div
            key="signing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-md w-full"
          >
            <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl rounded-3xl p-8 border-4 border-blue-500 shadow-2xl text-center">
              <div className="inline-block p-4 bg-blue-500/20 rounded-full mb-6 animate-pulse">
                <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4 text-white">
                Waiting for Signature
              </h2>
              
              <p className="text-lg text-gray-300 mb-6">
                Please confirm the transaction in MetaMask
              </p>
              
              <div className="bg-black/50 rounded-xl p-4 mb-4">
                <div className="text-sm text-gray-400 mb-2">Delegating to:</div>
                <div className="font-bold text-yellow-400">{leaderName}</div>
                <div className="text-xs text-gray-500 font-mono mt-1">{leaderAddress}</div>
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Check your MetaMask extension...</span>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'confirming' && (
          <motion.div
            key="confirming"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-md w-full"
          >
            <div className="bg-gradient-to-br from-purple-900/90 to-green-900/90 backdrop-blur-xl rounded-3xl p-8 border-4 border-green-500 shadow-2xl text-center">
              <div className="inline-block p-4 bg-green-500/20 rounded-full mb-6 animate-pulse">
                <Loader2 className="w-16 h-16 text-green-400 animate-spin" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4 text-white">
                Confirming Transaction
              </h2>
              
              <p className="text-lg text-gray-300 mb-6">
                Your transaction is being confirmed on the blockchain
              </p>
              
              {txHash && (
                <div className="bg-black/50 rounded-xl p-4 mb-4">
                  <div className="text-sm text-gray-400 mb-2">Transaction Hash:</div>
                  <div className="text-xs font-mono text-green-400 break-all">{txHash}</div>
                  <a
                    href={`https://explorer.sepolia.mantle.xyz/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm mt-2"
                  >
                    <span>View on Explorer</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
              
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Waiting for block confirmation...</span>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="max-w-md w-full"
          >
            <div className="bg-gradient-to-br from-green-900/90 to-emerald-900/90 backdrop-blur-xl rounded-3xl p-8 border-4 border-green-500 shadow-2xl text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="inline-block p-4 bg-green-500/20 rounded-full mb-6"
              >
                <CheckCircle className="w-16 h-16 text-green-400" />
              </motion.div>
              
              <h2 className="text-3xl font-bold mb-4 text-white">
                Permission Granted! 🎉
              </h2>
              
              <p className="text-lg text-gray-300 mb-6">
                You've successfully granted permission for {delegationAmount} MNT. Your funds stay in your wallet!
              </p>
              
              {txHash && (
                <div className="bg-black/50 rounded-xl p-4 mb-4">
                  <div className="text-sm text-gray-400 mb-2">Transaction Hash:</div>
                  <div className="text-xs font-mono text-green-400 break-all mb-2">{txHash}</div>
                  <a
                    href={`https://explorer.sepolia.mantle.xyz/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    <span>View on Explorer</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
              
              <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-4">
                <p className="text-sm text-gray-300">
                  ✅ Permission granted - funds stay in YOUR wallet<br />
                  ✅ Funds will be spent only when weapons are used<br />
                  ✅ You can revoke permission anytime<br />
                  ✅ Entering battle arena...
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-md w-full"
          >
            <div className="bg-gradient-to-br from-red-900/90 to-orange-900/90 backdrop-blur-xl rounded-3xl p-8 border-4 border-red-500 shadow-2xl text-center">
              <div className="inline-block p-4 bg-red-500/20 rounded-full mb-6">
                <AlertTriangle className="w-16 h-16 text-red-400" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4 text-white">
                Transaction Failed
              </h2>
              
              <p className="text-lg text-gray-300 mb-6">
                {error || 'Something went wrong with the transaction'}
              </p>
              
              <div className="bg-black/50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-400">
                  Common reasons:
                </p>
                <ul className="text-xs text-gray-500 mt-2 space-y-1 text-left">
                  <li>• Transaction was rejected in MetaMask</li>
                  <li>• Insufficient MNT balance</li>
                  <li>• Network connection issues</li>
                  <li>• Gas estimation failed</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleDelegate}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
                >
                  Try Again
                </button>
                
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    Skip for Now
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
