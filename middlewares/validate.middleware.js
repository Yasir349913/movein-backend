
// Use it if you want to validate incoming requests against a schema using Joi. 
// This middleware can be applied to routes to ensure that the request data conforms to the expected structure and types.
// for now I will not use it, but I will keep it here for future reference


// export const validate = (schema) => (req, res, next) => {
//   const data = {
//     body: req.body,
//     params: req.params,
//     query: req.query,
//   };

//   const { error } = schema.validate(data, { abortEarly: true, allowUnknown: true });
//   if (error) {
//     return res.status(400).json({
//       success: false,
//       message: error.details[0].message,
//     });
//   }

//   next();
// };


// Example usage of the validation middleware with a Joi schema

// // validations/auth.validation.js
// import Joi from "joi";

// export const registerSchema = Joi.object({
//   body: Joi.object({
//     name: Joi.string().required(),
//     email: Joi.string().email().required(),
//     password: Joi.string().min(6).required(),
//     role: Joi.string().valid("owner", "manager").required(),
//   }),
// });


// HOW TO USE THIS VALIDATION MIDDLEWARE IN YOUR ROUTES

// import express from "express";
// import { registerUserController } from "../controllers/auth.controller.js";
// import { validate } from "../middlewares/validate.js";
// import { registerSchema } from "../validations/auth.validation.js";

// const router = express.Router();

// router.post("/register", validate(registerSchema), registerUserController);

// middlewares/validate.js
import Joi from "joi";

// Helper function to validate request
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }
    next();
  };
};

// ==========================================
// AUTH VALIDATIONS (UPDATED FOR MOVEINN)
// ==========================================

const registerUser = validateRequest(
  Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
      }),
    user_type: Joi.string()
      .valid('tenant', 'landlord', 'agency', 'university_admin', 'bank_partner')
      .required(),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    language_preference: Joi.string()
      .valid('english', 'chinese')
      .default('english')
      .optional()
  })
);

const loginUser = validateRequest(
  Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  })
);

const resendVerification = validateRequest(
  Joi.object({
    email: Joi.string().email().required(),
  })
);

const forgotPassword = validateRequest(
  Joi.object({
    email: Joi.string().email().required(),
  })
);

const resetPassword = validateRequest(
  Joi.object({
    token: Joi.string().required(),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
      .required(),
  })
);

// ==========================================
// ONBOARDING VALIDATIONS (NEW FOR MOVEINN)
// ==========================================

const setupBasicProfile = validateRequest(
  Joi.object({
    date_of_birth: Joi.date()
      .max('now')
      .min('1900-01-01')
      .required()
      .messages({
        'date.max': 'Date of birth cannot be in the future',
        'date.min': 'Please provide a valid date of birth'
      }),
    gender: Joi.string()
      .valid('male', 'female', 'other', 'prefer_not_to_say')
      .required(),
    occupation: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Occupation must be at least 2 characters',
        'string.max': 'Occupation must be less than 100 characters'
      })
  })
);

const verifyUniversityStudent = validateRequest(
  Joi.object({
    student_email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid university email address'
      }),
    student_id: Joi.string()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Student ID is required',
        'string.max': 'Student ID must be less than 50 characters'
      }),
    major: Joi.string()
      .max(100)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Major must be less than 100 characters'
      }),
    graduation_year: Joi.number()
      .integer()
      .min(new Date().getFullYear())
      .max(new Date().getFullYear() + 10)
      .optional()
      .messages({
        'number.min': 'Graduation year cannot be in the past',
        'number.max': 'Graduation year seems too far in the future'
      })
  })
);

const uploadIdentityDocument = (req, res, next) => {
  const schema = Joi.object({
    document_type: Joi.string()
      .valid('identity_card', 'passport', 'drivers_license', 'student_id', 'bank_statement', 'pay_stub', 'other')
      .required()
      .messages({
        'any.only': 'Invalid document type'
      })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      error: error.details[0].message,
    });
  }

  // Validate file upload
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Document file is required",
    });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: "Only JPEG, PNG, WebP, and PDF files are allowed",
    });
  }

  // Validate file size (10MB max for documents)
  if (req.file.size > 10 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: "Document size must be less than 10MB",
    });
  }

  next();
};

const orderBackgroundCheck = validateRequest(
  Joi.object({
    check_type: Joi.string()
      .valid('background', 'income_employment', 'social_credit')
      .required()
      .messages({
        'any.only': 'Invalid background check type. Must be: background, income_employment, or social_credit'
      })
  })
);

const uploadProfileImage = (req, res, next) => {
  // Validate file upload
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Profile image is required",
    });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: "Only JPEG, PNG, and WebP images are allowed",
    });
  }

  // Validate file size (5MB max for profile images)
  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: "Profile image size must be less than 5MB",
    });
  }

  next();
};


const setupCompanyVerification = validateRequest(
  Joi.object({
    company_name: Joi.string()
      .min(2)
      .max(200)
      .required()
      .messages({
        'string.min': 'Company name must be at least 2 characters',
        'string.max': 'Company name must be less than 200 characters'
      }),
    business_type: Joi.string()
      .valid(
        'property_management', 
        'real_estate_agency', 
        'investment_company',
        'bank',
        'mortgage_lender',
        'credit_union',
        'fintech',
        'other'
      )
      .required()
      .messages({
        'any.only': 'Please select a valid business type'
      }),
    company_size: Joi.string()
      .valid('1-10', '11-50', '51-200', '201-500', '500+')
      .optional(),
    website: Joi.string()
      .uri()
      .optional()
      .allow('')
      .messages({
        'string.uri': 'Please provide a valid website URL'
      }),
    tax_id: Joi.string()
      .pattern(/^[0-9-]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Tax ID should contain only numbers and dashes'
      }),
    business_address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zip_code: Joi.string().required(),
      country: Joi.string().default('USA')
    }).optional()
  })
);

