import User from "../models/user.js";
import bcrypt from "bcrypt";

export const createUser = async (req, res) => {
    try {
        const { name, address, email, password, hourlyRate } = req.body;
        // role is intentionally excluded — always defaults to 'staff'
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = new User({ name, address, email, passwordHash, hourlyRate });
        const savedUser = await newUser.save();
        const { passwordHash: _pw, ...safeUser } = savedUser.toObject();
        res.status(201).json(safeUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getUsers = async (req, res) => {
     try {
            const users = await User.find().select('-passwordHash');
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
};

export const getUserById = async (req, res) => {
    try {
            const user = await User.findById(req.params.id).select('-passwordHash');
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
};

export const updateUser = async (req, res) => {
     try {
        const { name, address, email, password, role, hourlyRate } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (address !== undefined) updates.address = address;
        if (email !== undefined) updates.email = email;
        if (role !== undefined) {
            if (req.user._id.toString() === req.params.id) {
                return res.status(403).json({ message: "Cannot change your own role" });
            }
            updates.role = role;
        }
        if (hourlyRate !== undefined) updates.hourlyRate = hourlyRate;
        if (password !== undefined) updates.passwordHash = await bcrypt.hash(password, 10);

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).select('-passwordHash');
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
            const deletedUser = await User.findByIdAndDelete(req.params.id);
            if (!deletedUser) {
                return res.status(404).json({ message: "User not found" });
            }
            res.status(200).json({ message: "User deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
};