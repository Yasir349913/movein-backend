// services/email.service.js
import { transporter, emailConfig, env } from "../config/index.js";

class EmailService {
  // ===== Public APIs =====

  async sendPasswordResetEmail(email, resetToken, data = {}) {
    const subject = "Moveinn: Reset your password";
    const html = this.passwordResetHTML(resetToken, data);
    return this.send(email, subject, html);
  }

  async sendEmailVerification(email, verificationToken, data = {}) {
    const isEnglish = data.language !== "chinese";
    const subject = isEnglish ? "Moveinn: Verify your email" : "Moveinn：验证您的电子邮件";
    const html = this.emailVerificationHTML(verificationToken, data);
    return this.send(email, subject, html);
  }

  async sendWelcomeEmail(email, data = {}) {
    const isEnglish = data.language !== "chinese";
    const subject = isEnglish ? "Welcome to Moveinn" : "欢迎来到 Moveinn";
    const html = this.welcomeHTML(data);
    return this.send(email, subject, html);
  }

  async sendUniversityVerificationEmail(email, data = {}) {
    const subject = "Moveinn: University verification approved";
    const html = this.universityVerificationHTML(data);
    return this.send(email, subject, html);
  }

  // Generic payment emails (for background checks, subscription, etc.)
  async sendPaymentConfirmationEmail(email, data = {}) {
    // data: { userName, serviceName, amount, reference }
    const subject = "Moveinn: Payment confirmed";
    const html = this.paymentConfirmationHTML(data);
    return this.send(email, subject, html);
  }

  async sendPaymentFailedEmail(email, data = {}) {
    // data: { userName, serviceName, reason }
    const subject = "Moveinn: Payment failed";
    const html = this.paymentFailedHTML(data);
    return this.send(email, subject, html);
  }

  // ===== Core sender with retries =====

