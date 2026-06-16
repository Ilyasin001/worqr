import { body, validationResult } from 'express-validator';

export const createShiftValidator = [
  body('managerId')
    .notEmpty().withMessage('Manager ID is required')
    .isMongoId().withMessage('Manager ID must be a valid ID'),

  body('eventId')
    .notEmpty().withMessage('Event ID is required')
    .isMongoId().withMessage('Event ID must be a valid ID'),

  body('startTime')
    .notEmpty().withMessage('Start time is required')
    .isISO8601().withMessage('Start time must be a valid ISO 8601 date')
    .toDate(),

  body('endTime')
    .notEmpty().withMessage('End time is required')
    .isISO8601().withMessage('End time must be a valid ISO 8601 date')
    .toDate(),

  body('confirmed')
    .optional()
    .isBoolean().withMessage('Confirmed must be a boolean'),
];

export const updateShiftValidator = [
  body('managerId')
    .optional()
    .isMongoId().withMessage('Manager ID must be a valid ID'),

  body('eventId')
    .optional()
    .isMongoId().withMessage('Event ID must be a valid ID'),

  body('startTime')
    .optional()
    .isISO8601().withMessage('Start time must be a valid ISO 8601 date')
    .toDate(),

  body('endTime')
    .optional()
    .isISO8601().withMessage('End time must be a valid ISO 8601 date')
    .toDate(),

  body('confirmed')
    .optional()
    .isBoolean().withMessage('Confirmed must be a boolean'),
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
