import express from "express";
import { loginValidator, registerValidator, validate } from "../validators/authValidator.js"
import { login, register } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);

export default router;
