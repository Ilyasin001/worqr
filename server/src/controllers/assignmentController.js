import assignment from "../models/assignment.js";

export const createAssignment = async (req, res) => {
    try {
        const { shiftId, staffId, hourlyRate, breakDuration } = req.body;
        const newAssignment = new assignment({ shiftId, staffId, hourlyRate, breakDuration });
        const savedAssignment = await newAssignment.save();
        res.status(201).json(savedAssignment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getAssignments = async (req, res) => {
    try {
        const assignments = await assignment.find();
        res.status(200).json(assignments);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAssignmentById = async (req, res) => {
    try {
        const foundAssignment = await assignment.findById(req.params.id);
        if (!foundAssignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }
        res.status(200).json(foundAssignment);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateAssignment = async (req, res) => {
    try {
        const { shiftId, staffId, hourlyRate, breakDuration, actualStartTime, actualEndTime, isPaid } = req.body;
        const updates = {};
        if (shiftId !== undefined) updates.shiftId = shiftId;
        if (staffId !== undefined) updates.staffId = staffId;
        if (hourlyRate !== undefined) updates.hourlyRate = hourlyRate;
        if (breakDuration !== undefined) updates.breakDuration = breakDuration;
        if (actualStartTime !== undefined) updates.actualStartTime = actualStartTime;
        if (actualEndTime !== undefined) updates.actualEndTime = actualEndTime;
        if (isPaid !== undefined) updates.isPaid = isPaid;

        const updatedAssignment = await assignment.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!updatedAssignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }
        res.status(200).json(updatedAssignment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteAssignment = async (req, res) => {
    try {
        const deletedAssignment = await assignment.findByIdAndDelete(req.params.id);
        if (!deletedAssignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }
        res.status(200).json({ message: "Assignment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
