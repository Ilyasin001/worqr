import assignment from "../models/assignment.js";

export const createAssignment = async (req, res) => {
    try {
        const { shiftId, staffId, role, breakDuration } = req.body;
        const newAssignment = new assignment({ shiftId, staffId, role, breakDuration});
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
        const updatedAssignment = await assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
