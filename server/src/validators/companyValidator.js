import { body } from "express-validator";
export { validate } from "./authValidator.js";

export const registerCompanyValidator = [
  body("companyName")
    .trim()
    .notEmpty().withMessage("Company name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Company name must be 2-100 characters"),

  body("name")
    .trim()
    .notEmpty().withMessage("Your name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Must be a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("Password must contain uppercase, lowercase, and number"),
];
