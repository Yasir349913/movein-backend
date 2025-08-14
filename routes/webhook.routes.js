// routes/webhook.routes.js
import { Router } from "express";
import { webhookController } from "../controllers/index.js";
import { auth } from "../middlewares/index.js";
import express from 'express';

const router = Router();

// Webhook endpoints (no auth, raw body needed)
router.post('/stripe', 
  express.raw({ type: 'application/json' }), 
  webhookController.handleStripeWebhook
);

router.post('/paypal', 
  express.json(), 
  webhookController.handlePayPalWebhook
);

// Admin endpoint to retry failed webhooks
router.post('/retry-failed', 
  auth, 
  webhookController.retryFailedWebhooks
);

export default router;