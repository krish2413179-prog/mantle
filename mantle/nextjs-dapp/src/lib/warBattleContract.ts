import { ethers } from 'ethers'

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

// Contract addresses
export const ADVANCED_PERMISSIONS_ADDRESS = process.env.NEXT_PUBLIC_ADVANCED_PERMISSIONS_ADDRESS || '0x48652Af3CeD9C41eB1F826e075330B758917B05B'
export const GAME_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_GAME_REGISTRY_ADDRESS || '0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A'

// NEW: Advanced Permissions ABI (ERC-7715 Style - Funds stay in wallet!)
export const ADVANCED_PERMISSIONS_ABI = [
  "function grantPermission(address delegate, uint256 maxAmount, uint256 duration) external",
  "function revokePermission(address delegate) external",
  "function executeTeamAction(address[] calldata owners, uint256[] calldata amounts) external payable",
  "function getPermission(address owner, address delegate) external view returns (uint256 maxAmount, uint256 spent, uint256 expiry, bool active, uint256 available)",
  "function getAvailableAmount(address owner, address delegate) external view returns (uint256)",
  "function getTotalPool(address leader, address[] calldata members) external view returns (uint256)",
  "function increasePermission(address delegate, uint256 additionalAmount) external",
  "event PermissionGranted(address indexed owner, address indexed delegate, uint256 maxAmount, uint256 expiry)",
  "event PermissionRevoked(address indexed owner, address indexed delegate)",
  "event FundsSpent(address indexed owner, address indexed delegate, uint256 amount)",
  "event TeamActionExecuted(address indexed leader, uint256 totalAmount)"
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
  
  const advancedPermissions = new ethers.Contract(
    ADVANCED_PERMISSIONS_ADDRESS,
    ADVANCED_PERMISSIONS_ABI,
    signer
  )
  
  return { advancedPermissions, signer }
}

// NEW: Grant permission to team leader (NO UPFRONT PAYMENT!)
// Funds stay in your wallet until actually spent!
export async function grantPermissionToLeader(
  leaderAddress: string,
  amount: string // in MNT (e.g., "0.1")
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log('🔐 Starting permission grant process...')
    console.log('📍 Step 1: Getting signer from MetaMask...')
    
    const { advancedPermissions } = await getContracts()
    
    console.log('✅ Step 1 complete: Signer obtained')
    console.log('📍 Step 2: Preparing transaction...')
    
    // Convert amount to wei
    const maxAmountWei = ethers.parseEther(amount)
    
    // 24 hours in seconds
    const duration = 24 * 60 * 60
    
    // IMPORTANT: For gasless execution, grant permission to BACKEND wallet
    // Backend wallet address (from .env AGENT_PRIVATE_KEY)
    const BACKEND_WALLET = '0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081'
    
    console.log('🔐 Permission grant details (ERC-7715 Style):')
    console.log('  Team Leader:', leaderAddress)
    console.log('  Granting permission to BACKEND:', BACKEND_WALLET)
    console.log('  Max Amount:', amount + ' MNT')
    console.log('  Duration: 24 hours')
    console.log('  💰 YOUR FUNDS STAY IN YOUR WALLET!')
    console.log('  ⚡ This enables GASLESS weapon launches!')
    
    console.log('✅ Step 2 complete: Transaction prepared')
    console.log('📍 Step 3: Sending transaction to MetaMask...')
    console.log('⚠️ PLEASE CHECK YOUR METAMASK - A popup should appear now!')
    console.log('💡 NOTE: You are NOT sending funds, just granting permission!')
    
    // REAL BLOCKCHAIN TRANSACTION - NO PAYMENT!
    // Grant permission to BACKEND wallet so it can execute gaslessly
    const tx = await advancedPermissions.grantPermission(
      BACKEND_WALLET, // Backend wallet, not team leader!
      maxAmountWei,   // Maximum amount that can be spent
      duration        // 24 hours
      // NO { value: ... } - No payment sent!
    )
    
    console.log('✅ Step 3 complete: Transaction signed!')
    console.log('⏳ Transaction sent:', tx.hash)
    console.log('🔗 View on explorer: https://explorer.sepolia.mantle.xyz/tx/' + tx.hash)
    console.log('📍 Step 4: Waiting for blockchain confirmation...')
    
    // Wait for confirmation
    const receipt = await tx.wait()
    
    console.log('✅ Step 4 complete: Transaction confirmed!')
    console.log('✅ Permission granted to BACKEND for gasless execution!')
    console.log('💰 Your', amount, 'MNT stays in YOUR wallet!')
    console.log('✅ Block:', receipt.blockNumber)
    console.log('💸 Gas used:', receipt.gasUsed.toString())
    
    return {
      success: true,
      txHash: receipt.hash
    }
  } catch (error: any) {
    console.error('❌ Permission grant failed at some step')
    console.error('❌ Error details:', error)
    
    // Provide user-friendly error messages
    let errorMessage = error.message || 'Failed to grant permission'
    
    if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
      errorMessage = 'Transaction was rejected in MetaMask. Please try again and approve the transaction.'
    } else if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient MNT for gas fees. You need a small amount of MNT for gas.'
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

