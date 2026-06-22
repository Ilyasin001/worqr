import { body } from "express-validator";
export { validate } from "./authValidator.js";

const strongPassword = (field) =>
  body(field)
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("Password must contain uppercase, lowercase, and number");

export const updateMeValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty().withMessage("Name cannot be empty")
    .isLength({ max: 50 }).withMessage("Name must be 50 characters or fewer"),
  body("address")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Address must be 200 characters or fewer"),
];

export const changePasswordValidator = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  strongPassword("newPassword"),
];

export const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Must be a valid email")
    .normalizeEmail(),
];

export const resetPasswordValidator = [
  body("token").notEmpty().withMessage("Token is required"),
  strongPassword("password"),
];

export const verifyEmailValidator = [
  body("token").notEmpty().withMessage("Token is required"),
];
