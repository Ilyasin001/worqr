import User from "../models/user.js";
import bcrypt from "bcrypt";
import { AppError } from "../utils/appError.js";

export const createUser = async (req, res, next) => {
    try {
        const { name, address, email, password, role, hourlyRate } = req.body;
        // role is accepted here only because this route is restrictTo('admin') —
        // the public /api/auth/register endpoint never accepts a role.
        // New users are always created inside the admin's own company.
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = new User({ name, address, email, passwordHash, role, hourlyRate, company: req.companyId });
        const savedUser = await newUser.save();
        const { passwordHash: _pw, ...safeUser } = savedUser.toObject();
        res.status(201).json(safeUser);
    } catch (error) {
        next(error);
    }
};

export const getUsers = async (req, res, next) => {
    try {
        const users = await User.find({ company: req.companyId }).select('-passwordHash');
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

export const getUserById = async (req, res, next) => {
    try {
        const isSelf = req.user._id.toString() === req.params.id;
        // Staff may only read their own profile; admins may read anyone in their company.
        if (!isSelf && req.user.role !== 'admin') {
            throw new AppError("You do not have permission to view this user", 403);
        }

        const user = await User.findOne({ _id: req.params.id, company: req.companyId }).select('-passwordHash');
        if (!user) {
            throw new AppError("User not found", 404);
        }
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const { name, address, email, password, role, hourlyRate } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (address !== undefined) updates.address = address;
        if (email !== undefined) updates.email = email;
        if (role !== undefined) {
            if (req.user._id.toString() === req.params.id) {
                throw new AppError("Cannot change your own role", 403);
            }
            updates.role = role;
        }
        if (hourlyRate !== undefined) updates.hourlyRate = hourlyRate;
        if (password !== undefined) updates.passwordHash = await bcrypt.hash(password, 10);

        const updatedUser = await User.findOneAndUpdate(
            { _id: req.params.id, company: req.companyId },
            updates,
            { new: true, runValidators: true }
        ).select('-passwordHash');
        if (!updatedUser) {
            throw new AppError("User not found", 404);
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        if (req.user._id.toString() === req.params.id) {
            throw new AppError("You cannot delete your own account", 400);
        }
        const deletedUser = await User.findOneAndDelete({ _id: req.params.id, company: req.companyId });
        if (!deletedUser) {
            throw new AppError("User not found", 404);
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        next(error);
    }
};
