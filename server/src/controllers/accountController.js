import bcrypt from "bcrypt";
import User from "../models/user.js";
import { AppError } from "../utils/appError.js";
import { createToken, hashToken } from "../utils/secureToken.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/accountEmails.js";

const RESET_TTL_MS = 60 * 60 * 1000;          // 1 hour
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;    // 24 hours

// --- profile ---------------------------------------------------------------

export const getMe = async (req, res) => {
    // req.user is already loaded by `protect`, without the password or token hashes.
    res.status(200).json(req.user);
};

export const updateMe = async (req, res, next) => {
    try {
        const { name, address } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (address !== undefined) updates.address = address;

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
        });
        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id); // includes passwordHash
        const ok = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!ok) {
            throw new AppError("Current password is incorrect", 400);
        }
        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
        next(err);
    }
};

// --- password reset --------------------------------------------------------

export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        // Always respond the same way so this can't be used to discover which
        // emails are registered.
        if (user) {
            const { raw, hash } = createToken();
            user.resetTokenHash = hash;
            user.resetExpires = new Date(Date.now() + RESET_TTL_MS);
            await user.save();
            await sendPasswordResetEmail(user.email, raw);
        }
        res.status(200).json({ message: "If that email is registered, a reset link has been sent." });
    } catch (err) {
        next(err);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({
            resetTokenHash: hashToken(token),
            resetExpires: { $gt: new Date() },
        });
        if (!user) {
            throw new AppError("Invalid or expired reset token", 400);
        }
        user.passwordHash = await bcrypt.hash(password, 10);
        user.resetTokenHash = undefined;
        user.resetExpires = undefined;
        await user.save();
        res.status(200).json({ message: "Password has been reset. You can now sign in." });
    } catch (err) {
        next(err);
    }
};

// --- email verification ----------------------------------------------------

export const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;
        const user = await User.findOne({
            verificationTokenHash: hashToken(token),
            verificationExpires: { $gt: new Date() },
        });
        if (!user) {
            throw new AppError("Invalid or expired verification token", 400);
        }
        user.isVerified = true;
        user.verificationTokenHash = undefined;
        user.verificationExpires = undefined;
        await user.save();
        res.status(200).json({ message: "Email verified successfully" });
    } catch (err) {
        next(err);
    }
};

export const resendVerification = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (user.isVerified) {
            return res.status(400).json({ message: "Your email is already verified" });
        }
        const { raw, hash } = createToken();
        user.verificationTokenHash = hash;
        user.verificationExpires = new Date(Date.now() + VERIFY_TTL_MS);
        await user.save();
        await sendVerificationEmail(user.email, raw);
        res.status(200).json({ message: "Verification email sent" });
    } catch (err) {
        next(err);
    }
};

// Shared helper: stamps a fresh verification token onto a new user document
// (before it is saved) and returns the raw token to email after persistence.
export const buildVerificationToken = () => {
    const { raw, hash } = createToken();
    return { raw, hash, expires: new Date(Date.now() + VERIFY_TTL_MS) };
};
