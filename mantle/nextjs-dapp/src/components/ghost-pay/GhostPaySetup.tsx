'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle, AlertTriangle, Zap } from 'lucide-react'

interface GhostPaySetupProps {
  userAddress: string
  onSetupComplete: () => void
}

export function GhostPaySetup({ userAddress, onSetupComplete }: GhostPaySetupProps) {
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [setupStep, setSetupStep] = useState<'ready' | 'signing' | 'complete' | 'error'>('ready')
  const [errorMessage, setErrorMessage] = useState('')

  const setupGhostPay = async () => {
    setIsSettingUp(true)
    setSetupStep('signing')
    setErrorMessage('')

    try {
      // Check if MetaMask is available
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask not found')
      }

      console.log('🔮 Setting up Ghost-Pay delegation...')

      // Get current nonce
      const nonce = await window.ethereum.request({
        method: 'eth_getTransactionCount',
        params: [userAddress, 'latest']
      })

      console.log('📋 Current nonce:', nonce)

      // Create EIP-7702 delegation message
      const message = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
          ],
          Authorization: [
            { name: 'chainId', type: 'uint256' },
            { name: 'address', type: 'address' },
            { name: 'nonce', type: 'uint256' },
          ],
        },
        primaryType: 'Authorization',
        domain: {
          name: 'Ghost-Pay Delegation',
          version: '1',
          chainId: 5003, // Mantle Sepolia
        },
        message: {
          chainId: 5003,
          address: '0x2d84813B18a5d601A4ddc7153Ae44848Ff824D7A', // Ghost Delegate
          nonce: parseInt(nonce, 16),
        },
      }

      console.log('📝 Signing delegation...')

      // Sign the delegation
      const signature = await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [userAddress, JSON.stringify(message)],
      })

      console.log('✅ Delegation signed successfully')

      // Store delegation info
      const delegationInfo = {
        signature: signature,
        timestamp: Date.now(),
        userAddress: userAddress,
        agentAddress: '0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081',
        delegateAddress: '0x2d84813B18a5d601A4ddc7153Ae44848Ff824D7A',
        nonce: nonce,
      }

      localStorage.setItem(
        `ghostpay_delegation_${userAddress.toLowerCase()}`,
        JSON.stringify(delegationInfo)
      )

      console.log('💾 Delegation stored')

      setSetupStep('complete')
      
      // Auto-complete after 2 seconds
      setTimeout(() => {
        onSetupComplete()
      }, 2000)

    } catch (error: any) {
      console.error('❌ Ghost-Pay setup failed:', error)
      setErrorMessage(error.message || 'Setup failed')
      setSetupStep('error')
    } finally {
      setIsSettingUp(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-red-500 rounded-full flex items-center justify-center"
          >
            <Zap className="w-10 h-10 text-white" />
          </motion.div>
          
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent">
            👻 GHOST-PAY SETUP 👻
          </h2>
        </div>

        {/* Status */}
        <div className="mb-6">
          {setupStep === 'ready' && (
            <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                <div>
                  <h3 className="font-semibold text-orange-500">Ghost-Pay Inactive</h3>
                  <p className="text-sm text-gray-300">Not configured</p>
                </div>
              </div>
            </div>
          )}

          {setupStep === 'signing' && (
            <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <div>
                  <h3 className="font-semibold text-blue-500">Setting Up Delegation</h3>
                  <p className="text-sm text-gray-300">Please sign the transaction in MetaMask</p>
                </div>
              </div>
            </div>
          )}

          {setupStep === 'complete' && (
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <h3 className="font-semibold text-green-500">Ghost-Pay Active!</h3>
                  <p className="text-sm text-gray-300">Setup completed successfully</p>
                </div>
              </div>
            </div>
          )}

          {setupStep === 'error' && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="font-semibold text-red-500">Setup Failed</h3>
                  <p className="text-sm text-gray-300">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-cyan-400 mb-2 flex items-center">
            <span className="mr-2">ℹ️</span>
            What is Ghost-Pay?
          </h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Seamless blockchain transactions without gas fees</li>
            <li>• AI Agent handles all transaction complexity</li>
            <li>• EIP-7702 delegation for secure automation</li>
            <li>• Perfect for gaming and DeFi interactions</li>
          </ul>
          
          <div className="mt-3 p-2 bg-green-500/10 rounded border border-green-500/30">
            <p className="text-xs text-green-400 font-medium">
              🔒 Your wallet remains secure - you control all permissions
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {setupStep === 'ready' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={setupGhostPay}
              disabled={isSettingUp}
              className="w-full bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              {isSettingUp ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Setting Up...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>ACTIVATE GHOST-PAY</span>
                </div>
              )}
            </motion.button>
          )}

          {setupStep === 'error' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSetupStep('ready')
                setErrorMessage('')
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Try Again
            </motion.button>
          )}

          {setupStep === 'complete' && (
            <div className="text-center text-green-400 font-medium">
              Redirecting to game...
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}