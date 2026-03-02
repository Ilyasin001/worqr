import Assignment from "../models/assignment.js";

export const calculatePayroll = async (userId, periodStart, periodEnd) => {
  try {
    const assignments = await Assignment.find({
      staff: userId,
      isPaid: false
    }).populate({
      path: "shift",
      match: {
        startTime: { $gte: periodStart, $lte: periodEnd }
      }
    });

    const validAssignments = assignments.filter(a => a.shift);

    let totalHours = 0;
    let totalPay = 0;

    validAssignments.forEach(assign => {
      const shiftStart = assign.actualStartTime || assign.shift.startTime;

      const shiftEnd = assign.actualEndTime || assign.shift.endTime;

      let hours = (shiftEnd - shiftStart) / (1000 * 60 * 60);

      hours -= assign.breakMinutes / 60;

      if (hours < 0) hours = 0;

      totalHours += hours;
      totalPay += hours * assign.hourlyRate;
    });

    await Assignment.updateMany(
      { _id: { $in: validAssignments.map(a => a._id) } },
      {
        $set: {
          isPaid: true,
          paidAt: new Date()
        }
      }
    );

    return { totalHours, totalPay };

  } catch (error) {
    console.error("Error calculating payroll:", error);
    throw error;
  }
};