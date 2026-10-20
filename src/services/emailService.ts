import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface SendVerificationEmailOptions {
  to: string;
  code: string;
  expiresInMinutes?: number;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  accepted?: (string | object)[];
  previewUrl?: string | false;
  provider: 'gmail_smtp' | 'custom_smtp' | 'ethereal_test';
  error?: string;
}

let cachedTransporter: Transporter | null = null;
let transporterType: 'gmail_smtp' | 'custom_smtp' | 'ethereal_test' = 'ethereal_test';
let etherealAccount: any = null;

/**
 * Initializes and returns the active Nodemailer transporter.
 * Supports:
 * 1. Gmail SMTP (via SMTP_USER + SMTP_PASS app password)
 * 2. Custom SMTP (via SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 * 3. Ethereal Test Account (automatic fallback for testing/demo when real SMTP credentials are not yet set)
 */
export async function getEmailTransporter(): Promise<{
  transporter: Transporter;
  provider: 'gmail_smtp' | 'custom_smtp' | 'ethereal_test';
  fromAddress: string;
  isRealSmtp: boolean;
}> {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

  // Real SMTP configured (Gmail or custom host)
  if (smtpUser && smtpPass && smtpPass !== 'MY_SMTP_PASSWORD') {
    const isGmail = smtpHost?.includes('gmail.com') || smtpUser.includes('@gmail.com');
    const host = smtpHost || (isGmail ? 'smtp.gmail.com' : undefined);

    if (host) {
      if (!cachedTransporter || transporterType === 'ethereal_test') {
        cachedTransporter = nodemailer.createTransport({
          host,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'test' ? false : true,
          },
        });
        transporterType = isGmail ? 'gmail_smtp' : 'custom_smtp';
      }

      const from =
        process.env.SMTP_FROM?.trim() ||
        `"Nagrik One Civic Portal" <${smtpUser}>`;

      return {
        transporter: cachedTransporter,
        provider: transporterType,
        fromAddress: from,
        isRealSmtp: true,
      };
    }
  }

  // Fallback: Real Ethereal test SMTP account for verification testing
  if (!cachedTransporter || !etherealAccount) {
    etherealAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass,
      },
    });
    transporterType = 'ethereal_test';
  }

  return {
    transporter: cachedTransporter,
    provider: 'ethereal_test',
    fromAddress: `"Nagrik One Civic Portal" <${etherealAccount.user}>`,
    isRealSmtp: false,
  };
}

/**
 * Sends a real 6-digit verification code email.
 */
export async function sendVerificationEmail({
  to,
  code,
  expiresInMinutes = 10,
}: SendVerificationEmailOptions): Promise<SendEmailResult> {
  try {
    const cleanTo = to.trim().toLowerCase();
    const { transporter, provider, fromAddress, isRealSmtp } = await getEmailTransporter();

    const mailOptions = {
      from: fromAddress,
      to: cleanTo,
      subject: `Your Nagrik One Verification Code: ${code}`,
      text: `Welcome to Nagrik One Civic Portal.\n\nYour 6-digit verification code is: ${code}\n\nThis code will expire in ${expiresInMinutes} minutes.\n\nIf you did not request this verification code, please ignore this email. Never share this code with anyone.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nagrik One Verification Code</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #0f766e 0%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Nagrik One</h1>
                <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; letter-spacing: 0.5px; text-transform: uppercase;">Citizen Grievance & Accountability Portal</p>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding: 32px 28px;">
                <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a; font-weight: 700;">Verify Your Citizen Account</h2>
                <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                  We received a request to verify your email address (<strong>${cleanTo}</strong>) for reporting civic grievances on Nagrik One.
                </p>
                <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Your One-Time Verification Code:</p>
                
                <!-- Code Box -->
                <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px 24px; text-align: center; margin: 0 0 24px 0;">
                  <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f766e;">${code}</span>
                </div>

                <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 13px; color: #065f46; line-height: 1.5;">
                    ⏱ <strong>Valid for ${expiresInMinutes} minutes.</strong> This single-use code will expire automatically.
                  </p>
                </div>

                <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.5; color: #94a3b8;">
                  If you did not initiate this request, you can safely disregard this email. Your account remains secure.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
                Nagrik One &bull; Civic Redressal & Citizen Governance Engine<br/>
                Automated notification &bull; Please do not reply directly to this message.
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = !isRealSmtp ? nodemailer.getTestMessageUrl(info) : false;

    // Check if recipient was accepted by provider
    const acceptedList = Array.isArray(info.accepted) ? info.accepted : [];
    const isAccepted = acceptedList.length > 0;

    if (!isAccepted) {
      return {
        success: false,
        provider,
        error: 'The email provider rejected the destination address.',
      };
    }

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      previewUrl: previewUrl || undefined,
      provider,
    };
  } catch (error: any) {
    return {
      success: false,
      provider: transporterType,
      error: error.message || 'Failed to dispatch email through SMTP provider.',
    };
  }
}

/**
 * Returns current SMTP configuration status for diagnostic checks.
 */
export async function getSmtpConfigStatus() {
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpHost = process.env.SMTP_HOST?.trim() || (smtpUser?.includes('@gmail.com') ? 'smtp.gmail.com' : 'Not configured');
  const isConfigured = !!smtpUser && !!smtpPass && smtpPass !== 'MY_SMTP_PASSWORD';

  return {
    configured: isConfigured,
    provider: isConfigured ? (smtpHost.includes('gmail.com') ? 'gmail_smtp' : 'custom_smtp') : 'ethereal_test',
    host: smtpHost,
    port: process.env.SMTP_PORT || '587',
    senderEmail: smtpUser || 'ethereal-demo@nagrikone.gov.in',
    message: isConfigured
      ? 'Live SMTP email delivery active.'
      : 'Using Ethereal SMTP test mailbox. To deliver directly to user inboxes, set SMTP_USER and SMTP_PASS in environment.',
  };
}
