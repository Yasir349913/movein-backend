// config/queue-dashboard.js (ESM)
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter.js'; // ← ESM needs .js
import { ExpressAdapter } from '@bull-board/express';
import { payoutQueue } from '../jobs/jobs.payout.js';
import { auth, authorize } from '../middlewares/index.js';
import { env } from './index.js';

export function setupQueueDashboard(app) {
  const serverAdapter = new ExpressAdapter();

  // Set base path to EXACTLY where you'll mount the router (differs by env)
  const mountPath =
    env.NODE_ENV === 'production'
      ? '/api/v1/admin/queues'
      : '/admin/queues';

  serverAdapter.setBasePath(mountPath);

  createBullBoard({
    queues: [
      new BullAdapter(payoutQueue.payoutQueue),
      new BullAdapter(payoutQueue.webhookQueue),
      new BullAdapter(payoutQueue.notificationQueue),
    ],
    serverAdapter,
  });

  if (env.NODE_ENV === 'production') {
    // Production: auth + /api/v1/admin/queues
    app.use(
      mountPath,
      auth,
      authorize(['admin', 'super_admin']),
      serverAdapter.getRouter()
    );
    console.log(`Queue dashboard available at ${mountPath} (AUTH REQUIRED)`);
  } else if (env.NODE_ENV === 'staging') {
    // Staging: auth + /admin/queues
    app.use(
      mountPath,
      auth,
      authorize(['admin', 'super_admin']),
      serverAdapter.getRouter()
    );
    console.log(`Queue dashboard available at ${mountPath} (AUTH REQUIRED)`);
  } else {
    // Dev: no auth + /admin/queues
    app.use(mountPath, serverAdapter.getRouter());
    console.log(`Queue dashboard available at ${mountPath} (NO AUTH - DEV ONLY)`);
  }
}
