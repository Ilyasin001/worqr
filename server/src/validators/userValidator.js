import { body, validationResult } from 'express-validator';

export const createUserValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name must be 50 characters or fewer'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Address must be 200 characters or fewer'),

  body('role')
    .optional()
    .isIn(['staff', 'admin']).withMessage('Role must be staff or admin'),

  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 }).withMessage('Hourly rate must be a non-negative number'),
];

export const updateUserValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .isLength({ max: 50 }).withMessage('Name must be 50 characters or fewer'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Address must be 200 characters or fewer'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email')
    .normalizeEmail(),

  body('role')
    .optional()
    .isIn(['staff', 'admin']).withMessage('Role must be staff or admin'),

  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 }).withMessage('Hourly rate must be a non-negative number'),
];

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};
