// Create a validation middleware file: validation-middleware.js
const { body, validationResult } = require('express-validator');

const validateAssessment = [
  // Business type validation
  body('businessType')
    .isIn(['butchery', 'grocery', 'supermarket'])
    .withMessage('Business type must be butchery, grocery, or supermarket'),
  
  // City validation
  body('city')
    .trim()
    .escape()  // Removes HTML characters
    .isLength({ min: 1, max: 100 })
    .withMessage('City must be between 1-100 characters')
    .matches(/^[a-zA-Z\s]+$/)  // Only letters and spaces
    .withMessage('City can only contain letters and spaces'),
  
  // Monthly spend validation
  body('monthlySpend')
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Monthly spend must be between 0 and 1,000,000'),
  
  // Equipment validation
  body('equipment')
    .isArray()
    .withMessage('Equipment must be an array'),
  
  body('equipment.*.type')
    .isIn(['refrigerator', 'freezer', 'lighting', 'pos', 'hvac'])
    .withMessage('Invalid equipment type'),
  
  body('equipment.*.quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Equipment quantity must be 1-100'),
  
  body('equipment.*.hours')
    .isInt({ min: 0, max: 24 })
    .withMessage('Operating hours must be 0-24'),
];

// Apply to your route
app.post('/api/v1/assessments', validateAssessment, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process valid data...
});