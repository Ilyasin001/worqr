import express from "express"
import { createPayrollDraft, finalizePayroll, approvePayroll, getPayrollBatches, getMyPayrollHistory, getPayrollSummary } from "../controllers/payrollController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { createPayrollDraftValidator, validate } from "../validators/payrollValidator.js";

const router = express.Router();

router.use(protect);

router.get("/my-history", getMyPayrollHistory);

router.use(adminOnly);

router.post("/draft", createPayrollDraftValidator, validate, createPayrollDraft);

router.post("/:id/approve", approvePayroll);

router.post("/:id/finalize", finalizePayroll);

router.get("/batches", getPayrollBatches);

router.get("/summary", getPayrollSummary);

export default router;