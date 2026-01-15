import { ethers } from 'ethers'

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}

// Contract addresses
export const WMANTLE_ADDRESS = process.env.NEXT_PUBLIC_WMANTLE_ADDRESS || '0x157695Bd2966FBC0EE8440a7D60D9F8993AE7850'
export const ERC20_PERMISSIONS_ADDRESS = process.env.NEXT_PUBLIC_ERC20_PERMISSIONS_ADDRESS || '0xCF33dAE5C20BD3C3d7ABf25aB640bBbD61054453'
export const GAME_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_GAME_REGISTRY_ADDRESS || '0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A'

// WMANTLE ABI (Wrapped Mantle - ERC-20)
export const WMANTLE_ABI = [
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "event Deposit(address indexed account, uint256 amount)",
  "event Withdrawal(address indexed account, uint256 amount)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
]

// ERC20Permissions ABI (TRUE ERC-7715 Style)
export const ERC20_PERMISSIONS_ABI = [
  "function grantPermission(address delegate, uint256 maxAmount, uint256 duration) external",
  "function increasePermission(address delegate, uint256 additionalAmount) external",
  "function revokePermission(address delegate) external",
  "function executeTeamAction(address[] calldata owners, uint256[] calldata amounts) external",
  "function getPermission(address owner, address delegate) external view returns (uint256 maxAmount, uint256 spent, uint256 expiry, bool active, uint256 available)",
  "function getAvailableAmount(address owner, address delegate) external view returns (uint256)",
  "function getTotalPool(address leader, address[] calldata members) external view returns (uint256)",
  "event PermissionGranted(address indexed owner, address indexed delegate, uint256 maxAmount, uint256 expiry)",
  "event PermissionIncreased(address indexed owner, address indexed delegate, uint256 newMaxAmount)",
  "event PermissionRevoked(address indexed owner, address indexed delegate)",
  "event FundsSpent(address indexed owner, address indexed delegate, uint256 amount)",
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
  if (network.chainId !== BigInt(5003)) {
    throw new Error('Please switch to Mantle Sepolia network in MetaMask')
  }
  
  return signer
}

// Helper to get contract instances
export async function getContracts() {
  const signer = await getSigner()
  
  const wmantle = new ethers.Contract(
    WMANTLE_ADDRESS,
    WMANTLE_ABI,
    signer
  )
  
  const erc20Permissions = new ethers.Contract(
    ERC20_PERMISSIONS_ADDRESS,
    ERC20_PERMISSIONS_ABI,
    signer
  )
  
  return { wmantle, erc20Permissions, signer }
}

// Step 1: Wrap MNT to WMANTLE
export async function wrapMNT(
  amount: string // in MNT (e.g., "0.1")
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log('🔄 Wrapping MNT to WMANTLE...')
    console.log('💰 Amount:', amount, 'MNT')
    
    const { wmantle } = await getContracts()
    
    const amountWei = ethers.parseEther(amount)
    
    console.log('📝 Calling WMANTLE.deposit()...')
    const tx = await wmantle.deposit({ value: amountWei })
    
    console.log('⏳ Transaction sent:', tx.hash)
    const receipt = await tx.wait()
    
    console.log('✅ Wrapped successfully!')
    console.log('📊 You now have', amount, 'WMANTLE in your wallet')
    
    return {
      success: true,
      txHash: receipt.hash
    }
  } catch (error: any) {
    console.error('❌ Wrap failed:', error)
    return {
      success: false,
      error: error.message || 'Failed to wrap MNT'
    }
  }
}

// Step 2: Approve contract to spend WMANTLE
export async function approveWMANTLE(
  spender: string, // Contract address to approve
  amount: string // in WMANTLE (e.g., "0.1")
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log('✅ Approving contract to spend WMANTLE...')
    console.log('📝 Spender:', spender)
    console.log('💰 Amount:', amount, 'WMANTLE')
    
    const { wmantle } = await getContracts()
    
    const amountWei = ethers.parseEther(amount)
    
    console.log('📝 Calling WMANTLE.approve()...')
    const tx = await wmantle.approve(spender, amountWei)
    
    console.log('⏳ Transaction sent:', tx.hash)
    const receipt = await tx.wait()
    
    console.log('✅ Approved successfully!')
    console.log('📊 Contract can now spend up to', amount, 'WMANTLE from your wallet')
    
    return {
      success: true,
      txHash: receipt.hash
    }
  } catch (error: any) {
    console.error('❌ Approval failed:', error)
    return {
      success: false,
      error: error.message || 'Failed to approve'
    }
  }
}

