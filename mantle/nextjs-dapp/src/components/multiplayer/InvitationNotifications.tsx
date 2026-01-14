'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Users } from 'lucide-react'
import { useAccount } from 'wagmi'

interface Invitation {
  id: string
  roomCode: string
  roomName: string
  inviteAddress: string
  inviterAddress: string
  inviterName: string
  createdAt: string
  expiresAt: string
}

interface InvitationNotificationsProps {
  onJoinRoom: (roomCode: string) => void
}

export function InvitationNotifications({ onJoinRoom }: InvitationNotificationsProps) {
  const { address } = useAccount()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [dismissedInvites, setDismissedInvites] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (address) {
      fetchInvitations()
      // Poll for new invitations every 30 seconds
      const interval = setInterval(fetchInvitations, 30000)
      return () => clearInterval(interval)
    }
  }, [address])

  const fetchInvitations = async () => {
    if (!address) return
    
    try {
      const response = await fetch(`http://localhost:3001/api/invitations/${address}`)
      const data = await response.json()
      
      if (data.success) {
        // Filter out dismissed invitations
        const newInvitations = data.invitations.filter((inv: Invitation) => 
          !dismissedInvites.has(inv.id)
        )
        setInvitations(newInvitations)
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error)
    }
  }

  const acceptInvitation = (invitation: Invitation) => {
    onJoinRoom(invitation.roomCode)
    dismissInvitation(invitation.id)
  }

  const dismissInvitation = (inviteId: string) => {
    setDismissedInvites(prev => new Set([...prev, inviteId]))
    setInvitations(prev => prev.filter(inv => inv.id !== inviteId))
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  if (invitations.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      <AnimatePresence>
        {invitations.map((invitation) => (
          <motion.div
            key={invitation.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className="bg-black/90 backdrop-blur-sm border border-purple-500 rounded-xl p-4 max-w-sm shadow-2xl"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-purple-400">Room Invitation</span>
              </div>
              <button
                onClick={() => dismissInvitation(invitation.id)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-4">
              <h4 className="font-bold text-white mb-1">{invitation.roomName}</h4>
              <p className="text-sm text-gray-300">
                From: <span className="font-mono">{invitation.inviterName}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Room Code: <span className="font-mono font-bold">{invitation.roomCode}</span>
              </p>
              <p className="text-xs text-gray-500">
                {formatTimeAgo(invitation.createdAt)}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => dismissInvitation(invitation.id)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
              >
                Decline
              </button>
              <button
                onClick={() => acceptInvitation(invitation)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>Join</span>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}