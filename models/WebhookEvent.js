// models/WebhookEvent.js
import mongoose from "mongoose";
import { WEBHOOK_EVENT_TYPES, WEBHOOK_GATEWAYS } from "../utils/enums.js";


// Define the WebhookEvent schema
const webhookEventSchema = new mongoose.Schema(
  {
    webhook_id: {
      type: String,
      required: true,
      unique: true
    },

    event_type: {
      type: String,
      enum: Object.values(WEBHOOK_EVENT_TYPES),
      required: true
    },

    gateway: {
      type: String,
      enum: Object.values(WEBHOOK_GATEWAYS),
      required: true
    },

    event_data: {
      type: mongoose.Schema.Types.Mixed,
      required: true // Complete webhook payload
    },
    processed: {
      type: Boolean,
      default: false
    },
    processed_at: Date,
    processing_attempts: {
      type: Number,
      default: 0
    },
    related_transaction_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    related_subscription_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    related_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processing_error: String,
    retry_after: Date

  },
  { timestamps: true }
);

// Add indexes for performance
webhookEventSchema.index({ processed: 1, processed_at: 1 });
webhookEventSchema.index({ related_transaction_id: 1 });
webhookEventSchema.index({ related_subscription_id: 1 });
webhookEventSchema.index({ related_user_id: 1 });
// Add a compound index for event type and gateway
webhookEventSchema.index({ event_type: 1, gateway: 1 });
// Add a compound index for processing attempts and processed status
webhookEventSchema.index({ processing_attempts: 1, processed: 1 });
// Add a compound index for related transaction and user
webhookEventSchema.index({ related_transaction_id: 1, related_user_id: 1 });
// Add a compound index for related subscription and user
webhookEventSchema.index({ related_subscription_id: 1, related_user_id: 1 });


export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);