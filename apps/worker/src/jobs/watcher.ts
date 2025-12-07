import { ethers } from 'ethers';
import { prisma } from '@lokapay/database';
import { provider, USDT_ADDRESS } from '../constants/contracts';
import { sweepQueue } from '../queue';

const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];
const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

export async function runWatcherTask() {
  console.log('👀 [WATCHER] Scanning transactions...');

  try {
    // Scan transaksi yang masih pending/partial DAN yang sudah PAID/OVERPAID tapi belum di-sweep
    const pendingTx = await prisma.transaction.findMany({
      where: {
        OR: [
          { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
          {
            status: { in: ['PAID', 'OVERPAID'] },
            sweptAt: null
          }
        ]
      }
    });

    if (pendingTx.length === 0) {
      console.log('   No transactions to process');
      return;
    }

    console.log(`   Found ${pendingTx.length} transaction(s) to process`);

    for (const tx of pendingTx) {
      let balance = 0;
      try {
        const balanceBN = await usdtContract?.balanceOf?.(tx.paymentAddress);
        balance = parseFloat(ethers.formatUnits(balanceBN, 18));
        if (balance < 0.01) {
          console.log(`💰 Skipping transaction ${tx.paymentAddress} - Balance too low: ${balance} USDT`);
          continue;
        }
      } catch (err) {
        console.error(`Gagal cek saldo ${tx.paymentAddress}, skip.`);
        continue;
      }

      const recordedBalanceUSDT = parseFloat(tx.amountReceivedUSDT.toString());
      const isAlreadyFinal = tx.status === 'PAID' || tx.status === 'OVERPAID';

      const shouldProcess = isAlreadyFinal
        ? (balance > 0 && !tx.sweptAt)
        : (balance > recordedBalanceUSDT);

      if (shouldProcess) {
        if (!isAlreadyFinal) {
          const newMoney = balance - recordedBalanceUSDT;
          console.log(`💰 Duit Masuk di ${tx.paymentAddress}: +${newMoney}`);
        } else {
          console.log(`💰 Checking final transaction ${tx.paymentAddress}: Balance ${balance} USDT, Status: ${tx.status}`);
        }

        const targetAmount = Number(tx.amountUSDT || 0);
        const isFullPayment = balance >= targetAmount;

        // Hitung semua nilai yang diperlukan
        const exchangeRate = parseFloat(tx.exchangeRate.toString())
        const amountReceivedIdr = Math.floor(balance * exchangeRate)
        const amountInvoice = parseFloat(tx.amountInvoice.toString())
        const feeApp = amountInvoice * 0.015

        // Hitung tip jika overpaid
        let tipIdr = 0
        if (isFullPayment && balance > targetAmount) {
          const excessUSDT = balance - targetAmount
          tipIdr = Math.floor(excessUSDT * exchangeRate)
        }

        // Tentukan status baru (hanya untuk transaksi yang belum final)
        let newStatus = tx.status;
        if (!isAlreadyFinal) {
          if (balance >= targetAmount + 0.1) {
            newStatus = 'OVERPAID';
          } else if (isFullPayment) {
            newStatus = 'PAID';
          } else {
            newStatus = 'PARTIALLY_PAID';
          }
        }

        // Check apakah status berubah dari non-final ke final
        const isFinal = newStatus === 'PAID' || newStatus === 'OVERPAID' || isAlreadyFinal;
        const wasNotFinal = tx.status !== 'PAID' && tx.status !== 'OVERPAID';

        // Update Database dengan transaction untuk atomicity (hanya untuk transaksi yang belum final)
        if (!isAlreadyFinal) {
          await prisma.$transaction(async (txPrisma) => {
            // Update Transaction dengan semua field yang sudah dihitung
            await txPrisma.transaction.update({
              where: { id: tx.id },
              data: {
                // Field Payment Received
                amountReceivedUSDT: balance,
                amountReceivedIdr: amountReceivedIdr,
                // Field Breakdown
                tipIdr: tipIdr,
                feeApp: feeApp,
                status: newStatus,
                confirmedAt: isFinal && wasNotFinal ? new Date() : undefined,
                updatedAt: new Date()
              }
            });

            // Update Merchant Balance jika status berubah ke final
            if (isFinal && wasNotFinal) {
              // Merchant menerima amountInvoice (tagihan asli) + tip jika ada
              const creditIDR = amountInvoice + tipIdr;

              await txPrisma.merchant.update({
                where: { id: tx.merchantId },
                data: { balanceIDR: { increment: creditIDR } }
              });
              console.log(`💰 Merchant Credited: Rp ${creditIDR} (Invoice: ${amountInvoice} + Tip: ${tipIdr})`);

              // Update settledAt saat balance di-credit
              await txPrisma.transaction.update({
                where: { id: tx.id },
                data: { settledAt: new Date() }
              });
              console.log(`✅ SettledAt updated for transaction ${tx.id}`);
            }
          });
        }

        // Trigger sweep hanya jika ada balance dan status sudah final (PAID atau OVERPAID)
        if (balance > 0 && isFinal) {
          // Cek apakah sudah pernah di-sweep (untuk avoid duplicate)
          const currentTx = await prisma.transaction.findUnique({
            where: { id: tx.id },
            select: { sweptAt: true }
          });

          if (!currentTx?.sweptAt) {
            try {
              const job = await sweepQueue.add('sweep-job', {
                txId: tx.id,
                paymentAddress: tx.paymentAddress,
                salt: tx.salt
              });
              console.log(`🚀 Triggered Relayer untuk ${tx.paymentAddress} (Status: ${tx.status}, Balance: ${balance} USDT, Job ID: ${job.id})`);
            } catch (queueError) {
              console.error(`❌ Gagal menambahkan ke queue untuk ${tx.paymentAddress}:`, queueError);
              console.error(`   Error details:`, queueError instanceof Error ? queueError.message : String(queueError));
            }
          } else {
            console.log(`⏭️ Skip sweep untuk ${tx.paymentAddress} - sudah di-sweep sebelumnya`);
          }
        } else {
          console.log(`⏸️ Skip sweep untuk ${tx.paymentAddress} - Status: ${tx.status}, Balance: ${balance} USDT, isFinal: ${isFinal}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Watcher Error:", error);
  }
}