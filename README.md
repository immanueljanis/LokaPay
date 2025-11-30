# 🇮🇩 LokaPay: Payment Without Borders

![LokaPay Status](https://img.shields.io/badge/Status-MVP_Ready-success)
![Stack](https://img.shields.io/badge/Tech-Bun_Hono_NextJS-black)
![Blockchain](https://img.shields.io/badge/Chain-BSC_EVM-yellow)

> **The Bridge between Web3 Wealth and Real-World Economy.**

LokaPay adalah *Payment Gateway Hybrid* yang memungkinkan turis asing membayar menggunakan **Stablecoin**, sementara merchant lokal (UMKM) menerima saldo dalam **Rupiah (IDR)** secara instan, tanpa mesin EDC, tanpa biaya kartu kredit yang mahal.

---

## 💡 The Problem & Solution

| The Problem (Pain Points) | The LokaPay Solution |
| :--- | :--- |
| **Friksi Mata Uang:** Turis harus ke Money Changer fisik dengan rate buruk. | **Instant Conversion:** Bayar pakai wallet crypto favorit, sistem auto-convert ke Rupiah. |
| **High Fees:** Kartu kredit internasional kena charge 3-5%. | **Low Cost:** Menggunakan efisiensi blockchain (BSC/Tron) dengan fee minimal. |
| **Merchant Gap:** UMKM kecil susah akses layanan perbankan global. | **Web2 Experience:** Merchant tidak perlu paham crypto. Cukup scan QR seperti QRIS. |

---

## 🏗 System Architecture (Monorepo)

Project ini dibangun dengan arsitektur **High-Performance Monorepo** menggunakan **Bun Workspaces**.

* **`apps/web`**: Frontend Merchant (Next.js 15).
    * *Focus:* UX super simpel untuk kasir/pemilik warung.
* **`apps/api`**: Backend Core (Hono).
    * *Focus:* High-throughput webhook listener, rate calculation, & wallet management.
* **`packages/database`**: Shared Module (Prisma + PostgreSQL).
    * *Focus:* Single source of truth untuk

---

## 🚀 Quick Start Guide (Run Locally)

Ikuti langkah ini untuk menjalankan LokaPay di laptop Anda dalam \< 5 menit.

### 1\. Prerequisites

Pastikan Anda sudah menginstall:

  * [Bun](https://bun.sh/) (v1.0+) -\> `curl -fsSL https://bun.sh/install | bash`
  * [Docker Desktop](https://www.docker.com/) (Wajib untuk Database)
  * [Ngrok](https://ngrok.com/) (Untuk mengekspos localhost ke internet)

### 2\. Installation

```bash
# Clone Repository
git clone [https://github.com/username/lokapay.git](https://github.com/username/lokapay.git)
cd lokapay

# Install All Dependencies (Monorepo magic)
bun install
```

### 3\. Environment Setup (Critical\!)

Copy file `.env.example` (buat manual jika belum ada) di `apps/api` dan `packages/database`.

**`apps/api/.env`**:

```env
DATABASE_URL="postgresql://lokapay_admin:lokapay_password@localhost:5433/lokapay_db?schema=public"
TATUM_API_KEY="your_tatum_api_key"
WEBHOOK_BASE_URL="[https://url-ngrok-anda.ngrok-free.app](https://url-ngrok-anda.ngrok-free.app)" 
BSC_RPC_URL="[https://bsc-dataseed.binance.org/](https://bsc-dataseed.binance.org/)"
# Wallet Pribadi Anda (Penyuplai Bensin)
ADMIN_PRIVATE_KEY="0x..." 
# Wallet Tujuan Akhir (Safe Multisig)
COLD_WALLET_ADDRESS="0x..."
```

**`apps/web/.env.local`**:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 4\. Database Initialization

Nyalakan Docker dan siapkan tabel.

```bash
docker-compose up -d
cd packages/database
bun run db:push
bun x prisma generate
```

### 5\. Running the Project ⚡

Kembali ke root folder, jalankan mode development.

```bash
bun dev
```

  * Frontend berjalan di: `http://localhost:3000`
  * Backend berjalan di: `http://localhost:3001`

-----

## 🧪 How to Test (Scenario Flow)

Untuk demo atau testing tanpa keluar uang banyak:

1.  **Setup Tunnel:**
    Jalankan `ngrok http 3001` di terminal baru. Copy URL HTTPS-nya ke `.env` Backend (`WEBHOOK_BASE_URL`). Restart Backend.

2.  **Create Invoice (Merchant Side):**

      * Buka `http://localhost:3000`.
      * Masukkan nominal `50000`. Klik **Buat QR Code**.
      * Halaman QR akan muncul dengan status "Menunggu Pembayaran".

3.  **Simulate Payment (via Postman):**

      * Anda tidak perlu transfer USDT beneran untuk tes logika.
      * Kirim `POST` ke `http://localhost:3001/webhook/tatum`.
      * Body JSON:
        ```json
        {
          "address": "COPY_ADDRESS_DARI_LAYAR_FRONTEND",
          "amount": "3.50", 
          "txId": "0x_dummy_hash"
        }
        ```

4.  **Verification:**

      * Lihat layar Frontend: Akan berubah otomatis menjadi **HIJAU (Lunas)**.
      * Cek Database: Saldo merchant bertambah.

-----

## 🧹 The Sweeper System (On-Chain Settlement)

Fitur unik LokaPay adalah **Automated Asset Sweeping**. Sistem ini memastikan dana tidak nyangkut di deposit wallet.

Untuk menjalankan manual (setelah ada transaksi REAL di Mainnet):

```bash
cd apps/api
bun run sweeper.ts
```

*Script ini akan mengecek wallet yang sudah Lunas, mengirim BNB (Gas) dari Admin, dan menguras USDT ke Cold Wallet.*

-----

## 🛡 Security & Best Practices Implemented

1.  **Atomic Transactions:** Menggunakan `prisma.$transaction` untuk update saldo, mencegah *Race Condition* saat double webhook.
2.  **State Machine Logic:** Validasi ketat status `PENDING` -\> `PARTIAL` -\> `PAID` -\> `OVERPAID`.
3.  **Ephemeral Wallets:** Setiap transaksi menggunakan wallet baru untuk privasi dan kemudahan tracking (Zero Knowledge of Payer Identity required).
4.  **Validation:** Menggunakan `Zod` untuk validasi input API yang ketat.

-----

## 🔮 Future Roadmap

  * [ ] **Merchant Dashboard:** Grafik penjualan & request withdraw ke Bank Lokal.
  * [ ] **Multi-Chain Support:** Menambah support TRON (TRC20), Base, Arbitrum, Solana.
  * [ ] **Key Management System (KMS):** Enkripsi Private Key deposit wallet (saat ini disimpan di DB untuk MVP).

-----

Built with love by **Immanuel**.

```