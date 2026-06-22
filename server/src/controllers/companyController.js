import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Company from "../models/company.js";
import User from "../models/user.js";
import { AppError } from "../utils/appError.js";
import { generateUniqueCompanyCode } from "../utils/companyCode.js";
import { signToken } from "../utils/token.js";

// Public: creates a new company together with its first admin (owner) user.
// Both documents reference each other, so they are created atomically in a
// transaction using pre-generated ids.
export const registerCompany = async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        const { companyName, name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError("A user with that email already exists", 409);
        }

        const code = await generateUniqueCompanyCode(Company);
        const passwordHash = await bcrypt.hash(password, 10);

        const companyId = new mongoose.Types.ObjectId();
        const userId = new mongoose.Types.ObjectId();

        let company;
        let user;

        await session.withTransaction(async () => {
            [company] = await Company.create([{
                _id: companyId,
                name: companyName,
                code,
                owner: userId,
            }], { session });

            [user] = await User.create([{
                _id: userId,
                name,
                email,
                passwordHash,
                role: "admin",
                company: companyId,
            }], { session });
        });

        const token = signToken(user);
        const { passwordHash: _pw, ...safeUser } = user.toObject();
        res.status(201).json({ token, user: safeUser, company });
    } catch (err) {
        next(err);
    } finally {
        session.endSession();
    }
};

// Returns the caller's own company. The join code is only exposed to admins.
export const getMyCompany = async (req, res, next) => {
    try {
        const company = await Company.findById(req.companyId);
        if (!company) {
            throw new AppError("Company not found", 404);
        }

        const data = company.toObject();
        if (req.user.role !== "admin") {
            delete data.code;
        }
        res.status(200).json(data);
    } catch (err) {
        next(err);
    }
};

// Admin-only: regenerates the company join code (invalidates the old one).
export const rotateCompanyCode = async (req, res, next) => {
    try {
        const company = await Company.findById(req.companyId);
        if (!company) {
            throw new AppError("Company not found", 404);
        }

        company.code = await generateUniqueCompanyCode(Company);
        await company.save();
        res.status(200).json({ code: company.code });
    } catch (err) {
        next(err);
    }
};
