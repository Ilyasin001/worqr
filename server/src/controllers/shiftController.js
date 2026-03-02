import shift from "../models/shift.js";

export const createShift = async (req, res) => {
    try {
        const {managerId, startTime, endTime, eventId, confirmed} = req.body;
        const newShift = new shift({managerId, startTime, endTime, eventId, confirmed});
        const savedShift = await newShift.save();
        res.status(201).json(savedShift);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
export const getShifts = async (req, res) => {
    try {
        const shifts = await shift.find();
        res.status(200).json(shifts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getShiftById = async (req, res) => {
    try {
        const foundShift = await shift.findById(req.params.id);
        if (!foundShift) {
            return res.status(404).json({ message: "Shift not found" });
        }
        res.status(200).json(foundShift);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const updateShift = async (req, res) => {
    try {
        const updatedShift = await shift.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedShift) {
            return res.status(404).json({ message: "Shift not found" });
        }
        res.status(200).json(updatedShift);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
export const deleteShift = async (req, res) => {
    try {
        const deletedShift = await shift.findByIdAndDelete(req.params.id);
        if (!deletedShift) {
            return res.status(404).json({ message: "Shift not found" });
        }
        res.status(200).json({ message: "Shift deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
