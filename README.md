# 🇮🇩 LokaPay

![LokaPay Status](https://img.shields.io/badge/Status-MVP_Ready-success)
![Stack](https://img.shields.io/badge/Tech-Bun_Hono_NextJS-black)
![License](https://img.shields.io/badge/License-MIT-green)

> **LokaPay is a hybrid payment infrastructure that bridges the global crypto economy with the local real economy.**

LokaPay enables international tourists to pay using **Stablecoins** (USDT), while local merchants (SMEs) receive instant balance in **Rupiah (IDR)** without expensive credit card fees or physical money changers.

---

## 💡 The Problem & Solution

### The Problem (Pain Points)

- **Currency Friction:** Tourists must visit physical money changers with poor exchange rates
- **High Fees:** International credit cards charge 3-5% transaction fees
- **Merchant Gap:** Small businesses struggle to access global banking services
- **Complexity:** Traditional payment systems require extensive setup and infrastructure

### The LokaPay Solution

| Problem | Solution |
| :--- | :--- |
| **Currency Friction** | Instant conversion: Pay with your stablecoin USDT, system auto-converts to Rupiah |
| **High Fees** | Low cost: Leverage blockchain efficiency with minimal fees |
| **Merchant Gap** | Web2 Experience: Merchants don't need to understand crypto. Just scan QR like QRIS |
| **Complexity** | Simple Setup: Easy registration, instant settlement, no hardware required |

---

## ✨ Features

- 🌍 **Multi-Currency Support:** Accept USDT payments, receive IDR instantly
- 💰 **Instant Settlement:** Real-time balance updates for merchants
- 📱 **QR Code Payments:** Simple QR code scanning for customers
- 🎯 **Role-Based Access:** Separate interfaces for merchants and admins
- 🔐 **Secure Authentication:** JWT-based authentication with role management
- 📊 **Admin Dashboard:** Comprehensive transaction and merchant management
- 💸 **Payout System:** Automated withdrawal requests with admin approval
- 🌐 **Internationalization:** Support for English, Indonesian, and Chinese
- 📈 **Transaction History:** Complete audit trail of all transactions
- 🔗 **Block Explorer Integration:** Direct links to transaction hashes on blockchain explorers
- 💱 **Real-Time Exchange Rates:** Powered by CoinGecko API for accurate USDT/IDR conversion rates
- ⚙️ **Background Job Processing:** Automated payment detection and fund sweeping via worker service

---

## 📦 Installation

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+) - `curl -fsSL https://bun.sh/install | bash`
- [Docker Desktop](https://www.docker.com/) (Required for PostgreSQL database)

### Clone the Repository

```bash
git clone https://github.com/your-username/lokapay.git
cd lokapay
```

---

## 🔧 Install Dependencies

Install all dependencies for the monorepo:

```bash
bun install
```

This will install dependencies for all workspaces:
- `apps/web` - Next.js frontend
- `apps/api` - Hono backend API
- `apps/worker` - Background job processor
- `packages/database` - Prisma database package
- `packages/contracts` - Smart contract utilities

---

## 🚀 Quick Start

### 1. Environment Setup

Create environment files in the following locations with the required variables:

**`apps/api/.env`**:
```env
# Blockchain Configuration
CHAIN_NETWORK=LISK
CHAIN_EXPLORER=https://sepolia-blockscout.lisk.com
RPC_URL=https://rpc.sepolia-api.lisk.com

# Application Configuration
FRONTEND_URL=http://localhost:3000

# Contract Addresses (Deploy contracts first - see packages/contracts/README.md)
RELAYER_PRIVATE_KEY=your_relayer_private_key_here
FACTORY_ADDRESS=0xE6BFC88940da7E0f424aD033F304363BB30dbe25
USDT_ADDRESS=0x4F4AE7FB677004521f0D92C0aF43cA8f749034c0
COLD_WALLET_ADDRESS=0x762154693351a54AD292D03efCEF2920387443De

# External Services (IDRX for fiat conversion)
IDRX_API_KEY=your_idrx_api_key
IDRX_SECRET_KEY=your_idrx_secret_key
IDRX_BASE_URL=https://idrx.co/api
```

**`apps/web/.env.local`**:
```env
# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=4202
NEXT_PUBLIC_USDT_ADDRESS=0x4F4AE7FB677004521f0D92C0aF43cA8f749034c0
RPC_URL=https://rpc.sepolia-api.lisk.com

# Application URLs
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication
JWT_SECRET=lokapay-development-secret-key-change-in-production
```

**`apps/worker/.env`**:
```env
# Blockchain Configuration
CHAIN_NETWORK=LISK
RPC_URL=https://rpc.sepolia-api.lisk.com

# Database & Cache
DATABASE_URL=postgresql://lokapay_admin:lokapay_password@localhost:5433/lokapay_db?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379

# Contract Addresses
RELAYER_PRIVATE_KEY=your_relayer_private_key_here
FACTORY_ADDRESS=0xE6BFC88940da7E0f424aD033F304363BB30dbe25
USDT_ADDRESS=0x4F4AE7FB677004521f0D92C0aF43cA8f749034c0
COLD_WALLET_ADDRESS=0x762154693351a54AD292D03efCEF2920387443De
```

**`packages/contracts/.env`** (for contract deployment & verification):
```env
# Deployment Configuration
DEPLOYER_PRIVATE_KEY=your_deployer_private_key_here
CHAIN_ID=4202
CHAIN_NETWORK=LISK
CHAIN_EXPLORER=https://sepolia-blockscout.lisk.com
RPC_URL=https://rpc.sepolia-api.lisk.com

# Verification (Optional - only needed for contract verification)
ETHERSCAN_API_KEY=your_block_explorer_api_key_here
BLOCK_EXPLORER_API_KEY=your_block_explorer_api_key_here
```

**`packages/database/.env`** (or root `.env`):
```env
DATABASE_URL=postgresql://lokapay_admin:lokapay_password@localhost:5433/lokapay_db?schema=public
```

### 2. Smart Contracts Deployment

Deploy smart contracts to the blockchain (LISK Sepolia testnet):

```bash
cd packages/contracts

# Install dependencies
bun install

# Compile contracts
bun run compile

# Deploy contracts
bun run deploy --network LISK
```

After deployment, **save the contract addresses** to your `.env` files:
- `FACTORY_ADDRESS` → `apps/api/.env` and `apps/worker/.env`
- `USDT_ADDRESS` → `apps/api/.env`, `apps/worker/.env`, and `apps/web/.env.local`
- `COLD_WALLET_ADDRESS` → `apps/api/.env` and `apps/worker/.env`

**Verify contracts on block explorer:**
```bash
# Set contract addresses in packages/contracts/.env first
bunx hardhat run scripts/verify.ts --network LISK
```

For detailed contract documentation, verification instructions, and architecture, see [packages/contracts/README.md](./packages/contracts/README.md)

### 3. Database Setup

Start Docker and initialize the database:

```bash
# Start PostgreSQL and Redis containers
docker-compose up -d

# Generate Prisma client and push schema
cd packages/database
bun x prisma generate
bun run db:push

# Seed admin account (optional)
cd ../../apps/api
bun run db:seed
```

### 4. Run Development Servers

From the root directory:

```bash
bun dev
```

This will start:
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:3001`
- **Worker:** Background job processor (payment watcher & relayer)
- **Database:** PostgreSQL on port 5433
- **Redis:** Required for job queue (runs via Docker)

### 5. Access the Application

- **Merchant Login:** `http://localhost:3000/login`
- **Admin Login:** Use the seeded admin credentials
- **API Docs:** Available at `http://localhost:3001`

---

## 📚 API References

### Hooks

#### `useAuth`
Authentication state management hook using Zustand.

```typescript
import { useAuth } from '@/src/store/useAuth'

const { user, token, login, logout, fetchMerchantData, updateBalance } = useAuth()
```

**Methods:**
- `login(user: User, token: string)` - Login and store credentials
- `logout()` - Clear authentication state
- `fetchMerchantData()` - Fetch current merchant data
- `updateBalance(balanceIDR: string)` - Update merchant balance

### Services

#### `generateEIP681AddressURI`
Generate EIP-681 compliant payment URI for QR codes.

```typescript
import { generateEIP681AddressURI } from '@/src/constants/network'

const paymentURI = generateEIP681AddressURI(
  recipientAddress,
  amountUSDT,
  chainId
)
```

### Exchange Rate Service

LokaPay uses **CoinGecko API** to fetch real-time USDT/IDR exchange rates. The rate is fetched on-demand when creating new invoices to ensure accurate conversion.

**API Endpoint Used:**
- `https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=idr`

The exchange rate is stored with each transaction to maintain historical accuracy and prevent rate fluctuations from affecting completed transactions.

---

## 🛠 Development

### Running Development Servers

```bash
# Run all services (database, API, web, worker)
bun dev

# Run only specific services
bun run dev:api      # API only
bun run dev:web      # Web only
bun run dev:worker   # Worker only
bun run dev:services # Database, API, and Web (no worker)
```

### Building for Production

```bash
# Build web application
cd apps/web
bun run build

# Start production server
bun run start
```

### Linting

```bash
# Lint web application
cd apps/web
bun run lint

# Lint with auto-fix
bun run lint --fix
```

### Database Migrations

```bash
cd packages/database

# Generate Prisma client
bun x prisma generate

# Push schema changes to database
bun run db:push

# Create migration
bun x prisma migrate dev --name migration_name

# Reset database (⚠️ WARNING: Deletes all data)
bun x prisma migrate reset
```

### Type Checking

```bash
# Check TypeScript types
bun run tsc --noEmit
```

### Worker Service

The worker service (`apps/worker`) is a background job processor that handles two critical tasks:

#### 1. Payment Watcher Job
Runs every **15 seconds** via cron to:
- **Monitor Transaction Status:** Scans all pending and partially paid transactions
- **Detect Payments:** Checks USDT balance on payment addresses using blockchain RPC
- **Update Status:** Automatically updates transaction status (PENDING → PARTIALLY_PAID → PAID → OVERPAID)
- **Credit Merchant Balance:** When payment is confirmed, credits merchant's IDR balance atomically
- **Trigger Sweeps:** Queues completed transactions for fund sweeping

**Key Features:**
- Atomic database transactions to prevent race conditions
- Automatic tip calculation for overpaid transactions
- Real-time balance monitoring without webhooks
- Handles partial payments gracefully

#### 2. Relayer Job
Processes jobs from a Redis queue to:
- **Deploy Vault Contracts:** Deploys CREATE2 deterministic vault contracts when needed
- **Sweep Funds:** Transfers USDT from payment vaults to the cold wallet
- **Gas Management:** Monitors relayer wallet balance and prevents operations if gas is insufficient
- **Error Handling:** Retries failed jobs automatically with proper error logging

**Queue System:**
- Uses **BullMQ** with **Redis** for job queue management
- Processes one job at a time (concurrency: 1) to prevent gas conflicts
- Automatic retry on failures
- Job cleanup after completion/failure

**Running the Worker:**

```bash
# Run worker separately
bun run dev:worker

# Or run with all services
bun dev
```

**Worker Requirements:**
- Redis server (runs via Docker Compose)
- Relayer wallet with sufficient gas
- Access to blockchain RPC endpoint
- Database connection

---

## 📄 License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2025 LokaPay
```

---

**Built with ❤️ by the LokaPay Team**