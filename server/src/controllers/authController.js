import bcrypt from "bcrypt";
import User from "../models/user.js";
import Company from "../models/company.js";
import { signToken } from "../utils/token.js";
import { buildVerificationToken } from "./accountController.js";
import { sendVerificationEmail } from "../services/accountEmails.js";
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from "../services/refreshTokens.js";

// User Login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = signToken(user);
        const refreshToken = await issueRefreshToken(user);
        const { passwordHash: _pw, ...safeUser } = user.toObject();
        res.status(200).json({ token, refreshToken, user: safeUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Staff Registration — joins an existing company via its join code.
export const register = async (req, res) => {
    try {
        const { name, email, password, companyCode } = req.body;

        const company = await Company.findOne({ code: companyCode });
        if (!company) {
            return res.status(400).json({ message: "Invalid company code" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const verification = buildVerificationToken();
        // role is forced to "staff" — self-registration can never create an admin.
        const newUser = new User({
            name, email, passwordHash, role: "staff", company: company._id,
            verificationTokenHash: verification.hash,
            verificationExpires: verification.expires,
        });
        await newUser.save();
        await sendVerificationEmail(newUser.email, verification.raw);

        const token = signToken(newUser);
        const refreshToken = await issueRefreshToken(newUser);
        const { passwordHash: _pw, verificationTokenHash, verificationExpires, ...safeUser } = newUser.toObject();
        res.status(201).json({ token, refreshToken, user: safeUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Exchange a valid refresh token for a new access token (rotating the refresh
// token so a stolen one can be used at most once).
export const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token is required" });
        }
        const record = await rotateRefreshToken(refreshToken);
        if (!record) {
            return res.status(401).json({ message: "Invalid or expired refresh token" });
        }
        const user = await User.findById(record.user);
        if (!user) {
            return res.status(401).json({ message: "User no longer exists" });
        }
        const token = signToken(user);
        const newRefreshToken = await issueRefreshToken(user);
        res.status(200).json({ token, refreshToken: newRefreshToken });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Revoke a refresh token (logout). Idempotent.
export const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await revokeRefreshToken(refreshToken);
        }
        res.status(200).json({ message: "Logged out" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
