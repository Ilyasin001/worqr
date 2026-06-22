import { sendMail } from "../utils/mailer.js";

// Where the frontend lives, so emailed links resolve to real pages.
const appUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

export const sendVerificationEmail = async (to, rawToken) => {
  const link = `${appUrl()}/verify-email?token=${rawToken}`;
  await sendMail({
    to,
    subject: "Verify your Worqr email",
    text: `Welcome to Worqr! Confirm your email address by opening this link:\n${link}\n\nIf you didn't create an account, you can ignore this message.`,
  });
};

export const sendPasswordResetEmail = async (to, rawToken) => {
  const link = `${appUrl()}/reset-password?token=${rawToken}`;
  await sendMail({
    to,
    subject: "Reset your Worqr password",
    text: `We received a request to reset your password. Open this link to choose a new one:\n${link}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore it.`,
  });
};
