import nodemailer from "nodemailer";

// Sends transactional email (verification, password reset).
//
// Provider-agnostic via SMTP: set SMTP_HOST/PORT/USER/PASS in the environment
// and it sends through any provider (Gmail, SendGrid, Mailgun, Postmark, SES,
// Resend, …). With no SMTP configured it logs to the console (dev) so the app
// still works end to end; under test it stays silent. Delivery is best-effort —
// a send failure is logged but never breaks the calling flow (the user can
// always request another verification / reset email).

const smtpConfigured = () => Boolean(process.env.SMTP_HOST);

let transport = null;
const getTransport = () => {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true", // true for port 465, false for 587 (STARTTLS)
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transport;
};

const from = () => process.env.MAIL_FROM || "Worqr <no-reply@worqr.app>";

export const sendMail = async ({ to, subject, text }) => {
  if (process.env.NODE_ENV === "test") {
    return { delivered: false, transport: "test" };
  }

  if (!smtpConfigured()) {
    console.log(`\n[mailer] (no SMTP configured — set SMTP_HOST to send for real)\n[mailer] To: ${to}\n[mailer] Subject: ${subject}\n[mailer] ${text}\n`);
    return { delivered: false, transport: "console" };
  }

  try {
    const info = await getTransport().sendMail({ from: from(), to, subject, text });
    return { delivered: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[mailer] Failed to send to ${to}: ${err.message}`);
    return { delivered: false, error: err.message };
  }
};