  async send(to, subject, html, retries = 0) {
    const maxRetries = emailConfig?.settings?.maxRetries ?? 3;
    const retryDelayMs = emailConfig?.settings?.retryDelay ?? 5000;

    try {
      const mailOptions = {
        from: `${emailConfig.from.name} <${emailConfig.from.address}>`,
        to,
        subject,
        html,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to} (id: ${result?.messageId ?? "n/a"})`);
      return result;
    } catch (err) {
      console.error(`Email send failed to ${to}:`, err?.message || err);
      if (retries < maxRetries) {
        console.log(`Retrying email to ${to} (${retries + 1}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, retryDelayMs));
        return this.send(to, subject, html, retries + 1);
      }
      throw err;
    }
  }

  // ===== Templating =====

  passwordResetHTML(resetToken, data = {}) {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
    const name = data.userName || "there";
    return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#1f2937;color:#fff;padding:24px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;font-size:20px">Reset your password</h1>
  </div>
  <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px">
    <p style="color:#111827">Hi ${name},</p>
    <p style="color:#374151">We received a request to reset your Moveinn password. Click the button below to set a new password.</p>
    <p style="text-align:center;margin:20px 0">
      <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Reset Password</a>
    </p>
    <p style="font-size:13px;color:#6b7280">If the button doesn't work, copy this link:</p>
    <p style="font-size:12px;background:#e5e7eb;padding:10px;border-radius:6px;word-break:break-all">${resetUrl}</p>
    <p style="font-size:13px;color:#6b7280">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    <p style="color:#111827">— The Moveinn Team</p>
  </div>
</div>`;
  }

  emailVerificationHTML(verificationToken, data = {}) {
    const url = `${env.CLIENT_URL}/verify-email?token=${encodeURIComponent(verificationToken)}`;
    const isEnglish = data.language !== "chinese";
    const name = data.userName || (isEnglish ? "there" : "用户");
    return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#2563eb;color:#fff;padding:24px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;font-size:20px">${isEnglish ? "Verify your email" : "验证您的电子邮件"}</h1>
  </div>
  <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px">
    <p style="color:#111827">${isEnglish ? `Hi ${name},` : `您好 ${name}，`}</p>
    <p style="color:#374151">${isEnglish ? "Click the button below to verify your email for Moveinn." : "点击下方按钮以验证您在 Moveinn 的邮箱。"}</p>
    <p style="text-align:center;margin:20px 0">
      <a href="${url}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">${isEnglish ? "Verify Email" : "验证邮箱"}</a>
    </p>
    <p style="font-size:13px;color:#6b7280">${isEnglish ? "Or copy this link:" : "或复制此链接："}</p>
    <p style="font-size:12px;background:#e5e7eb;padding:10px;border-radius:6px;word-break:break-all">${url}</p>
    <p style="font-size:13px;color:#6b7280">${isEnglish ? "This link expires in 24 hours." : "该链接于 24 小时后失效。"}</p>
    <p style="color:#111827">${isEnglish ? "— The Moveinn Team" : "— Moveinn 团队"}</p>
  </div>
</div>`;
  }

  welcomeHTML(data = {}) {
    const isEnglish = data.language !== "chinese";
    const name = data.userName || (isEnglish ? "there" : "用户");
    const dashboardUrl = `${env.CLIENT_URL}/dashboard`;
    const tenantNote =
      data.userType === "tenant" && data.discountEligible
        ? `<li>${isEnglish ? "Your student discount is active." : "您的学生折扣已激活。"}</li>`
        : "";
    return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#111827;color:#fff;padding:24px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;font-size:20px">${isEnglish ? "Welcome to Moveinn" : "欢迎来到 Moveinn"}</h1>
  </div>
  <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px">
    <p style="color:#111827">${isEnglish ? `Hi ${name},` : `您好 ${name}，`}</p>
    <p style="color:#374151">${isEnglish ? "Your account is ready. You can now:" : "您的账户已就绪。您现在可以："}</p>
    <ul style="color:#374151">
      <li>${isEnglish ? "Browse properties" : "浏览房源"}</li>
      <li>${isEnglish ? "Find roommates" : "寻找室友"}</li>
      <li>${isEnglish ? "Complete verification" : "完成身份与在校验证"}</li>
      ${tenantNote}
    </ul>
    <p style="text-align:center;margin:20px 0">
      <a href="${dashboardUrl}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">${isEnglish ? "Go to dashboard" : "前往仪表板"}</a>
    </p>
    <p style="color:#111827">${isEnglish ? "— The Moveinn Team" : "— Moveinn 团队"}</p>
  </div>
</div>`;
  }

  universityVerificationHTML(data = {}) {
    const name = data.userName || "there";
    const uni = data.universityName || "your university";
    const email = data.studentEmail || "";
    const discount = typeof data.discountPercentage === "number" ? data.discountPercentage : 0;
    return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#065f46;color:#fff;padding:24px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;font-size:20px">University verification approved</h1>
  </div>
  <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px">
    <p style="color:#111827">Hi ${name},</p>
    <p style="color:#374151">Your student status has been verified.</p>
    <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:12px;border-radius:6px;margin:16px 0">
      <p style="margin:0;color:#065f46"><strong>Details</strong></p>
      <ul style="margin:6px 0 0 18px;color:#065f46">
        <li>University: ${uni}</li>
        <li>Student email: ${email}</li>
        <li>Discount: ${discount}%</li>
      </ul>
    </div>
    <p style="color:#111827">— The Moveinn Team</p>
  </div>
</div>`;
  }

  paymentConfirmationHTML(data = {}) {
    const name = data.userName || "there";
    const service = data.serviceName || "Moveinn service";
    const amount = data.amount != null ? `${data.amount}` : "—";
    const ref = data.reference || "—";
    return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#0f766e;color:#fff;padding:24px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;font-size:20px">Payment confirmed</h1>
  </div>
  <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px">
    <p style="color:#111827">Hi ${name},</p>
    <p style="color:#374151">We’ve received your payment for <strong>${service}</strong>.</p>
    <div style="background:#fff;border-left:4px solid #0f766e;padding:12px;border-radius:6px;margin:16px 0">
      <p style="margin:0"><strong>Amount:</strong> ${amount}</p>
      <p style="margin:0"><strong>Reference:</strong> ${ref}</p>
      <p style="margin:0"><strong>Status:</strong> Processing</p>
    </div>
    <p style="color:#111827">— The Moveinn Team</p>
  </div>
</div>`;
  }

  paymentFailedHTML(data = {}) {
    const name = data.userName || "there";
    const service = data.serviceName || "Moveinn service";
    const reason = data.reason || "Unknown error";
    const retryUrl = `${env.CLIENT_URL}/billing`;
    return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#991b1b;color:#fff;padding:24px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;font-size:20px">Payment failed</h1>
  </div>
  <div style="background:#f8fafc;padding:24px;border-radius:0 0 8px 8px">
    <p style="color:#111827">Hi ${name},</p>
    <p style="color:#374151">We couldn't process your payment for <strong>${service}</strong>.</p>
    <div style="background:#fee2e2;border-left:4px solid #dc2626;padding:12px;border-radius:6px;margin:16px 0">
      <p style="margin:0"><strong>Reason:</strong> ${reason}</p>
    </div>
    <p style="text-align:center;margin:20px 0">
      <a href="${retryUrl}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Retry payment</a>
    </p>
    <p style="color:#111827">— The Moveinn Team</p>
  </div>
</div>`;
  }
}

export const emailService = new EmailService();
