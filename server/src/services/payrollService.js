import Assignment from "../models/assignment.js";

export const calculatePayrollPreview = async (userId, periodStart, periodEnd) => {

  const assignments = await Assignment.find({
    staffId: userId,
    isPaid: false,
    actualStartTime: { $ne: null },
    actualEndTime: { $ne: null }
  }).populate({
  path: "shiftId",
  match: {
    startTime: { $gte: periodStart, $lte: periodEnd }
  }
  });

  let totalHours = 0;
  let totalPay = 0;

  const validAssignments = assignments.filter(a => a.shiftId);

  validAssignments.forEach(assign => {
    const start = assign.actualStartTime;
    const end = assign.actualEndTime;

    let hours = (end - start) / (1000 * 60 * 60);
    hours -= assign.breakDuration / 60;

    if (hours < 0) hours = 0;

    totalHours += hours;
    totalPay += hours * assign.hourlyRate;
  });

  return {
    totalHours,
    totalPay,
    assignments: validAssignments
  }
};

