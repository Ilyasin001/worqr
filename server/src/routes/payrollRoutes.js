import express from "express"
import { createPayrollDraft, finalizePayroll, approvePayroll, getPayrollBatches, getMyPayrollHistory, getPayrollSummary } from "../controllers/payrollController.js";
import {protect, adminOnly} from "../middleware/authMiddleware.js"

const router = express.Router();

router.use(protect);

router.get("/", getMyPayrollHistory);

router.use(adminOnly); 

router.post("/draft", createPayrollDraft);

router.post("/:id/approve", approvePayroll);

router.post("/:id/finalize", finalizePayroll);

router.get("/", getPayrollBatches);

router.get("/my-history", getMyPayrollHistory);

router.get("/summary", getPayrollSummary);

export default router;