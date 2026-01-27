import session from "../models/session.js";

export const createSession = async (req, res) => {
    try {
        const { userId, eventId, role, status } = req.body;
        const newSession = new session({ userId, eventId, role, status });
        const savedSession = await newSession.save();
        res.status(201).json(savedSession);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getSessions = async (req, res) => {
    try {
        const sessions = await session.find();
        res.status(200).json(sessions);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getSessionById = async (req, res) => {
    try {
        const foundSession = await session.findById(req.params.id);
        if (!foundSession) {
            return res.status(404).json({ message: "Session not found" });
        }
        res.status(200).json(foundSession);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateSession = async (req, res) => {
    try {
        const updatedSession = await session.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedSession) {
            return res.status(404).json({ message: "Session not found" });
        }
        res.status(200).json(updatedSession);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteSession = async (req, res) => {
    try {
        const deletedSession = await session.findByIdAndDelete(req.params.id);
        if (!deletedSession) {
            return res.status(404).json({ message: "Session not found" });
        }
        res.status(200).json({ message: "Session deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
