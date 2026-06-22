import bcrypt from "bcrypt";
import User from "../models/user.js";
import Company from "../models/company.js";
import { signToken } from "../utils/token.js";

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
        const { passwordHash: _pw, ...safeUser } = user.toObject();
        res.status(200).json({ token, user: safeUser });
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
        // role is forced to "staff" — self-registration can never create an admin.
        const newUser = new User({ name, email, passwordHash, role: "staff", company: company._id });
        await newUser.save();

        const token = signToken(newUser);
        const { passwordHash: _pw, ...safeUser } = newUser.toObject();
        res.status(201).json({ token, user: safeUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
