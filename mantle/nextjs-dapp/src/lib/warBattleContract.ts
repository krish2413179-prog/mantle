import { ethers } from 'ethers'

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

// Contract addresses
export const TEAM_DELEGATION_ADDRESS = process.env.NEXT_PUBLIC_TEAM_DELEGATION_ADDRESS || '0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4'
export const GAME_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_GAME_REGISTRY_ADDRESS || '0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A'

// TeamDelegation ABI - Matches the deployed contract
export const TEAM_DELEGATION_ABI = [
  "function delegateToLeader(address delegate, uint256 duration) external payable",
  "function revokePermission(address delegate) external",
  "function executeTeamAction(address[] calldata owners, uint256[] calldata amounts) external",
  "function getDelegation(address owner, address delegate) external view returns (uint256 amount, uint256 expiry, uint256 spent, bool active, uint256 available)",
  "function getAvailableAmount(address owner, address delegate) external view returns (uint256)",
  "function getTotalPool(address leader, address[] calldata members) external view returns (uint256)",
  "event PermissionDelegated(address indexed owner, address indexed delegate, uint256 amount, uint256 expiry)",
  "event PermissionRevoked(address indexed owner, address indexed delegate)",
  "event DelegatedSpend(address indexed owner, address indexed delegate, uint256 amount)",
  "event TeamActionExecuted(address indexed leader, uint256 totalAmount, uint256 memberCount)"
]

// Helper to get signer
export async function getSigner() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not installed. Please install MetaMask extension.')
  }
  
  // Request account access if needed
  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' })
  } catch (error: any) {
    throw new Error('Please connect your MetaMask wallet first')
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  
  // Verify we're on the correct network (Mantle Sepolia = 5003)
  const network = await provider.getNetwork()
  if (network.chainId !== 5003n) {
    throw new Error('Please switch to Mantle Sepolia network in MetaMask')
  }
  
  return signer
}

// Helper to get contract instances
export async function getContracts() {
  const signer = await getSigner()
  
  const teamDelegation = new ethers.Contract(
    TEAM_DELEGATION_ADDRESS,
    TEAM_DELEGATION_ABI,
    signer
  )
  
  return { teamDelegation, signer }
}

// Delegate funds to team leader (REAL BLOCKCHAIN TRANSACTION WITH PAYMENT!)
export async function grantPermissionToLeader(
  leaderAddress: string,
  amount: string // in MNT (e.g., "0.1")
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log('🔐 Starting delegation process...')
    console.log('📍 Step 1: Getting signer from MetaMask...')
    
    const { teamDelegation } = await getContracts()
    
    console.log('✅ Step 1 complete: Signer obtained')
    console.log('📍 Step 2: Preparing transaction...')
    
    // Convert amount to wei
    const amountWei = ethers.parseEther(amount)
    
    // 24 hours in seconds
    const duration = 24 * 60 * 60
    
    // IMPORTANT: For gasless execution, delegate to BACKEND wallet
    // Backend wallet address (from .env AGENT_PRIVATE_KEY)
    const BACKEND_WALLET = '0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081'
    
    console.log('🔐 Delegation details:')
    console.log('  Team Leader:', leaderAddress)
    console.log('  Delegating to BACKEND:', BACKEND_WALLET)
    console.log('  Amount:', amount + ' MNT')
    console.log('  Duration: 24 hours')
    console.log('  💰 YOU ARE SENDING', amount, 'MNT TO THE CONTRACT!')
    console.log('  ⚡ This enables GASLESS weapon launches!')
    
    console.log('✅ Step 2 complete: Transaction prepared')
    console.log('📍 Step 3: Sending transaction to MetaMask...')
    console.log('⚠️ PLEASE CHECK YOUR METAMASK - A popup should appear now!')
    console.log('💡 NOTE: You ARE sending', amount, 'MNT to the contract!')
    
    // REAL BLOCKCHAIN TRANSACTION - SEND MNT!
    // Delegate to BACKEND wallet so it can execute gaslessly
    const tx = await teamDelegation.delegateToLeader(
      BACKEND_WALLET, // Backend wallet, not team leader!
      duration,       // 24 hours
      { value: amountWei } // ← SEND THE MNT!
    )
    
    console.log('✅ Step 3 complete: Transaction signed!')
    console.log('⏳ Transaction sent:', tx.hash)
    console.log('🔗 View on explorer: https://explorer.sepolia.mantle.xyz/tx/' + tx.hash)
    console.log('📍 Step 4: Waiting for blockchain confirmation...')
    
    // Wait for confirmation
    const receipt = await tx.wait()
    
    console.log('✅ Step 4 complete: Transaction confirmed!')
    console.log('✅ Delegated', amount, 'MNT to BACKEND for gasless execution!')
    console.log('💰 Your', amount, 'MNT is now in the contract!')
    console.log('✅ Block:', receipt.blockNumber)
    console.log('💸 Gas used:', receipt.gasUsed.toString())
    
    return {
      success: true,
      txHash: receipt.hash
    }
  } catch (error: any) {
    console.error('❌ Delegation failed at some step')
    console.error('❌ Error details:', error)
    
    // Provide user-friendly error messages
    let errorMessage = error.message || 'Failed to delegate'
    
    if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
      errorMessage = 'Transaction was rejected in MetaMask. Please try again and approve the transaction.'
    } else if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient MNT balance. You need ' + amount + ' MNT plus a small amount for gas.'
    } else if (error.message?.includes('network')) {
      errorMessage = 'Network error. Please check your connection and ensure you are on Mantle Sepolia.'
    } else if (error.message?.includes('MetaMask')) {
      errorMessage = error.message
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

// Revoke delegation from team leader (REAL BLOCKCHAIN TRANSACTION)
export async function revokeFromLeader(
  leaderAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const { teamDelegation } = await getContracts()
    
    // Revoke from BACKEND wallet (where delegation was made)
    const BACKEND_WALLET = '0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081'
    
    console.log('🚨 Revoking delegation (REAL TX) from:', BACKEND_WALLET)
    console.log('💰 You will get refund of unspent amount!')
    
    const tx = await teamDelegation.revokePermission(BACKEND_WALLET)
    
    console.log('⏳ Transaction sent:', tx.hash)
    
    const receipt = await tx.wait()
    
    console.log('✅ Delegation revoked! Block:', receipt.blockNumber)
    console.log('✅ Unspent funds refunded to your wallet!')
    
    return {
      success: true,
      txHash: receipt.hash
    }
  } catch (error: any) {
    console.error('❌ Revoke failed:', error)
    return {
      success: false,
      error: error.message || 'Failed to revoke delegation'
    }
  }
}

