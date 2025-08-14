// controllers/webhook.controller.js
import { webhookService } from '../services/index.js';
import { logger } from '../utils/index.js';

/**
 * Handle Stripe webhooks
 */
export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const payload = req.body;

  logger.info('Stripe webhook received', { 
    signature: signature?.substring(0, 20) + '...',
    payloadSize: payload?.length 
  });

  try {
    const result = await webhookService.processStripeWebhook(payload, signature);
    
    res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    logger.error('Stripe webhook processing failed', { error: error.message });
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Handle PayPal webhooks
 */
export const handlePayPalWebhook = async (req, res) => {
  const headers = req.headers;
  const payload = JSON.stringify(req.body);

  logger.info('PayPal webhook received', { 
    eventType: req.body?.event_type,
    eventId: req.body?.id 
  });

  try {
    const result = await webhookService.processPayPalWebhook(payload, headers);
    
    res.status(200).json({
      success: true,
      message: result.message
    });

  } catch (error) {
    logger.error('PayPal webhook processing failed', { error: error.message });
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Retry failed webhooks (admin endpoint)
 */
export const retryFailedWebhooks = async (req, res) => {
  const userId = req.user._id;
  
  logger.info('Manual webhook retry initiated', { userId });

  try {
    const retriedCount = await webhookService.retryFailedWebhooks();
    
    res.status(200).json({
      success: true,
      message: `Retried ${retriedCount} failed webhooks`,
      data: { retried_count: retriedCount }
    });

  } catch (error) {
    logger.error('Webhook retry failed', { userId, error: error.message });
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};