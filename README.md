# 🕹️ Stranger Things Battle dApp

![Stranger Things Battle Banner](https://img.shields.io/badge/Status-Live-success)
![Mantle Network](https://img.shields.io/badge/Network-Mantle%20Sepolia-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**Stranger Things Battle** is an innovative blockchain gaming platform built on **Mantle Sepolia** that revolutionizes Web3 payments. By combining **advanced ERC-20 permission delegation** with a **gasless transaction architecture**, it offers a seamless multiplayer RPG experience where players team up to fight enemies from the Upside Down.

This project demonstrates how sophisticated smart contract design can eliminate traditional blockchain friction—allowing users to focus on strategy and gameplay while the backend handles complex gas management and security.

🔗 **Play the Game:** [https://mantle-three.vercel.app/](https://mantle-three.vercel.app/)  
📡 **Backend Status:** [https://mantle-o8d5.onrender.com](https://mantle-o8d5.onrender.com)  
📜 **Explorer:** [Mantle Sepolia Explorer](https://explorer.sepolia.mantle.xyz)

---

## 🔐 Core Innovation

### Advanced Permission System
The dApp features a unique **three-tier permission architecture** that enables trustless, gasless payments:

1.  **Player Approval Layer:** Users grant a one-time **WMANTLE** token approval to the smart contract, removing the need to sign every individual move.
2.  **Delegation Layer:** The `GhostSessionDelegate` contract manages spending permissions, allowing the system to securely execute actions within strict user-defined limits.
3.  **Execution Layer:** The backend server signs and submits transactions, paying **all gas fees** while the weapon cost is deducted from the shared team pool.

### 💰 Democratic Payment Governance
In **Multiplayer Mode**, the game implements on-chain voting for treasury management. Before any crypto is spent on weapons:
* A player proposes a weapon.
* A **10-second voting window** opens.
* The team must reach **consensus (>50%)** to authorize the transaction.

---

## 🎮 Gameplay Features

### 1. Character Selection
Choose from 10 iconic avatars before entering the rift:
* **The Party:** Mike, Eleven, Dustin, Lucas, Will, Max
* **The Allies:** Steve, Nancy, Jonathan, Hopper

### 2. Battle Modes
* **👤 Solo Mode:** Instant action with direct control. No voting required—click to launch.
* **👥 Multiplayer Mode:** Co-op PvE for 2-4 players. Features real-time **WebSocket synchronization** and team voting mechanics.

### 3. The Arena & Arsenal
Players face off against the **Demogorgon, Mind Flayer, and Vecna** across 5 rounds. Use **WMANTLE** to purchase weapons, with damage and effects rendered via real-time animations.

| Weapon | Cost (WMANTLE) | Damage | Effect |
| :--- | :--- | :--- | :--- |
| 🔥 **Molotov** | 0.001 | 150 | Fire Damage |
| 🔥 **Flamethrower** | 0.003 | 300 | Burn |
| 💥 **Grenade** | 0.005 | 500 | Explosive |
| 🚀 **Rocket** | 0.008 | 800 | Heavy Impact |
| ☢️ **Nuke** | 0.015 | 1500 | Ultimate |

---

## 🏗️ Technical Architecture

* **Frontend:** Built with **Next.js 16.1.1 (TypeScript)**, featuring **Tailwind CSS** for styling and **Framer Motion** for immersive battle animations.
* **Web3 Integration:** Uses **RainbowKit**, **Wagmi**, and **Viem** for seamless wallet connection and contract interaction.
* **Real-Time Sync:** Custom **Node.js + Express** backend using **WebSockets (ws)** to synchronize game state, votes, and health bars across all clients instantly.
* **Blockchain:** Deployed on **Mantle Sepolia Testnet** (Chain ID: 5003).
    * **Native Token:** MNT (Gas - paid by backend).
    * **Game Currency:** WMANTLE (Wrapped Mantle).

---

## 🛠️ Tech Stack

* ![Solidity](https://img.shields.io/badge/Solidity-%23363636.svg?style=flat&logo=solidity&logoColor=white) **Solidity** - Smart Contracts
* ![Next JS](https://img.shields.io/badge/Next-black?style=flat&logo=next.js&logoColor=white) **Next.js** - React Framework
* ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white) **TypeScript** - Type Safety
* ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white) **Tailwind CSS** - Styling
* ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=flat&logo=express&logoColor=%2361DAFB) **Node.js + Express** - Backend & WebSockets
* ![Mantle](https://img.shields.io/badge/Mantle-black?style=flat&logo=ethereum&logoColor=white) **Mantle Network** - L2 Blockchain

---

## 🚀 Getting Started

### Prerequisites
* Node.js installed
* Metamask wallet configured for Mantle Sepolia
* Git

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/krish2413179-prog/mantle.git](https://github.com/krish2413179-prog/mantle.git)
    cd mantle
    ```

2.  **Install Frontend Dependencies**
    ```bash
    cd nextjs-dapp
    npm install
    ```

3.  **Install Backend Dependencies**
    ```bash
    cd ../backend
    npm install
    ```

4.  **Run Locally**
    * Start Backend: `npm run start` (Port 8080)
    * Start Frontend: `npm run dev` (Port 3000)

---

## 📜 Smart Contracts

| Contract | Address | Description |
| :--- | :--- | :--- |
| **WMANTLE** | `0x157695Bd2966FBC0EE8440a7D60D9F8993AE7850` | Wrapped MNT token used for game purchases |
| **TEAM_DELEGATION_ADDRESS** | *0x751265cD4821FEE5aBd1c1c0a1eba6AED1e774A4* | Manages permissions and spending limits |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
