import RefreshToken from "../models/refreshToken.js";
import { createToken, hashToken } from "../utils/secureToken.js";

const TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30);

// Creates and persists a new refresh token for a user; returns the raw value
// to hand to the client (only its hash is stored).
export const issueRefreshToken = async (user) => {
    const { raw, hash } = createToken();
    await RefreshToken.create({
        user: user._id,
        company: user.company,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000),
    });
    return raw;
};

// Consumes a refresh token: validates it, deletes it (rotation), and returns
// the stored record (with user/company) — or null if invalid/expired.
export const rotateRefreshToken = async (rawToken) => {
    const record = await RefreshToken.findOneAndDelete({
        tokenHash: hashToken(rawToken),
        expiresAt: { $gt: new Date() },
    });
    return record;
};

// Revokes a refresh token (logout). No-op if it doesn't exist.
export const revokeRefreshToken = async (rawToken) => {
    await RefreshToken.deleteOne({ tokenHash: hashToken(rawToken) });
};
