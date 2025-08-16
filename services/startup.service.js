// services/startup.service.js
import { connectDB, redis } from "../config/index.js";
import { payoutQueue } from "../jobs/jobs.payout.js";
import { setupQueueDashboard } from "../config/queue-dashboard.js";

export class StartupService {
  static #initialized = false;
  static #shuttingDown = false;
  static #shutdownPromise = null;

  static async initialize(app, env) {
    if (this.#initialized) return; // prevent double init in the same process
    this.#initialized = true;

    console.log("Initializing Moveinn services...");

    await this.initializeDatabase();
    // await this.initializeRedis();
    // await this.initializeQueues();

    if (env.NODE_ENV !== "production") {
      // this.initializeDashboard(app);
    }

    console.log("All services initialized successfully");
  }

  static async initializeDatabase() {
    console.log("Connecting to database...");
    await connectDB();
  }

  // static async initializeRedis() {
  //   console.log("Connecting to Redis...");
  //   // node-redis v4 exposes isOpen; only connect if not already open
  //   if (!redis?.isOpen) {
  //     await redis.connect();
  //   }
  // }

  // static async initializeQueues() {
  //   console.log("Initializing payment queues...");
  //   // If payoutQueue.init exists, call it; otherwise rely on on-import init
  //   if (typeof payoutQueue?.init === "function") {
  //     await payoutQueue.init();
  //   }
  //   if (typeof payoutQueue?.getQueueStats === "function") {
  //     const stats = await payoutQueue.getQueueStats();
  //     console.log("Payment queues initialized", stats);
  //   } else {
  //     console.log("Payment queues initialized");
  //   }
  // }

  // static initializeDashboard(app) {
  //   setupQueueDashboard(app);
  //   console.log("Queue dashboard enabled");
  // }

  static async shutdown() {
    if (this.#shuttingDown) return this.#shutdownPromise; // idempotent
    this.#shuttingDown = true;

    console.log("Starting graceful shutdown...");

    this.#shutdownPromise = (async () => {
      // 1) Close queues/workers first
      try {
        if (typeof payoutQueue?.close === "function") {
          await payoutQueue.close();
        } else {
          // Be defensive: if you expose individual queues/workers
          await Promise.allSettled([
            payoutQueue?.payoutQueue?.close?.(),
            payoutQueue?.webhookQueue?.close?.(),
            payoutQueue?.notificationQueue?.close?.(),
            payoutQueue?.payoutWorker?.close?.(),
            payoutQueue?.webhookWorker?.close?.(),
            payoutQueue?.notificationWorker?.close?.(),
          ]);
        }
        console.log("All queues closed");
      } catch (e) {
        console.warn("Queue close warning:", e);
      }

      // 2) Close Redis cleanly if still open
      try {
        if (redis) {
          // node-redis v4
          if ("isOpen" in redis) {
            if (redis.isOpen) {
              await redis.quit(); // prefer quit() over disconnect()
            }
          } else if (redis.status) {
            // ioredis fallback
            if (!["end", "closing"].includes(redis.status)) {
              await redis.quit();
            }
          }
        }
        console.log("Redis closed");
      } catch (e) {
        // Ignore the “already closed” case, rethrow others
        if (e?.name !== "ClientClosedError") {
          console.error("Redis close error:", e);
          throw e;
        }
      }

      console.log("Shutdown completed");
    })();

    return this.#shutdownPromise;
  }
}

export const startupService = new StartupService();
