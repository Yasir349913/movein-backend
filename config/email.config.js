// config/email.js
import nodemailer from "nodemailer";
import { env } from "./env.config.js";

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT == 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const emailConfig = {
  from: {
    name: env.FROM_NAME,
    address: env.FROM_EMAIL,
  },

  templates: {
    welcome: "welcome",
    emailVerification: "email-verification",
    passwordReset: "password-reset",
    bookCompleted: "book-completed",
    paymentConfirmation: "payment-confirmation",
  },
};