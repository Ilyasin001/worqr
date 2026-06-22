import crypto from "crypto";

// Generates a high-entropy token. The raw value is sent to the user (e.g. in a
// reset/verification link); only its SHA-256 hash is stored, so a leaked DB
// row cannot be used to reset accounts.
export const createToken = () => {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = hashToken(raw);
  return { raw, hash };
};

export const hashToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");
