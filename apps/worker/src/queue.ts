import { Queue, Worker, type Processor } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
});

const QUEUE_NAME = 'sweep-fund-queue';
// 2. Export Queue (Dipakai oleh Watcher untuk MENAMBAH tugas)
export const sweepQueue = new Queue(QUEUE_NAME, { connection });

export const setupWorker = (processor: Processor) => {
    const worker = new Worker(QUEUE_NAME, processor, {
        connection,
        concurrency: 1,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 }
    });

    worker.on('completed', (job) => {
        console.log(`[Queue] ✅ Job ${job.id} selesai!`);
    });

    worker.on('failed', (job, err) => {
        console.error(`[Queue] ❌ Job ${job?.id} gagal:`, err);
    });

    console.log(`[Queue] Worker siap menerima tugas di antrian: ${QUEUE_NAME}`);

    return worker;
};