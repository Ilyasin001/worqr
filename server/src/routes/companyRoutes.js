import express from "express";
import { registerCompany, getMyCompany, rotateCompanyCode } from "../controllers/companyController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { registerCompanyValidator, validate } from "../validators/companyValidator.js";

const router = express.Router();

router.post("/register", registerCompanyValidator, validate, registerCompany);

router.use(protect);

router.get("/me", getMyCompany);
router.post("/rotate-code", adminOnly, rotateCompanyCode);

export default router;
