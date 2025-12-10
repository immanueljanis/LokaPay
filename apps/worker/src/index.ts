import 'dotenv/config';
import cron from 'node-cron';
import { runWatcherTask } from './jobs/watcher';
import { relayProcessor } from './jobs/relayer';
import { setupWorker } from './queue';

async function main() {
    console.log("========================================");
    console.log("🚀 LOKAPAY WORKER SERVICE STARTED");
    console.log("========================================");

    setupWorker(relayProcessor);
    console.log("✅ Relayer Worker: READY (Listening to Queue)");
    console.log("✅ Watcher Cron: SCHEDULED (Every 15s)");
    cron.schedule('*/15 * * * * *', async () => {
        await runWatcherTask();
    });
}

// Jalankan fungsi main
main().catch(err => {
    console.error("FATAL ERROR:", err);
    process.exit(1);
});