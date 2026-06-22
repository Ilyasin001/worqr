import express from "express";
import { loginValidator, registerValidator, validate } from "../validators/authValidator.js";
import {
  updateMeValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
} from "../validators/accountValidator.js";
import { login, register, refresh, logout } from "../controllers/authController.js";
import {
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from "../controllers/accountController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPasswordValidator, validate, forgotPassword);
router.post("/reset-password", resetPasswordValidator, validate, resetPassword);
router.post("/verify-email", verifyEmailValidator, validate, verifyEmail);

// Authenticated account management
router.use(protect);
router.get("/me", getMe);
router.patch("/me", updateMeValidator, validate, updateMe);
router.post("/change-password", changePasswordValidator, validate, changePassword);
router.post("/resend-verification", resendVerification);

export default router;
