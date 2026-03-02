import assignment from "../models/assignment.js";

export const calculatePayroll = async (userId, start, end) => {
  try { 
    const assignments = await Assignment.find({
      staff: userId
    }).populate("shift");

    const payroll = {};
    let totalHours = 0;
    let totalPay = 0;

    assignments.forEach(assign => {
      const start = assign.actualStartTime || assign.shift.startTime;
      const end = assign.actualEndTime || assign.shift.endTime;

      let hours = (end - start) / (1000 * 60 * 60);

      hours -= assign.breakMinutes / 60;

      totalHours += hours;
      totalPay += hours * assign.hourlyRate;
    });

    return { totalHours, totalPay };

  } catch (error) {
    console.error("Error calculating payroll:", error);
  }
};
