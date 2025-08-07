// services/email.service.js
import { transporter, emailConfig } from "../config/index.js";

class EmailService {

  async sendPasswordResetEmail(email, resetToken, data) {
    const subject = "Reset Your Password - AI Storybook Generator";
    const html = this.generatePasswordResetHTML(resetToken, data);

    return await this.sendEmail(email, subject, html);
  }


  async sendPaymentConfirmationEmail(email, data) {
    const subject = "Payment Confirmation - Your Storybook is Being Created!";
    const html = this.generatePaymentConfirmationHTML(data);

    return await this.sendEmail(email, subject, html);
  }

  async sendPaymentFailedEmail(email, data) {
    const subject = "Payment Issue - Let's Get Your Storybook Created";
    const html = this.generatePaymentFailedHTML(data);

    return await this.sendEmail(email, subject, html);
  }

  async sendEmail(to, subject, html, retries = 0) {
    try {
      const mailOptions = {
        from: `${emailConfig.from.name} <${emailConfig.from.address}>`,
        to,
        subject,
        html,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${to}:`, result.messageId);
      return result;

    } catch (error) {
      console.error(`❌ Email sending failed to ${to}:`, error);

      if (retries < emailConfig.settings?.maxRetries || 3) {
        console.log(`🔄 Retrying email to ${to}, attempt ${retries + 1}`);
        await new Promise(resolve => setTimeout(resolve, emailConfig.settings?.retryDelay || 5000));
        return this.sendEmail(to, subject, html, retries + 1);
      }

      throw error;
    }
  }

  async sendEmailVerification(email, verificationToken, data) {
    const subject = data.language === 'chinese' ? '验证您的电子邮件' : 'Verify Your Email Address';
    const html = this.generateMoveinnVerificationHTML(verificationToken, data);

    return await this.sendEmail(email, subject, html);
  }

  async sendWelcomeEmail(email, data) {
    const subject = data.language === 'chinese' ? '欢迎来到 Moveinn！' : 'Welcome to Moveinn!';
    const html = this.generateMoveinnWelcomeHTML(data);

    return await this.sendEmail(email, subject, html);
  }

  async sendUniversityVerificationEmail(email, data) {
    const subject = 'University Student Verification - Moveinn';
    const html = this.generateUniversityVerificationHTML(data);

    return await this.sendEmail(email, subject, html);
  }

  generatePasswordResetHTML(resetToken, data) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 26px;">Reset Your Password</h1>
        <p style="margin: 10px 0 0; font-size: 15px;">Secure your account</p>
      </div>

      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e293b;">Hi ${data.userName},</h2>
        <p style="color: #475569;">We received a request to reset your password. Click the button below to set a new password:</p>

        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetUrl}"
             style="background: #f59e0b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            Reset Password
          </a>
        </div>

        <p style="font-size: 14px; color: #64748b;">Or copy this link into your browser:</p>
        <p style="font-size: 13px; word-break: break-all; background: #e2e8f0; padding: 10px; border-radius: 6px;">${resetUrl}</p>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;"><strong>Important:</strong></p>
          <ul style="color: #92400e; margin: 5px 0 0 0; padding-left: 20px;">
            <li>This link will expire in 1 hour</li>
            <li>If you didn't request this, please ignore this email</li>
            <li>Your password won't change until you create a new one</li>
          </ul>
        </div>

        <p style="color: #475569;">If you continue to have problems, please contact our support team.</p>
        
        <p style="color: #475569;">Best regards,<br>The AI Storybook Generator Team</p>
      </div>
    </div>`;
  }

  generateMoveinnVerificationHTML(verificationToken, data) {
    const url = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    const isEnglish = data.language !== 'chinese';

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 26px;">${isEnglish ? 'Verify Your Email' : '验证您的电子邮件'}</h1>
        <p style="margin: 10px 0 0; font-size: 15px;">${isEnglish ? 'Welcome to Moveinn' : '欢迎来到 Moveinn'}</p>
      </div>

      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e293b;">${isEnglish ? `Hi ${data.userName},` : `您好 ${data.userName}，`}</h2>
        <p style="color: #475569;">${isEnglish ? 'Click the button below to verify your email address:' : '点击下面的按钮验证您的电子邮件地址：'}</p>

        <div style="text-align: center; margin: 20px 0;">
          <a href="${url}" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            ${isEnglish ? 'Verify Email' : '验证邮箱'}
          </a>
        </div>

        <p style="font-size: 14px; color: #64748b;">${isEnglish ? 'Or copy this link into your browser:' : '或者将此链接复制到浏览器中：'}</p>
        <p style="font-size: 13px; word-break: break-all; background: #e2e8f0; padding: 10px; border-radius: 6px;">${url}</p>

        <p style="color: #475569;">${isEnglish ? 'This link will expire in 24 hours.' : '此链接将在24小时后过期。'}</p>
        
        <p style="color: #475569;">${isEnglish ? 'Best regards,' : '此致敬礼，'}<br>The Moveinn Team</p>
      </div>
    </div>`;
  }

  generateMoveinnWelcomeHTML(data) {
    const isEnglish = data.language !== 'chinese';

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 26px;">${isEnglish ? 'Welcome to Moveinn' : '欢迎来到 Moveinn'}</h1>
        <p style="margin: 10px 0 0; font-size: 15px; opacity: 0.9;">${isEnglish ? 'Your rental journey begins here!' : '您的租房之旅从这里开始！'}</p>
      </div>

      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e293b; margin-bottom: 20px;">${isEnglish ? `Hi ${data.userName}!` : `您好 ${data.userName}！`}</h2>

        <p style="color: #475569; line-height: 1.6;">${isEnglish ? 'Your account is now active! You can now:' : '您的账户现已激活！您现在可以：'}</p>
        <ul style="color: #475569;">
          <li>${isEnglish ? 'Browse available properties' : '浏览可用房源'}</li>
          <li>${isEnglish ? 'Find compatible roommates' : '寻找合适的室友'}</li>
          <li>${isEnglish ? 'Apply for background verification' : '申请背景验证'}</li>
          ${data.userType === 'tenant' && data.discountEligible ? `<li>${isEnglish ? 'Enjoy your 15% student discount!' : '享受您的15%学生折扣！'}</li>` : ''}
        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/dashboard" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            ${isEnglish ? 'Go to Dashboard' : '前往仪表板'}
          </a>
        </div>

        <p style="color: #475569;">${isEnglish ? 'Happy house hunting!' : '祝您找房愉快！'}<br>The Moveinn Team</p>
      </div>
    </div>`;
  }

  generateUniversityVerificationHTML(data) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #059669; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 26px;">University Verification Approved</h1>
        <p style="margin: 10px 0 0; font-size: 15px;">Student discount activated!</p>
      </div>

      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e293b;">Hi ${data.userName},</h2>
        <p style="color: #475569;">Great news! Your university student status has been verified.</p>

        <div style="background: #dcfce7; border-left: 4px solid #059669; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #166534;"><strong>Verification Details:</strong></p>
          <ul style="color: #166534; margin: 5px 0 0 0; padding-left: 20px;">
            <li>University: ${data.universityName}</li>
            <li>Student Email: ${data.studentEmail}</li>
            <li>Discount: ${data.discountPercentage}% off all services</li>
          </ul>
        </div>

        <p style="color: #475569;">Your student discount is now active and will be automatically applied to all services.</p>
        
        <p style="color: #475569;">Best regards,<br>The Moveinn Team</p>
      </div>
    </div>`;
  }


  // Generate payment confirmation email HTML
  generatePaymentConfirmationHTML = (data) => {
    return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #14b8a6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="margin: 0;">Payment Confirmed</h1>
      <p style="margin: 8px 0;">Your storybook is being created</p>
    </div>

    <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
      <h2 style="color: #1e293b;">Hi ${data.userName},</h2>
      <p style="color: #475569;">We've received your payment for <strong>${data.bookTitle}</strong>.</p>

      <div style="background: white; border-left: 4px solid #14b8a6; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p><strong>Amount:</strong> ${data.amount}</p>
        <p><strong>Status:</strong> Processing...</p>
      </div>

      <ol style="color: #475569; padding-left: 20px;">
        <li>Story generation: 5–10 min</li>
        <li>Illustrations: 10–15 min</li>
        <li>PDF creation: 2–3 min</li>
      </ol>

      <p style="color: #475569;">You'll be notified when it's ready to download.</p>
    </div>
  </div>`;
  };

  // Generate payment failed email HTML
  generatePaymentFailedHTML = (data) => {
    return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      <h1 style="margin: 0;">Payment Failed</h1>
      <p style="margin: 8px 0;">Let's fix it and get your storybook made</p>
    </div>

    <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
      <h2 style="color: #1e293b;">Hi ${data.userName},</h2>
      <p style="color: #475569;">There was an issue processing your payment for <strong>${data.bookTitle}</strong>.</p>

      <div style="background: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Reason:</strong> ${data.reason || 'Unknown error'}</p>
      </div>

      <ul style="color: #475569;">
        <li>Check your card details and balance</li>
        <li>Try another payment method</li>
        <li>Contact your bank if needed</li>
      </ul>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL}/retry-payment" 
           style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
          Retry Payment
        </a>
      </div>
    </div>
  </div>`;
  };

}
export const emailService = new EmailService();