const uploadBusinessDocument = (req, res, next) => {
  const schema = Joi.object({
    document_type: Joi.string()
      .valid(
        'business_license',
        'tax_document', 
        'incorporation_document',
        'insurance_document',
        'banking_information',
        'other'
      )
      .required()
      .messages({
        'any.only': 'Invalid business document type'
      })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      error: error.details[0].message,
    });
  }

  // Validate file upload
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Business document file is required",
    });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: "Only JPEG, PNG, WebP, and PDF files are allowed",
    });
  }

  // Validate file size (10MB max for business documents)
  if (req.file.size > 10 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: "Document size must be less than 10MB",
    });
  }

  next();
};

// ==========================================
// UNIVERSITY VALIDATIONS (NEW)
// ==========================================

const createUniversity = validateRequest(
  Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .required()
      .messages({
        'string.min': 'University name must be at least 2 characters',
        'string.max': 'University name must be less than 200 characters'
      }),
    domain: Joi.string()
      .pattern(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      .required()
      .messages({
        'string.pattern.base': 'Please provide a valid domain (e.g., university.edu)'
      }),
    contact_email: Joi.string()
      .email()
      .required(),
    contact_phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .optional(),
    monthly_fee: Joi.number()
      .positive()
      .default(99.00)
      .optional(),
    discount_percentage: Joi.number()
      .min(0)
      .max(100)
      .default(15.00)
      .optional()
  })
);

// ==========================================
// ADMIN VALIDATIONS (NEW)
// ==========================================

const approveDocument = validateRequest(
  Joi.object({
    review_notes: Joi.string()
      .max(1000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Review notes must be less than 1000 characters'
      })
  })
);

const rejectDocument = validateRequest(
  Joi.object({
    rejection_reason: Joi.string()
      .min(10)
      .max(500)
      .required()
      .messages({
        'string.min': 'Rejection reason must be at least 10 characters',
        'string.max': 'Rejection reason must be less than 500 characters'
      })
  })
);

const updateUserStatus = validateRequest(
  Joi.object({
    status: Joi.string()
      .valid('pending', 'active', 'inactive', 'suspended', 'banned')
      .required(),
    reason: Joi.string()
      .max(500)
      .optional()
      .allow('')
  })
);



// Add these payment validations to your existing validate.js file

const paymentValidations = {
  createOneTimePayment: Joi.object({
    service_type: Joi.string()
      .valid(
        'background_check', 
        'income_check', 
        'social_credit_check', 
        'basic_listing', 
        'premium_listing', 
        'listing_boost', 
        'contract_fee'
      )
      .required()
      .messages({
        'any.only': 'Invalid service type',
        'any.required': 'Service type is required'
      }),
    gateway: Joi.string()
      .valid('stripe', 'paypal')
      .default('stripe')
      .messages({
        'any.only': 'Gateway must be either stripe or paypal'
      })
  }),

  confirmPayment: Joi.object({
    transaction_id: Joi.string()
      .required()
      .messages({
        'any.required': 'Transaction ID is required'
      }),
    gateway_transaction_id: Joi.string()
      .required()
      .messages({
        'any.required': 'Gateway transaction ID is required'
      })
  }),

  createSubscription: Joi.object({
    subscription_type: Joi.string()
      .valid(
        'roommate_weekly',
        'landlord_monthly', 
        'agency_unlimited',
        'university_partnership',
        'bank_advertisement'
      )
      .required()
      .messages({
        'any.only': 'Invalid subscription type',
        'any.required': 'Subscription type is required'
      }),
    gateway: Joi.string()
      .valid('stripe', 'paypal')
      .default('stripe')
      .messages({
        'any.only': 'Gateway must be either stripe or paypal'
      })
  }),

  setupPaymentAccount: Joi.object({
    gateway: Joi.string()
      .valid('stripe', 'paypal')
      .default('stripe')
      .messages({
        'any.only': 'Gateway must be either stripe or paypal'
      })
  }),

  createRentPayment: Joi.object({
    landlord_id: Joi.string()
      .required()
      .messages({
        'any.required': 'Landlord ID is required'
      }),
    property_id: Joi.string()
      .required()
      .messages({
        'any.required': 'Property ID is required'
      }),
    amount: Joi.number()
      .integer()
      .min(100) // Minimum $1.00
      .required()
      .messages({
        'number.min': 'Amount must be at least $1.00',
        'any.required': 'Amount is required'
      }),
    gateway: Joi.string()
      .valid('stripe', 'paypal')
      .default('stripe')
      .messages({
        'any.only': 'Gateway must be either stripe or paypal'
      })
  })
};



// ==========================================
// EXPORT ALL VALIDATIONS
// ==========================================

export const validate = {
  // Auth (Updated)
  registerUser,
  loginUser,
  resendVerification,
  forgotPassword,
  resetPassword,
  
  // Onboarding (New)
  setupBasicProfile,
  verifyUniversityStudent,
  uploadIdentityDocument,
  orderBackgroundCheck,
  uploadProfileImage,

  // Company Verification (New)
  setupCompanyVerification,
  uploadBusinessDocument,
  
  // University (New)
  createUniversity,
  
  // Admin (New)
  approveDocument,
  rejectDocument,
  updateUserStatus,

  // Payment Validations
  paymentValidations,
  
};