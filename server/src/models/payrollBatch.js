import mongoose from "mongoose";

const payrollBatchSchema = new mongoose.Schema({
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },

  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  totalHours: Number,
  totalPay: Number,

  assignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment"
  }],

  status: {
    type: String,
    enum: ["draft", "approved", "paid"],
    default: "draft"
  },

  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  processedAt: Date

}, { timestamps: true });

export default mongoose.model("PayrollBatch", payrollBatchSchema);