// Step 3: Grant permission (NO MONEY SENT!)
export async function grantPermissionToLeader(
  leaderAddress: string,
  amount: string // in WMANTLE (e.g., "0.1")
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log('🔐 Granting permission...')
    console.log('👑 Leader:', leaderAddress)
    console.log('💰 Max spending cap:', amount, 'WMANTLE')
    
    const { erc20Permissions, wmantle } = await getContracts()
    
    const amountWei = ethers.parseEther(amount)
    const duration = 24 * 60 * 60 // 24 hours
    
    // Backend wallet address
    const BACKEND_WALLET = '0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081'
    
    // Check balance
    const balance = await wmantle.balanceOf(await (await getSigner()).getAddress())
    console.log('📊 Your WMANTLE balance:', ethers.formatEther(balance))
    
    if (balance < amountWei) {
      throw new Error(`Insufficient WMANTLE balance. You have ${ethers.formatEther(balance)} WMANTLE`)
    }
    
    // Check allowance
    const allowance = await wmantle.allowance(
      await (await getSigner()).getAddress(),
      ERC20_PERMISSIONS_ADDRESS
    )
    console.log('📊 Current allowance:', ethers.formatEther(allowance))
    
    if (allowance < amountWei) {
      throw new Error(`Insufficient allowance. Please approve ${amount} WMANTLE first`)
    }
    
    console.log('📝 Calling grantPermission()...')
    console.log('⚠️ NO MONEY WILL BE SENT - Just setting spending cap!')
    
    const tx = await erc20Permissions.grantPermission(
      BACKEND_WALLET,
      amountWei,
      duration
    )
    
    console.log('⏳ Transaction sent:', tx.hash)
    const receipt = await tx.wait()
    
    console.log('✅ Permission granted!')
    console.log('📊 Backend can now spend up to', amount, 'WMANTLE from your wallet')
    console.log('💰 Your WMANTLE stays in YOUR wallet until weapon is used!')
    
    return {
      success: true,
      txHash: receipt.hash
    }
  } catch (error: any) {
    console.error('❌ Grant permission failed:', error)
    
    let errorMessage = error.message || 'Failed to grant permission'
    
    if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
      errorMessage = 'Transaction was rejected in MetaMask'
    } else if (error.message?.includes('Insufficient WMANTLE')) {
      errorMessage = error.message
    } else if (error.message?.includes('Insufficient allowance')) {
      errorMessage = error.message
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

// Revoke permission (NO REFUND NEEDED - money never left wallet!)
export async function revokeFromLeader(
  leaderAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const { erc20Permissions } = await getContracts()
    
    const BACKEND_WALLET = '0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081'
    
    console.log('🚨 Revoking permission from:', BACKEND_WALLET)
    console.log('💡 No refund needed - your WMANTLE never left your wallet!')
    
    const tx = await erc20Permissions.revokePermission(BACKEND_WALLET)
    
    console.log('⏳ Transaction sent:', tx.hash)
    
    const receipt = await tx.wait()
    
    console.log('✅ Permission revoked!')
    console.log('✅ Your unspent WMANTLE is still in your wallet!')
    
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
    const { erc20Permissions } = await getContracts()
    
    console.log('🔍 Checking permission on-chain:')
    console.log('  Owner:', ownerAddress)
    console.log('  Delegate:', delegateAddress)
    
    const permission = await erc20Permissions.getPermission(ownerAddress, delegateAddress)
    
    const result = {
      maxAmount: ethers.formatEther(permission.maxAmount),
      spent: ethers.formatEther(permission.spent),
      expiry: Number(permission.expiry),
      active: permission.active,
      available: ethers.formatEther(permission.available)
    }
    
    console.log('  Result:', result)
    console.log('  💰 Available to spend:', result.available, 'WMANTLE')
    
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

// Check WMANTLE balance
export async function getWMANTLEBalance(
  address: string
): Promise<string> {
  try {
    const { wmantle } = await getContracts()
    const balance = await wmantle.balanceOf(address)
    return ethers.formatEther(balance)
  } catch (error) {
    console.error('Failed to get WMANTLE balance:', error)
    return '0'
  }
}

// Check WMANTLE allowance
export async function getWMANTLEAllowance(
  ownerAddress: string
): Promise<string> {
  try {
    const { wmantle } = await getContracts()
    const allowance = await wmantle.allowance(ownerAddress, ERC20_PERMISSIONS_ADDRESS)
    return ethers.formatEther(allowance)
  } catch (error) {
    console.error('Failed to get allowance:', error)
    return '0'
  }
}

// Verify all team permissions (useful for debugging)
export async function verifyTeamDelegations(
  leaderAddress: string,
  teamMembers: Array<{ address: string; isTeamLeader?: boolean }>
): Promise<Array<{ address: string; active: boolean; available: string }>> {
  try {
    const { erc20Permissions } = await getContracts()
    
    const BACKEND_WALLET = '0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081'
    
    console.log('🔍 Verifying all team permissions for backend:', BACKEND_WALLET)
    
    const results = []
    
    for (const member of teamMembers) {
      if (member.isTeamLeader) continue
      
      try {
        const permission = await erc20Permissions.getPermission(member.address, BACKEND_WALLET)
        const isActive = permission.active && permission.available > BigInt(0)
        
        results.push({
          address: member.address,
          active: isActive,
          available: ethers.formatEther(permission.available)
        })
        
        console.log(`  ${member.address.substring(0, 8)}... - Active: ${isActive}, Available: ${ethers.formatEther(permission.available)} WMANTLE`)
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

// Backward compatibility: Keep old function name
export async function delegateToLeader(
  leaderAddress: string,
  amount: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  console.log('⚠️ Using legacy function name - redirecting to grantPermissionToLeader()')
  return grantPermissionToLeader(leaderAddress, amount)
}
