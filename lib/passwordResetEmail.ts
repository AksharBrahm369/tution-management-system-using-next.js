import nodemailer from "nodemailer";

type SendPasswordResetEmailInput = {
  to: string;
  name: string;
  resetUrl: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const from =
    process.env.SMTP_FROM?.trim() ||
    process.env.INSTITUTE_EMAIL?.trim() ||
    user;

  if (!host || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
    from,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function isPasswordResetEmailConfigured() {
  return getSmtpConfig() !== null;
}

export async function verifyPasswordResetEmailTransport() {
  const config = getSmtpConfig();

  if (!config) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM."
    );
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  await transporter.verify();
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendPasswordResetEmailInput) {
  const config = getSmtpConfig();

  if (!config) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM."
    );
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "TuitionPro";
  const safeName = name?.trim() || "there";
  const escapedAppName = escapeHtml(appName);
  const escapedName = escapeHtml(safeName);
  const escapedResetUrl = escapeHtml(resetUrl);

  await transporter.sendMail({
    from: config.from,
    to,
    subject: `Reset your ${appName} password`,
    text: [
      `Hi ${safeName},`,
      "",
      `We received a request to reset your ${appName} password.`,
      "Use this link to set a new password:",
      resetUrl,
      "",
      "This link expires in 1 hour. If you did not request this, you can ignore this email.",
      "",
      `- ${appName}`,
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5">
        <h2 style="margin:0 0 16px">${escapedAppName} password reset</h2>
        <p>Hi ${escapedName},</p>
        <p>We received a request to reset your ${escapedAppName} password.</p>
        <p>
          <a href="${escapedResetUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">
            Reset password
          </a>
        </p>
        <p style="font-size:13px;color:#475569">This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
        <p style="font-size:13px;color:#475569">If the button does not work, copy and paste this URL into your browser:<br>${escapedResetUrl}</p>
      </div>
    `,
  });
}
