import { ethers } from 'ethers';
import { prisma } from '@lokapay/database';
import { provider, USDT_ADDRESS } from '../constants/contracts';
import { sweepQueue } from '../queue';

const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];
const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

export async function runWatcherTask() {
  console.log('👀 [WATCHER] Scanning pending transactions...');

  try {
    const pendingTx = await prisma.transaction.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIALLY_PAID'] },
      }
    });

    if (pendingTx.length === 0) return;

    for (const tx of pendingTx) {
      let balance = 0;
      try {
        const balanceBN = await usdtContract?.balanceOf?.(tx.paymentAddress);
        balance = parseFloat(ethers.formatUnits(balanceBN, 18));
      } catch (err) {
        console.error(`Gagal cek saldo ${tx.paymentAddress}, skip.`);
        continue;
      }

      const recordedBalance = parseFloat(tx.amountReceived.toString());

      if (balance > recordedBalance) {
        const newMoney = balance - recordedBalance;
        console.log(`💰 Duit Masuk di ${tx.paymentAddress}: +${newMoney}`);

        const targetAmount = Number(tx.amountUSDT || 0);
        const isFullPayment = balance >= targetAmount;

        // Update Database
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            amountReceived: balance,
            status: isFullPayment ? 'PAID' : 'PARTIALLY_PAID',
            updatedAt: new Date()
          }
        });

        if (balance > 0) {
          await sweepQueue.add('sweep-job', {
            txId: tx.id,
            paymentAddress: tx.paymentAddress,
            salt: tx.salt
          });
          console.log(`🚀 Triggered Relayer untuk ${tx.paymentAddress}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Watcher Error:", error);
  }
}