import express from "express"
import { createPayrollDraft, finalizePayroll, approvePayroll } from "../controllers/payrollController.js";
import {protect, adminOnly} from "../middleware/authMiddleware.js"

const router = express.Router();

router.use(protect);
router.use(adminOnly); 

router.post("/draft", createPayrollDraft);

router.post("/:id/approve", approvePayroll);

router.post("/:id/finalize", finalizePayroll);

export default router;