// Check delegation status (READ-ONLY)
export async function checkPermission(
  ownerAddress: string,
  delegateAddress: string
): Promise<{
  amount: string
  spent: string
  expiry: number
  active: boolean
  available: string
}> {
  try {
    const { teamDelegation } = await getContracts()
    
    console.log('🔍 Checking delegation on-chain:')
    console.log('  Owner:', ownerAddress)
    console.log('  Delegate:', delegateAddress)
    
    const delegation = await teamDelegation.getDelegation(ownerAddress, delegateAddress)
    
    const result = {
      amount: ethers.formatEther(delegation.amount),
      spent: ethers.formatEther(delegation.spent),
      expiry: Number(delegation.expiry),
      active: delegation.active,
      available: ethers.formatEther(delegation.available)
    }
    
    console.log('  Result:', result)
    console.log('  💰 Delegated in contract:', result.available, 'MNT available to spend')
    
    return result
  } catch (error) {
    console.error('Failed to check delegation:', error)
    return {
      amount: '0',
      spent: '0',
      expiry: 0,
      active: false,
      available: '0'
    }
  }
}

// Verify all team delegations (useful for debugging)
export async function verifyTeamDelegations(
  leaderAddress: string,
  teamMembers: Array<{ address: string; isTeamLeader?: boolean }>
): Promise<Array<{ address: string; active: boolean; available: string }>> {
  try {
    const { teamDelegation } = await getContracts()
    
    // Check delegations to BACKEND wallet
    const BACKEND_WALLET = '0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081'
    
    console.log('🔍 Verifying all team delegations for backend:', BACKEND_WALLET)
    
    const results = []
    
    for (const member of teamMembers) {
      if (member.isTeamLeader) continue
      
      try {
        const delegation = await teamDelegation.getDelegation(member.address, BACKEND_WALLET)
        const isActive = delegation.active && delegation.available > 0n
        
        results.push({
          address: member.address,
          active: isActive,
          available: ethers.formatEther(delegation.available)
        })
        
        console.log(`  ${member.address.substring(0, 8)}... - Active: ${isActive}, Available: ${ethers.formatEther(delegation.available)} MNT`)
      } catch (err) {
        console.error(`  ❌ Failed to check ${member.address}:`, err)
        results.push({
          address: member.address,
          active: false,
          available: '0'
        })
      }
    }
    
    return results
  } catch (error) {
    console.error('Failed to verify team delegations:', error)
    return []
  }
}

// Backward compatibility: Keep old function name but use new implementation
export async function delegateToLeader(
  leaderAddress: string,
  amount: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  console.log('⚠️ Using legacy function name - redirecting to grantPermissionToLeader()')
  return grantPermissionToLeader(leaderAddress, amount)
}
