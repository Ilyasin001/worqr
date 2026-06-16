import { body, validationResult } from 'express-validator';

// approve and finalize only take :id — no body to validate
export const createPayrollDraftValidator = [
  body('staffId')
    .notEmpty().withMessage('Staff ID is required')
    .isMongoId().withMessage('Staff ID must be a valid ID'),

  body('periodStart')
    .notEmpty().withMessage('Period start is required')
    .isISO8601().withMessage('Period start must be a valid ISO 8601 date')
    .toDate(),

  body('periodEnd')
    .notEmpty().withMessage('Period end is required')
    .isISO8601().withMessage('Period end must be a valid ISO 8601 date')
    .toDate(),
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
