'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { wrapMNT, getWMANTLEBalance } from '@/lib/warBattleContract';

export default function WalletSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Balances
  const [mntBalance, setMntBalance] = useState('0');
  const [wmantleBalance, setWmantleBalance] = useState('0');
  
  // Input
  const [wrapAmount, setWrapAmount] = useState('0.01');
  
  // Check if setup is complete
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  useEffect(() => {
    loadBalances();
    const interval = setInterval(loadBalances, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadBalances = async () => {
    try {
      if (typeof window.ethereum === 'undefined') return;
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) return;
      
      const address = accounts[0];
      
      // Get MNT balance
      const mntBal = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      setMntBalance((parseInt(mntBal, 16) / 1e18).toFixed(4));
      
      // Get WMANTLE balance
      const wmantleBal = await getWMANTLEBalance(address);
      setWmantleBalance(wmantleBal);
      
      // Check if setup is complete (has WMANTLE)
      const wmantleNum = parseFloat(wmantleBal);
      
      if (wmantleNum > 0) {
        setIsSetupComplete(true);
      }
      
    } catch (err) {
      console.error('Error loading balances:', err);
    }
  };

  const handleWrap = async () => {
    setLoading(true);
    setError('');
    
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      await wrapMNT(wrapAmount);
      
      // Wait for balance update
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadBalances();
      
      setIsSetupComplete(true);
    } catch (err: any) {
      setError(err.message || 'Failed to wrap MNT');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">💰 Wrap MNT to WMANTLE</h1>
          <p className="text-gray-300">Convert your MNT to game currency</p>
        </div>

        {/* Balances */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6 border border-purple-500/30">
          <h3 className="text-xl font-bold mb-4">💰 Your Balances</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">MNT Balance:</span>
              <span className="font-bold">{mntBalance} MNT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">WMANTLE Balance:</span>
              <span className="font-bold text-green-400">{wmantleBalance} WMANTLE</span>
            </div>
          </div>
        </div>

        {/* Setup Complete */}
        {isSetupComplete ? (
          <div className="space-y-6">
            <div className="bg-green-900/30 border border-green-500 rounded-lg p-6 text-center">
              <div className="text-5xl mb-3">✅</div>
              <h2 className="text-xl font-bold mb-2">Wrapped Successfully!</h2>
              <p className="text-gray-300 text-sm mb-4">
                You now have WMANTLE in your wallet. When you select a character, you'll be asked to approve the contract (one-time).
              </p>
              <button
                onClick={handleContinue}
                className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-2 rounded-lg font-bold hover:scale-105 transition-transform"
              >
                Continue to Battle →
              </button>
            </div>

            {/* Allow wrapping more */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-purple-500/30">
              <h3 className="text-lg font-bold mb-3">Wrap More MNT</h3>
              <p className="text-gray-300 text-sm mb-4">
                Need more WMANTLE? Wrap additional MNT here.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Amount to Wrap</label>
                <input
                  type="number"
                  value={wrapAmount}
                  onChange={(e) => setWrapAmount(e.target.value)}
                  step="0.001"
                  min="0"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  placeholder="0.01"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setWrapAmount('0.01')} className="px-3 py-1 bg-gray-700 rounded text-sm">0.01</button>
                  <button onClick={() => setWrapAmount('0.05')} className="px-3 py-1 bg-gray-700 rounded text-sm">0.05</button>
                  <button onClick={() => setWrapAmount('0.1')} className="px-3 py-1 bg-gray-700 rounded text-sm">0.1</button>
                </div>
              </div>

              <button
                onClick={handleWrap}
                disabled={loading || parseFloat(wrapAmount) <= 0}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Wrapping...' : '🔄 Wrap More MNT'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-lg p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold mb-4">Wrap MNT → WMANTLE</h3>
            <p className="text-gray-300 mb-4">
              Convert your MNT to WMANTLE (game currency). This stays in your wallet.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Amount to Wrap</label>
              <input
                type="number"
                value={wrapAmount}
                onChange={(e) => setWrapAmount(e.target.value)}
                step="0.001"
                min="0"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder="0.01"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={() => setWrapAmount('0.01')} className="px-3 py-1 bg-gray-700 rounded text-sm">0.01</button>
                <button onClick={() => setWrapAmount('0.05')} className="px-3 py-1 bg-gray-700 rounded text-sm">0.05</button>
                <button onClick={() => setWrapAmount('0.1')} className="px-3 py-1 bg-gray-700 rounded text-sm">0.1</button>
              </div>
            </div>

            <button
              onClick={handleWrap}
              disabled={loading || parseFloat(wrapAmount) <= 0}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-lg font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Wrapping...' : '🔄 Wrap MNT'}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-900/30 border border-red-500 rounded-lg p-4">
            <p className="text-red-200">❌ {error}</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-gray-800/30 rounded-lg p-4 text-sm text-gray-400">
          <p className="mb-2">💡 How it works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Wrap MNT → WMANTLE (ERC-20 token)</li>
            <li>When you select a character, approve the contract (one-time)</li>
            <li>Money stays in YOUR wallet until weapon is used</li>
            <li>WMANTLE deducted automatically when weapon launches</li>
            <li>No gas fees for gameplay - backend pays!</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