// Revoke permission from team leader (REAL BLOCKCHAIN TRANSACTION)
export async function revokeFromLeader(
  leaderAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const { advancedPermissions } = await getContracts()
    
    // Revoke from BACKEND wallet (where permission was granted)
    const BACKEND_WALLET = '0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081'
    
    console.log('🚨 Revoking permission (REAL TX) from:', BACKEND_WALLET)
    console.log('💡 No refund needed - funds never left your wallet!')
    
    const tx = await advancedPermissions.revokePermission(BACKEND_WALLET)
    
    console.log('⏳ Transaction sent:', tx.hash)
    
    const receipt = await tx.wait()
    
    console.log('✅ Permission revoked! Block:', receipt.blockNumber)
    console.log('✅ Your funds are still in your wallet!')
    
    return {
      success: true,
      txHash: receipt.hash
    }
  } catch (error: any) {
    console.error('❌ Revoke failed:', error)
    return {
      success: false,
      error: error.message || 'Failed to revoke permission'
    }
  }
}

// Check permission status (READ-ONLY)
export async function checkPermission(
  ownerAddress: string,
  delegateAddress: string
): Promise<{
  maxAmount: string
  spent: string
  expiry: number
  active: boolean
  available: string
}> {
  try {
    const { advancedPermissions } = await getContracts()
    
    console.log('🔍 Checking permission on-chain:')
    console.log('  Owner:', ownerAddress)
    console.log('  Delegate:', delegateAddress)
    
    const permission = await advancedPermissions.getPermission(ownerAddress, delegateAddress)
    
    const result = {
      maxAmount: ethers.formatEther(permission.maxAmount),
      spent: ethers.formatEther(permission.spent),
      expiry: Number(permission.expiry),
      active: permission.active,
      available: ethers.formatEther(permission.available)
    }
    
    console.log('  Result:', result)
    console.log('  💰 Funds in your wallet:', result.available, 'MNT available to spend')
    
    return result
  } catch (error) {
    console.error('Failed to check permission:', error)
    return {
      maxAmount: '0',
      spent: '0',
      expiry: 0,
      active: false,
      available: '0'
    }
  }
}

// Verify all team permissions (useful for debugging)
export async function verifyTeamDelegations(
  leaderAddress: string,
  teamMembers: Array<{ address: string; isTeamLeader?: boolean }>
): Promise<Array<{ address: string; active: boolean; available: string }>> {
  try {
    const { advancedPermissions } = await getContracts()
    
    // Check permissions granted to BACKEND wallet
    const BACKEND_WALLET = '0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081'
    
    console.log('🔍 Verifying all team permissions for backend:', BACKEND_WALLET)
    
    const results = []
    
    for (const member of teamMembers) {
      if (member.isTeamLeader) continue
      
      try {
        const permission = await advancedPermissions.getPermission(member.address, BACKEND_WALLET)
        const isActive = permission.active && permission.available > 0n
        
        results.push({
          address: member.address,
          active: isActive,
          available: ethers.formatEther(permission.available)
        })
        
        console.log(`  ${member.address.substring(0, 8)}... - Active: ${isActive}, Available: ${ethers.formatEther(permission.available)} MNT`)
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
    console.error('Failed to verify team permissions:', error)
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
