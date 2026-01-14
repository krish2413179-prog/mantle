import { createConfig, http } from 'wagmi'
import { mantleSepoliaTestnet } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// Mantle Sepolia configuration
export const mantleSepolia = {
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Explorer',
      url: 'https://sepolia.mantlescan.xyz',
    },
  },
  testnet: true,
} as const

// Contract addresses
export const CONTRACTS = {
  gameRegistry: '0x5Bd430d3C3b8c72155a091983d4Dcabd7081205A',
  ghostDelegate: '0x2d84813B18a5d601A4ddc7153Ae44848Ff824D7A',
  teamLeaderNFT: '0xE38449796438b6276AfcF9b3B32AA2F0B5247590',
  agentAddress: '0x63e3f5a1fC6432B44A579DE55858aAAA00C6e081',
} as const

// RainbowKit configuration
export const config = getDefaultConfig({
  appName: 'Stranger Things Battle - Ghost-Pay DApp',
  projectId: 'stranger-things-battle',
  chains: [mantleSepolia],
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}