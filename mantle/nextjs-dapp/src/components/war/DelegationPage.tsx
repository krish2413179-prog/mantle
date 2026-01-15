'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, CheckCircle, Loader2, ExternalLink, Lock, Zap, ArrowRight } from 'lucide-react'
import Image from 'next/image'

const GAME_PAYMENT_ADDRESS = process.env.NEXT_PUBLIC_GAME_PAYMENT_ADDRESS!

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
  // Step: 'intro' | 'wrap' | 'approve' | 'grant' | 'success' | 'error'
  const [currentStep, setCurrentStep] = useState<'intro' | 'wrap' | 'approve' | 'grant' | 'success' | 'error'>('intro')
  const [processing, setProcessing] = useState(false)
  const [txHash, setTxHash] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [delegationAmount, setDelegationAmount] = useState<string>('0.1')
  const [balance, setBalance] = useState<string>('0')
  const [wmantleBalance, setWmantleBalance] = useState<string>('0')
  const [allowance, setAllowance] = useState<string>('0')
  
  // Check balances on mount and after each step
  useEffect(() => {
    checkBalances()
  }, [currentStep])

  const checkBalances = async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) return
      
      // Get MNT balance
      const balanceWei = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [userAddress, 'latest']
      })
      const balanceEth = parseInt(balanceWei, 16) / 1e18
      setBalance(balanceEth.toFixed(4))
      
      // Get WMANTLE balance and allowance
      const { getWMANTLEBalance, getWMANTLEAllowance } = await import('@/lib/warBattleContract')
      const wBalance = await getWMANTLEBalance(userAddress)
      const wAllowance = await getWMANTLEAllowance(userAddress)
      
      setWmantleBalance(wBalance)
      setAllowance(wAllowance)
      
      console.log('💰 Balances:', { mnt: balance, wmantle: wBalance, allowance: wAllowance })
    } catch (err) {
      console.error('Failed to check balances:', err)
    }
  }

  const handleWrap = async () => {
    try {
      setProcessing(true)
      setError('')
      
      const { wrapMNT } = await import('@/lib/warBattleContract')
      const result = await wrapMNT(delegationAmount)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to wrap MNT')
      }
      
      setTxHash(result.txHash || '')
      await checkBalances()
      setCurrentStep('approve')
      setProcessing(false)
    } catch (err: any) {
      console.error('Wrap failed:', err)
      setError(err.message || 'Failed to wrap MNT')
      setProcessing(false)
    }
  }

  const handleApprove = async () => {
    try {
      setProcessing(true)
      setError('')
      
      const { approveWMANTLE } = await import('@/lib/warBattleContract')
      const result = await approveWMANTLE(GAME_PAYMENT_ADDRESS, delegationAmount)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve')
      }
      
      setTxHash(result.txHash || '')
      await checkBalances()
      setCurrentStep('grant')
      setProcessing(false)
    } catch (err: any) {
      console.error('Approve failed:', err)
      setError(err.message || 'Failed to approve')
      setProcessing(false)
    }
  }

  const handleGrant = async () => {
    try {
      setProcessing(true)
      setError('')
      
      const { grantPermissionToLeader } = await import('@/lib/warBattleContract')
      const result = await grantPermissionToLeader(leaderAddress, delegationAmount)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to grant permission')
      }
      
      setTxHash(result.txHash || '')
      setCurrentStep('success')
      setProcessing(false)
      
      // Complete after 2 seconds
      setTimeout(() => {
        onDelegationComplete(result.txHash || '', parseFloat(delegationAmount))
      }, 2000)
    } catch (err: any) {
      console.error('Grant failed:', err)
      setError(err.message || 'Failed to grant permission')
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-950 via-black to-red-950 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full my-8">
        <div className="bg-gradient-to-br from-purple-900/90 to-red-900/90 backdrop-blur-xl rounded-3xl p-8 border-4 border-yellow-500 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-yellow-500/20 rounded-full mb-4">
              <Shield className="w-16 h-16 text-yellow-500" />
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Grant Permission (TRUE ERC-7715)
            </h1>
            <p className="text-xl text-gray-300">
              3 Simple Steps - Money Stays in Your Wallet!
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between items-center mb-8">
            <div className={`flex-1 text-center ${currentStep === 'wrap' || currentStep === 'approve' || currentStep === 'grant' || currentStep === 'success' ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${currentStep === 'wrap' || currentStep === 'approve' || currentStep === 'grant' || currentStep === 'success' ? 'bg-green-500' : 'bg-gray-700'}`}>
                {currentStep === 'wrap' || currentStep === 'approve' || currentStep === 'grant' || currentStep === 'success' ? '✓' : '1'}
              </div>
              <div className="text-xs font-semibold">Wrap MNT</div>
            </div>
            <ArrowRight className="text-gray-500" />
            <div className={`flex-1 text-center ${currentStep === 'approve' || currentStep === 'grant' || currentStep === 'success' ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${currentStep === 'approve' || currentStep === 'grant' || currentStep === 'success' ? 'bg-green-500' : 'bg-gray-700'}`}>
                {currentStep === 'approve' || currentStep === 'grant' || currentStep === 'success' ? '✓' : '2'}
              </div>
              <div className="text-xs font-semibold">Approve</div>
            </div>
            <ArrowRight className="text-gray-500" />
            <div className={`flex-1 text-center ${currentStep === 'grant' || currentStep === 'success' ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${currentStep === 'grant' || currentStep === 'success' ? 'bg-green-500' : 'bg-gray-700'}`}>
                {currentStep === 'grant' || currentStep === 'success' ? '✓' : '3'}
              </div>
              <div className="text-xs font-semibold">Grant</div>
            </div>
          </div>

          {/* Balances */}
          <div className="bg-black/50 rounded-2xl p-4 mb-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-400">MNT Balance</div>
              <div className="text-lg font-bold text-white">{balance}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">WMANTLE Balance</div>
              <div className="text-lg font-bold text-green-400">{wmantleBalance}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Allowance</div>
              <div className="text-lg font-bold text-blue-400">{allowance}</div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="bg-black/50 rounded-2xl p-6 mb-6">
            <label className="block text-sm text-gray-400 mb-2">Amount (Spending Cap):</label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={delegationAmount}
                onChange={(e) => setDelegationAmount(e.target.value)}
                className="w-full bg-black/70 border-2 border-purple-500/50 rounded-lg px-4 py-3 text-2xl font-bold text-green-400 focus:border-purple-500 focus:outline-none"
                disabled={currentStep !== 'intro'}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                MNT
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {['0.05', '0.1', '0.5', '1.0'].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setDelegationAmount(amount)}
                  disabled={currentStep !== 'intro'}
                  className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                    delegationAmount === amount
                      ? 'bg-purple-600 text-white border-2 border-purple-400'
                      : 'bg-black/50 text-gray-400 border border-gray-600 hover:border-purple-500 hover:text-purple-400'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {currentStep === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <Zap className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                    <div className="text-sm text-gray-300">
                      <p className="font-semibold text-blue-400 mb-1">How It Works:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Step 1: Wrap MNT → WMANTLE (ERC-20 token)</li>
                        <li>• Step 2: Approve contract to spend WMANTLE</li>
                        <li>• Step 3: Grant permission (NO money sent!)</li>
                        <li>• ✅ Money stays in YOUR wallet until weapon is used!</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentStep('wrap')}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-all transform hover:scale-105"
                >
                  Start 3-Step Process →
                </button>
              </motion.div>
            )}

            {currentStep === 'wrap' && (
              <motion.div key="wrap" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="text-4xl">🔄</div>
                    <div className="text-sm text-gray-300">
                      <p className="font-semibold text-yellow-400 mb-1">Step 1: Wrap MNT to WMANTLE</p>
                      <p className="text-xs">Convert your MNT to WMANTLE (ERC-20 token). This allows the approval pattern to work.</p>
                      <p className="text-xs mt-2 text-yellow-400">You need: {delegationAmount} MNT</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleWrap}
                  disabled={processing || parseFloat(balance) < parseFloat(delegationAmount)}
                  className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {processing ? (
                    <><Loader2 className="w-6 h-6 animate-spin" /><span>Wrapping...</span></>
                  ) : (
                    <span>Wrap {delegationAmount} MNT → WMANTLE</span>
                  )}
                </button>
              </motion.div>
            )}

            {currentStep === 'approve' && (
              <motion.div key="approve" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="text-4xl">✅</div>
                    <div className="text-sm text-gray-300">
                      <p className="font-semibold text-blue-400 mb-1">Step 2: Approve Contract</p>
                      <p className="text-xs">Allow the contract to spend your WMANTLE. This is standard ERC-20 approval.</p>
                      <p className="text-xs mt-2 text-blue-400">Your WMANTLE: {wmantleBalance}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleApprove}
                  disabled={processing || parseFloat(wmantleBalance) < parseFloat(delegationAmount)}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {processing ? (
                    <><Loader2 className="w-6 h-6 animate-spin" /><span>Approving...</span></>
                  ) : (
                    <span>Approve {delegationAmount} WMANTLE</span>
                  )}
                </button>
              </motion.div>
            )}

            {currentStep === 'grant' && (
              <motion.div key="grant" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="text-4xl">🔐</div>
                    <div className="text-sm text-gray-300">
                      <p className="font-semibold text-green-400 mb-1">Step 3: Grant Permission</p>
                      <p className="text-xs">Set spending cap. NO MONEY SENT! Money stays in your wallet.</p>
                      <p className="text-xs mt-2 text-green-400">Allowance: {allowance} WMANTLE</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleGrant}
                  disabled={processing || parseFloat(allowance) < parseFloat(delegationAmount)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {processing ? (
                    <><Loader2 className="w-6 h-6 animate-spin" /><span>Granting...</span></>
                  ) : (
                    <span>Grant Permission (NO Money Sent!)</span>
                  )}
                </button>
              </motion.div>
            )}

            {currentStep === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    className="inline-block p-4 bg-green-500/20 rounded-full mb-6"
                  >
                    <CheckCircle className="w-16 h-16 text-green-400" />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-4 text-white">Permission Granted! 🎉</h2>
                  <p className="text-lg text-gray-300 mb-6">
                    You've successfully granted permission for {delegationAmount} WMANTLE. Your funds stay in your wallet!
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
          </AnimatePresence>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4 mt-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-red-400 mb-1">Error</p>
                  <p className="text-sm text-gray-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Hash Display */}
          {txHash && currentStep !== 'success' && (
            <div className="bg-black/50 rounded-xl p-4 mt-4">
              <div className="text-sm text-gray-400 mb-2">Last Transaction:</div>
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

          {/* Skip Button */}
          {onSkip && currentStep === 'intro' && (
            <button
              onClick={onSkip}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-3 px-6 rounded-xl transition-colors mt-4"
            >
              Skip (Watch Only Mode)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
