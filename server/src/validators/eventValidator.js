import { body, validationResult } from 'express-validator';

export const createEventValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title must be 100 characters or fewer'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be 1000 characters or fewer'),

  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Date must be a valid ISO 8601 date')
    .toDate(),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Address must be 200 characters or fewer'),

  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled']).withMessage('Status must be pending, confirmed, or cancelled'),
];

export const updateEventValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 100 }).withMessage('Title must be 100 characters or fewer'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description must be 1000 characters or fewer'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO 8601 date')
    .toDate(),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Address must be 200 characters or fewer'),

  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled']).withMessage('Status must be pending, confirmed, or cancelled'),
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
