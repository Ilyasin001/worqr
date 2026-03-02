import Shift from "../models/shift.js";

export const calculatePayroll = async (userId, start, end) => {
  try { 
    const shifts = await Shift.find({
      date: {
        $gte: new Date(start),
        $lte: new Date(end)
      },
      staff: userId
    });
    const payroll = {};
    let totalHours = 0;
    let totalPay = 0;
    shifts.forEach(s => {
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);

        let hours = (end - start) / (1000 * 60 * 60);

        if (s.role !== "manager"){
            hours -= 1;
        }

        totalHours += hours;
        totalPay += hours * s.hourlyRate;

    });
    return { totalHours, totalPay };

  } catch (error) {
    console.error("Error calculating payroll:", error);
  }
};
