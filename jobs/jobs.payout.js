// jobs/payoutQueue.js
import Queue from 'bull';
import { redis, redisConfig } from '../config/index.js';
import { payoutService, webhookService } from '../services/index.js';
import { logger } from '../utils/index.js';

export class PayoutQueue {
  constructor() {
    // Initialize queues with your Redis config
    this.payoutQueue = new Queue(`${redisConfig.prefixes.queue}payouts`, {
      redis: redis.options,
      defaultJobOptions: redisConfig.queue.defaultJobOptions
    });

    this.webhookQueue = new Queue(`${redisConfig.prefixes.queue}webhooks`, {
      redis: redis.options,
      defaultJobOptions: redisConfig.queue.defaultJobOptions
    });

    this.notificationQueue = new Queue(`${redisConfig.prefixes.queue}notifications`, {
      redis: redis.options,
      defaultJobOptions: redisConfig.queue.defaultJobOptions
    });
    
    this.setupProcessors();
    this.setupSchedules();
    this.setupEventHandlers();
  }

  // ============= JOB PROCESSORS =============

  setupProcessors() {
    // Weekly payout processor
    this.payoutQueue.process('weekly-payouts', 5, async (job) => {
      logger.info('Processing weekly payouts job', { jobId: job.id });
      
      try {
        const result = await payoutService.processPendingPayouts();
        
        logger.info('Weekly payouts completed', { 
          jobId: job.id, 
          processed: result.processed, 
          failed: result.failed 
        });
        
        return result;
      } catch (error) {
        logger.error('Weekly payouts job failed', { 
          jobId: job.id, 
          error: error.message 
        });
        throw error;
      }
    });

    // Individual payout processor (on-demand)
    this.payoutQueue.process('single-payout', 3, async (job) => {
      const { landlord_id } = job.data;
      logger.info('Processing single payout', { jobId: job.id, landlord_id });
      
      try {
        const pendingPayouts = await payoutService.calculatePendingPayouts(landlord_id);
        
        if (pendingPayouts.length === 0) {
          return { message: 'No pending payouts for landlord', landlord_id };
        }

        // Process single landlord payout
        const result = await payoutService.processSingleLandlordPayout(landlord_id);
        
        logger.info('Single payout completed', { 
          jobId: job.id, 
          landlord_id, 
          amount: result.amount 
        });
        
        return result;
      } catch (error) {
        logger.error('Single payout job failed', { 
          jobId: job.id, 
          landlord_id, 
          error: error.message 
        });
        throw error;
      }
    });

    // Webhook retry processor
    this.webhookQueue.process('retry-webhooks', 10, async (job) => {
      logger.info('Processing webhook retries', { jobId: job.id });
      
      try {
        const result = await webhookService.retryFailedWebhooks();
        
        logger.info('Webhook retries completed', { 
          jobId: job.id, 
          retried: result 
        });
        
        return { retried_count: result };
      } catch (error) {
        logger.error('Webhook retry job failed', { 
          jobId: job.id, 
          error: error.message 
        });
        throw error;
      }
    });

    // Failed payout retry processor
    this.payoutQueue.process('retry-failed-payouts', 3, async (job) => {
      logger.info('Processing failed payout retries', { jobId: job.id });
      
      try {
        const result = await payoutService.retryFailedPayouts();
        
        logger.info('Failed payout retries completed', { 
          jobId: job.id, 
          retried: result 
        });
        
        return { retried_count: result };
      } catch (error) {
        logger.error('Failed payout retry job failed', { 
          jobId: job.id, 
          error: error.message 
        });
        throw error;
      }
    });

    // Subscription renewal processor
    this.payoutQueue.process('subscription-renewals', 5, async (job) => {
      logger.info('Processing subscription renewals', { jobId: job.id });
      
      try {
        // Add subscription renewal logic here
        const result = await paymentService.processSubscriptionRenewals();
        
        logger.info('Subscription renewals completed', { 
          jobId: job.id, 
          renewed: result.renewed,
          failed: result.failed 
        });
        
        return result;
      } catch (error) {
        logger.error('Subscription renewal job failed', { 
          jobId: job.id, 
          error: error.message 
        });
        throw error;
      }
    });

    // Notification processor
    this.notificationQueue.process('send-notifications', 20, async (job) => {
      const { type, user_id, data } = job.data;
      logger.info('Processing notification', { jobId: job.id, type, user_id });
      
      try {
        // Add notification sending logic here
        // await notificationService.sendNotification(type, user_id, data);
        
        return { sent: true, type, user_id };
      } catch (error) {
        logger.error('Notification job failed', { 
          jobId: job.id, 
          type, 
          user_id, 
          error: error.message 
        });
        throw error;
      }
    });
  }

  // ============= SCHEDULED JOBS =============

