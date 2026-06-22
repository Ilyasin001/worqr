import { body, validationResult } from 'express-validator';

export const createAssignmentValidator = [
  body('shiftId')
    .notEmpty().withMessage('Shift ID is required')
    .isMongoId().withMessage('Shift ID must be a valid ID'),

  body('staffId')
    .notEmpty().withMessage('Staff ID is required')
    .isMongoId().withMessage('Staff ID must be a valid ID'),

  body('hourlyRate')
    .notEmpty().withMessage('Hourly rate is required')
    .isFloat({ min: 0 }).withMessage('Hourly rate must be a non-negative number'),

  body('breakDuration')
    .optional()
    .isInt({ min: 0 }).withMessage('Break duration must be a non-negative integer (minutes)'),
];

export const updateAssignmentValidator = [
  body('shiftId')
    .optional()
    .isMongoId().withMessage('Shift ID must be a valid ID'),

  body('staffId')
    .optional()
    .isMongoId().withMessage('Staff ID must be a valid ID'),

  body('breakDuration')
    .optional()
    .isInt({ min: 0 }).withMessage('Break duration must be a non-negative integer (minutes)'),

  body('actualStartTime')
    .optional()
    .isISO8601().withMessage('Actual start time must be a valid ISO 8601 date')
    .toDate(),

  body('actualEndTime')
    .optional()
    .isISO8601().withMessage('Actual end time must be a valid ISO 8601 date')
    .toDate(),

  body('isPaid')
    .optional()
    .isBoolean().withMessage('isPaid must be a boolean'),
];

export const updateAssignmentStatusValidator = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['assigned', 'confirmed', 'declined', 'cancelled']).withMessage('Invalid status'),
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
