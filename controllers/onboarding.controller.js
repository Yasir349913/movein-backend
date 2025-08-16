import { onboardingService, storageService} from "../services/index.js";
import { logger, ApiResponse, ApiError } from "../utils/index.js";

/**
 * Get user's onboarding progress
 */
export const getProgress = async (req, res) => {
  const userId = req.user._id;
  
  logger.info("Getting onboarding progress", { userId });
  
  try {
    const progress = await onboardingService.getOnboardingProgress(userId);
    
    res.status(200).json(
      new ApiResponse(200, progress, "Progress retrieved successfully")
    );
  } catch (error) {
    logger.error("Failed to get onboarding progress", { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Complete basic profile setup
 */
export const setupBasicProfile = async (req, res) => {
  const userId = req.user._id;
  const { date_of_birth, gender, occupation } = req.body;
  
  logger.info("Basic profile setup attempt", { userId });
  
  try {
    const result = await onboardingService.completeBasicProfile(userId, {
      date_of_birth,
      gender,
      occupation
    });
    
    logger.info("Basic profile setup completed", { userId });
    
    res.status(200).json(
      new ApiResponse(200, {
        user: {
          id: result.user._id,
          name: result.user.name,
          email: result.user.email,
          date_of_birth: result.user.date_of_birth,
          gender: result.user.gender,
          occupation: result.user.occupation
        },
        onboarding: {
          next_step: result.next_step,
          completion_percentage: result.completion_percentage
        }
      }, "Profile updated successfully")
    );
  } catch (error) {
    logger.error("Basic profile setup failed", { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Verify university student status
 */
export const verifyUniversityStudent = async (req, res) => {
  const userId = req.user._id;
  const { student_email, student_id, major, graduation_year } = req.body;
  
  logger.info("University verification attempt", { userId, student_email });
  
  try {
    const result = await onboardingService.verifyUniversityStudent(userId, {
      student_email,
      student_id,
      major,
      graduation_year
    });
    
    logger.info("University verification completed", { 
      userId, 
      universityId: result.university._id,
      discountEligible: result.discount_eligible 
    });
    
    res.status(200).json(
      new ApiResponse(200, {
        university: {
          id: result.university._id,
          name: result.university.name,
          discount_percentage: result.university.discount_percentage
        },
        student_verification: {
          is_verified: result.university_student.is_verified,
          discount_eligible: result.discount_eligible,
          discount_percentage: result.discount_percentage
        },
        onboarding: {
          next_step: result.next_step,
          completion_percentage: result.completion_percentage
        }
      }, "University verification successful")
    );
  } catch (error) {
    logger.error("University verification failed", { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Upload identity document
 */
export const uploadIdentityDocument = async (req, res) => {
  const userId = req.user._id;
  const file = req.file;
  const { document_type } = req.body;
  
  logger.info("Identity document upload attempt", { userId, document_type });
  
  if (!file) {
    throw new ApiError(400, "No file uploaded");
  }
  
  try {
    const result = await onboardingService.uploadIdentityDocument(userId, file, document_type);
    
    logger.info("Identity document uploaded", { 
      userId, 
      documentId: result.document._id,
      stepCompleted: result.step_completed 
    });
    
    res.status(200).json(
      new ApiResponse(200, {
        document: {
          id: result.document._id,
          document_type: result.document.document_type,
          document_name: result.document.document_name,
          status: result.document.status,
          file_url: result.document.file_url
        },
        step_completed: result.step_completed,
        onboarding: result.step_completed ? {
          next_step: result.next_step,
          completion_percentage: result.completion_percentage
        } : undefined,
        message: result.message || "Document uploaded successfully"
      }, "Document uploaded successfully")
    );
  } catch (error) {
    logger.error("Identity document upload failed", { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Order background check
 */
export const orderBackgroundCheck = async (req, res) => {
  const userId = req.user._id;
  const { check_type } = req.body;
  
  logger.info("Background check order attempt", { userId, check_type });
  
  try {
    const result = await onboardingService.orderBackgroundCheck(userId, check_type);
    
    logger.info("Background check ordered", { 
      userId, 
      checkId: result.background_check._id,
      checkType: check_type,
      amount: result.amount_paid
    });
    
    res.status(200).json(
      new ApiResponse(200, {
        background_check: {
          id: result.background_check._id,
          check_type: result.background_check.check_type,
          amount_paid: result.amount_paid,
          status: result.background_check.status,
          certn_order_id: result.background_check.certn_order_id
        },
        estimated_completion: result.estimated_completion
      }, "Background check ordered successfully")
    );
  } catch (error) {
    logger.error("Background check order failed", { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Complete onboarding process
 */
export const completeOnboarding = async (req, res) => {
  const userId = req.user._id;
  
  logger.info("Onboarding completion attempt", { userId });
  
  try {
    const result = await onboardingService.completeOnboarding(userId);
    
    logger.info("Onboarding completed successfully", { userId });
    
    res.status(200).json(
      new ApiResponse(200, {
        user: {
          id: result.user._id,
          name: result.user.name,
          email: result.user.email,
          user_type: result.user.user_type,
          status: result.user.status,
          isVerified: result.user.isVerified
        },
        onboarding_completed: result.onboarding_completed,
        account_activated: result.account_activated,
        next_steps: result.next_steps
      }, "Onboarding completed successfully")
    );
  } catch (error) {
    logger.error("Onboarding completion failed", { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};


/**
 * Setup university profile (for university admins)
 */
export const setupUniversityProfile = async (req, res) => {
  const userId = req.user._id;
  const { 
    name, 
    name_chinese,
    domain, 
    contact_email, 
    contact_phone,
    university_type,
    established_year,
    student_population,
    website_url,
    address
  } = req.body;
  
  logger.info("University profile setup attempt", { userId, name, domain });
  
  try {
    const result = await onboardingService.setupUniversityProfile(userId, {
      name,
      name_chinese,
      domain,
      contact_email,
      contact_phone,
      university_type,
      established_year,
      student_population,
      website_url,
      address
    });
    
    logger.info("University profile setup completed", { 
      userId, 
      universityId: result.university._id,
      name: result.university.name
    });
    
    res.status(200).json(
      new ApiResponse(200, {
        university: {
          id: result.university._id,
          name: result.university.name,
          domain: result.university.domain,
          subscription_status: result.university.subscription_status,
          monthly_fee: result.university.monthly_fee,
          discount_percentage: result.university.discount_percentage
        },
        trial_info: result.trial_info,
        onboarding: {
          next_step: result.next_step,
          completion_percentage: result.completion_percentage
        }
      }, "University profile setup successful")
    );
  } catch (error) {
    logger.error("University profile setup failed", { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};



/**
 * Upload university branding (logo)
 */
export const uploadUniversityLogo = async (req, res) => {
  const userId = req.user._id;
  const file = req.file;
  const { brand_colors } = req.body;
  
  logger.info("University logo upload attempt", { userId });
  
  if (!file) {
    throw new ApiError(400, "No logo file provided");
  }
  
  try {
    const result = await onboardingService.uploadUniversityLogo(userId, file, brand_colors);
    
    logger.info("University logo uploaded", { 
      userId, 
      universityId: result.university._id,
      logoUrl: result.logo_url
    });
    
    res.status(200).json(
      new ApiResponse(200, {
        university: {
          id: result.university._id,
          name: result.university.name,
          logo_url: result.logo_url,
          brand_colors: result.university.brand_colors
        },
        branding_completed: true
      }, "University branding uploaded successfully")
    );
  } catch (error) {
    logger.error("University logo upload failed", { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};



/**
 * Get university dashboard info (for university admin)
 */
export const getUniversityDashboard = async (req, res) => {
  const userId = req.user._id;
  
  logger.info("University dashboard request", { userId });
  
  try {
    const result = await onboardingService.getUniversityDashboard(userId);
    
    res.status(200).json(
      new ApiResponse(200, {
        university: result.university,
        statistics: result.statistics,
        recent_students: result.recent_students,
        subscription_info: result.subscription_info
      }, "University dashboard data retrieved successfully")
    );
  } catch (error) {
    logger.error("University dashboard request failed", { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};


/**
 * Setup company verification (for agencies and bank partners)
 */
export const setupCompanyVerification = async (req, res) => {
  const userId = req.user._id;
  const { 
    company_name, 
    business_type, 
    company_size, 
    website, 
    tax_id, 
    business_address 
  } = req.body;
  
  logger.info("Company verification setup attempt", { userId, company_name });
  
  try {
    const result = await onboardingService.setupCompanyVerification(userId, {
      company_name,
      business_type,
      company_size,
      website,
      tax_id,
      business_address
    });
    
    logger.info("Company verification setup completed", { 
      userId, 
      company_name,
      stepCompleted: result.step_completed 
    });
    
    res.status(200).json(
      new ApiResponse(200, {
        company_info: result.company_info,
        step_completed: result.step_completed,
        onboarding: result.step_completed ? {
          next_step: result.next_step,
          completion_percentage: result.completion_percentage
        } : undefined,
        message: result.message || "Company information saved successfully"
      }, "Company verification setup successful")
    );
  } catch (error) {
    logger.error("Company verification setup failed", { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Upload business documents (for company verification)
 */
export const uploadBusinessDocument = async (req, res) => {
  const userId = req.user._id;
  const file = req.file;
  const { document_type } = req.body;
  
  logger.info("Business document upload attempt", { userId, document_type });
  
  if (!file) {
    throw new ApiError(400, "No document file provided");
  }
  
  try {
    const result = await onboardingService.uploadBusinessDocument(userId, file, document_type);
    
    logger.info("Business document uploaded", { 
      userId, 
      documentId: result.document._id,
      document_type 
    });
    
    res.status(200).json(
      new ApiResponse(200, {
        document: {
          id: result.document._id,
          document_type: result.document.document_type,
          document_name: result.document.document_name,
          status: result.document.status,
          file_url: result.document.file_url
        },
        documents_uploaded: result.documents_uploaded,
        documents_required: result.documents_required,
        step_completed: result.step_completed,
        onboarding: result.step_completed ? {
          next_step: result.next_step,
          completion_percentage: result.completion_percentage
        } : undefined
      }, "Business document uploaded successfully")
    );
  } catch (error) {
    logger.error("Business document upload failed", { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};






/**
 * Upload profile image
 */
export const uploadProfileImage = async (req, res) => {
  const userId = req.user._id;
  const file = req.file;
  
  logger.info("Profile image upload attempt", { userId });
  
  if (!file) {
    throw new ApiError(400, "No image file provided");
  }
  
  try {
    // Upload image to S3
    const imageUrl = await storageService.uploadFile(file, 'profiles', userId);
    
    // Update user profile
    const result = await onboardingService.updateProfileImage(userId, imageUrl);
    
    logger.info("Profile image uploaded successfully", { userId, imageUrl });
    
    res.status(200).json(
      new ApiResponse(200, {
        user: result.user,
        image_url: imageUrl,
        onboarding: result.onboarding
      }, "Profile image uploaded successfully")
    );
  } catch (error) {
    logger.error("Profile image upload failed", { userId, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Get background check pricing
 */
export const getBackgroundCheckPricing = async (req, res) => {
  try {
    const pricing = await onboardingService.getBackgroundCheckPricing();
    
    res.status(200).json(
      new ApiResponse(200, { pricing }, "Background check pricing retrieved successfully")
    );
  } catch (error) {
    logger.error("Failed to get background check pricing", { error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Skip optional onboarding step
 */
export const skipStep = async (req, res) => {
  const userId = req.user._id;
  const { step_name, reason } = req.body;
  
  logger.info("Step skip attempt", { userId, step_name });
  
  try {
    const result = await onboardingService.skipStep(userId, step_name, reason);
    
    logger.info("Step skipped successfully", { userId, step_name });
    
    res.status(200).json(
      new ApiResponse(200, {
        step_skipped: step_name,
        onboarding: {
          next_step: result.next_step,
          completion_percentage: result.completion_percentage
        }
      }, "Step skipped successfully")
    );
  } catch (error) {
    logger.error("Step skip failed", { userId, step_name, error: error.message });
    throw new ApiError(400, error.message);
  }
};

/**
 * Retry failed onboarding step
 */
export const retryStep = async (req, res) => {
  const userId = req.user._id;
  const { step_name } = req.body;
  
  logger.info("Step retry attempt", { userId, step_name });
  
  try {
    const result = await onboardingService.retryStep(userId, step_name);
    
    logger.info("Step retry initiated", { userId, step_name });
    
    res.status(200).json(
      new ApiResponse(200, {
        step_reset: step_name,
        onboarding: {
          current_step: result.current_step,
          completion_percentage: result.completion_percentage
        }
      }, "Step retry initiated successfully")
    );
  } catch (error) {
    logger.error("Step retry failed", { userId, step_name, error: error.message });
    throw new ApiError(400, error.message);
  }
};