  setupSchedules() {
    // Weekly payouts every Friday at 10 AM
    this.payoutQueue.add('weekly-payouts', {}, {
      repeat: { cron: '0 10 * * 5' }, // Friday 10 AM
      attempts: 3,
      backoff: 'exponential',
      removeOnComplete: 5,
      removeOnFail: 10
    });

    // Retry failed webhooks every hour
    this.webhookQueue.add('retry-webhooks', {}, {
      repeat: { cron: '0 * * * *' }, // Every hour
      attempts: 5,
      backoff: 'exponential',
      removeOnComplete: 3,
      removeOnFail: 5
    });

    // Retry failed payouts every 6 hours
    this.payoutQueue.add('retry-failed-payouts', {}, {
      repeat: { cron: '0 */6 * * *' }, // Every 6 hours
      attempts: 3,
      backoff: 'exponential',
      removeOnComplete: 3,
      removeOnFail: 5
    });

    // Daily subscription renewal check
    this.payoutQueue.add('subscription-renewals', {}, {
      repeat: { cron: '0 9 * * *' }, // Every day at 9 AM
      attempts: 2,
      backoff: 'exponential',
      removeOnComplete: 7,
      removeOnFail: 14
    });

    logger.info('Queue schedules initialized');
  }

  // ============= EVENT HANDLERS =============

  setupEventHandlers() {
    // Payout queue events
    this.payoutQueue.on('completed', (job, result) => {
      logger.info('Payout job completed', { 
        jobId: job.id, 
        type: job.name,
        result 
      });
    });

    this.payoutQueue.on('failed', (job, error) => {
      logger.error('Payout job failed', { 
        jobId: job.id, 
        type: job.name,
        error: error.message,
        attempts: job.attemptsMade 
      });
    });

    this.payoutQueue.on('stalled', (job) => {
      logger.warn('Payout job stalled', { 
        jobId: job.id, 
        type: job.name 
      });
    });

    // Webhook queue events  
    this.webhookQueue.on('completed', (job, result) => {
      logger.info('Webhook job completed', { 
        jobId: job.id, 
        type: job.name,
        result 
      });
    });

    this.webhookQueue.on('failed', (job, error) => {
      logger.error('Webhook job failed', { 
        jobId: job.id, 
        type: job.name,
        error: error.message 
      });
    });

    // Notification queue events
    this.notificationQueue.on('completed', (job) => {
      logger.info('Notification sent', { 
        jobId: job.id,
        type: job.data.type,
        user_id: job.data.user_id 
      });
    });
  }

  // ============= PUBLIC METHODS =============

  // Add immediate payout job
  async addPayoutJob(landlord_id, priority = 'normal') {
    const jobOptions = {
      attempts: 3,
      backoff: 'exponential',
      priority: priority === 'high' ? 1 : 5
    };

    const job = await this.payoutQueue.add('single-payout', { landlord_id }, jobOptions);
    
    logger.info('Payout job added', { 
      jobId: job.id, 
      landlord_id, 
      priority 
    });
    
    return job;
  }

  // Add notification job
  async addNotificationJob(type, user_id, data, delay = 0) {
    const jobOptions = {
      delay: delay, // Delay in milliseconds
      attempts: 2,
      backoff: 'exponential'
    };

    const job = await this.notificationQueue.add('send-notifications', {
      type,
      user_id,
      data
    }, jobOptions);
    
    logger.info('Notification job added', { 
      jobId: job.id, 
      type, 
      user_id,
      delay 
    });
    
    return job;
  }

  // Add webhook retry job (manual trigger)
  async addWebhookRetryJob() {
    const job = await this.webhookQueue.add('retry-webhooks', {}, {
      attempts: 1 // Manual retry, don't auto-retry
    });
    
    logger.info('Manual webhook retry job added', { jobId: job.id });
    return job;
  }

  // ============= QUEUE MONITORING =============

  async getQueueStats() {
    const [
      payoutStats,
      webhookStats,
      notificationStats
    ] = await Promise.all([
      this.getQueueStatsByType(this.payoutQueue),
      this.getQueueStatsByType(this.webhookQueue),
      this.getQueueStatsByType(this.notificationQueue)
    ]);

    return {
      payouts: payoutStats,
      webhooks: webhookStats,
      notifications: notificationStats,
      timestamp: new Date().toISOString()
    };
  }

  async getQueueStatsByType(queue) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length
    };
  }

  // Clean old jobs
  async cleanOldJobs() {
    const olderThan = 24 * 60 * 60 * 1000; // 24 hours

    await Promise.all([
      this.payoutQueue.clean(olderThan, 'completed'),
      this.payoutQueue.clean(olderThan, 'failed'),
      this.webhookQueue.clean(olderThan, 'completed'),
      this.webhookQueue.clean(olderThan, 'failed'),
      this.notificationQueue.clean(olderThan, 'completed')
    ]);

    logger.info('Old jobs cleaned from queues');
  }

  // Graceful shutdown
  async close() {
    await Promise.all([
      this.payoutQueue.close(),
      this.webhookQueue.close(),
      this.notificationQueue.close()
    ]);
    
    logger.info('All queues closed');
  }
}

// Export singleton instance
export const payoutQueue = new PayoutQueue();