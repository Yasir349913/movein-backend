// config/stripe.js
import Stripe from "stripe";
import { env } from "./env.js";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export const stripeConfig = {
  currency: "usd",
  paymentMethods: ["card"],
  webhookEvents: [
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "payment_intent.canceled",
  ],
  
  // Payment Intent Settings
  paymentIntent: {
    automaticPaymentMethods: {
      enabled: true,
    },
    captureMethod: "automatic",
    confirmationMethod: "automatic",
  },
  
  // Refund Settings
  refund: {
    reason: "requested_by_customer",
  },
};

// Helper function to format amount for Stripe (cents)
export const formatStripeAmount = (amount) => {
  return Math.round(amount * 100); // Convert dollars to cents
};

// Helper function to format amount from Stripe (dollars)
export const formatDisplayAmount = (stripeAmount) => {
  return (stripeAmount / 100).toFixed(2); // Convert cents to dollars
};