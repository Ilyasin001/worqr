import Assignment from "../models/assignment.js";
import { AppError } from "../utils/appError.js";

// Two time ranges overlap when each starts before the other ends.
export const overlaps = (a, b) =>
  a.startTime < b.endTime && b.startTime < a.endTime;

// Throws 409 if the staff member already has an active assignment on a shift
// whose time overlaps `targetShift` (double-booking). `ignoreAssignmentId`
// skips the assignment currently being updated.
export const assertNoStaffConflict = async (companyId, staffId, targetShift, ignoreAssignmentId = null) => {
  const active = await Assignment.find({
    company: companyId,
    staffId,
    status: { $in: ["assigned", "confirmed"] },
    ...(ignoreAssignmentId ? { _id: { $ne: ignoreAssignmentId } } : {}),
  }).populate("shiftId");

  const clash = active.some((a) => a.shiftId && overlaps(a.shiftId, targetShift));
  if (clash) {
    throw new AppError("Staff member already has an overlapping shift in this period", 409);
  }
};
