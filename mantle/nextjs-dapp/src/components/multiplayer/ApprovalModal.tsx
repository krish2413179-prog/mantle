'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ApprovalModalProps {
  isOpen: boolean;
  onApprove: () => Promise<void>;
  onCancel: () => void;
}

export default function ApprovalModal({ isOpen, onApprove, onCancel }: ApprovalModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    
    try {
      await onApprove();
    } catch (err: any) {
      setError(err.message || 'Approval failed');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-br from-purple-900 via-gray-900 to-blue-900 rounded-2xl border-2 border-purple-500 p-8 max-w-md w-full shadow-2xl">
              
              {/* Icon */}
              <div className="text-center mb-6">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-7xl mb-4"
                >
                  🔐
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Approve Contract
                </h2>
                <p className="text-gray-300">
                  Allow the game to use your WMANTLE
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-200 mb-3">
                  ℹ️ This is a one-time approval that allows the game contract to deduct WMANTLE when you use weapons.
                </p>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>✅ Money stays in YOUR wallet</li>
                  <li>✅ Only deducted when weapon is used</li>
                  <li>✅ You can revoke anytime</li>
                  <li>✅ No gas fees for gameplay</li>
                </ul>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 mb-4">
                  <p className="text-red-200 text-sm">❌ {error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 px-6 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Approving...
                    </>
                  ) : (
                    '✅ Approve'
                  )}
                </button>
              </div>

              {/* Note */}
              <p className="text-xs text-gray-400 text-center mt-4">
                MetaMask will open to confirm the approval
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
