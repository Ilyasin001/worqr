import mongoose from "mongoose";
import Assignment from "../models/assignment.js";
import Shift from "../models/shift.js";

// An assignment "fills" a slot unless it was declined or cancelled.
const ACTIVE_STATUSES = ["assigned", "confirmed"];

// Returns a Map of eventId(string) -> number of active assignments tied to that
// event's shifts, for the whole company. One aggregation regardless of event count.
export const fillCountsByEvent = async (companyId) => {
  const rows = await Assignment.aggregate([
    { $match: { company: new mongoose.Types.ObjectId(companyId), status: { $in: ACTIVE_STATUSES } } },
    { $lookup: { from: "shifts", localField: "shiftId", foreignField: "_id", as: "shift" } },
    { $unwind: "$shift" },
    { $group: { _id: "$shift.eventId", count: { $sum: 1 } } },
  ]);

  const map = new Map();
  for (const row of rows) {
    map.set(String(row._id), row.count);
  }
  return map;
};

// Active assignment count for a single event (across its shifts).
export const fillCountForEvent = async (companyId, eventId) => {
  const shiftIds = await Shift.find({ company: companyId, eventId }).distinct("_id");
  if (shiftIds.length === 0) return 0;
  return Assignment.countDocuments({
    company: companyId,
    shiftId: { $in: shiftIds },
    status: { $in: ACTIVE_STATUSES },
  });
};
