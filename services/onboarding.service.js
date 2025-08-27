// services/onboarding.service.js

import {
  User,
  OnboardingProgress,
  University,
  UniversityStudent,
  UserDocument,
  BackgroundCheck,
} from "../models/index.js";
import { emailService, storageService } from "./index.js";

class OnboardingService {
  /**
   * Register new user with onboarding initialization
   */
  async registerUser(userData) {
    const { name, email, password, user_type, phone, language_preference } =
      userData;

    // 1. Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // 2. Create user
    const user = new User({
      name,
      email,
      password,
      user_type,
      phone,
      language_preference: language_preference || "english",
      status: "pending",
    });

    // 3. Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // 4. Initialize onboarding progress
    const progress = await OnboardingProgress.initializeForUser(
      user._id,
      user_type
    );

    // 5. Send verification email
    await emailService.sendEmailVerification(email, verificationToken, {
      userName: name,
      language: language_preference,
    });

    return {
      user: user,
      onboarding_progress: progress,
      verification_token: verificationToken,
      next_step: "email_verification",
    };
  }

  /**
   * Verify user email and update onboarding progress
   */
  async verifyEmail(token) {
    // 1. Find user by token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error("Invalid or expired verification token");
    }

    // 2. Update user verification status
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.status = "active";
    await user.save();

    // 3. Update onboarding progress
    const progress = await OnboardingProgress.findOne({ user_id: user._id });
    await progress.completeStep("email_verification");

    // 4. Generate access tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    return {
      user,
      accessToken,
      refreshToken,
      next_step: progress.current_step,
      completion_percentage: progress.completion_percentage,
    };
  }

  /**
   * Complete basic profile information
   */
  async completeBasicProfile(userId, profileData) {
    const { date_of_birth, gender, occupation } = profileData;

    // 1. Update user profile
    const user = await User.findByIdAndUpdate(
      userId,
      { date_of_birth, gender, occupation },
      { new: true }
    );

    // 2. Update onboarding progress
    const progress = await OnboardingProgress.findOne({ user_id: userId });
    await progress.completeStep("basic_profile");

    return {
      user,
      next_step: progress.current_step,
      completion_percentage: progress.completion_percentage,
    };
  }

  /**
   * Verify university student status
   */
  async verifyUniversityStudent(userId, universityData) {
    const { student_email, student_id, major, graduation_year } =
      universityData;

    // 1. Extract domain and find university
    const emailDomain = student_email.split("@")[1];
    const university = await University.findByDomain(emailDomain);

    if (!university) {
      throw new Error("University not found or not partnered with us");
    }

    // 2. Validate student email domain
    if (!university.isValidStudentEmail(student_email)) {
      throw new Error("Invalid university email domain");
    }

    // 3. Create university student record
    const universityStudent = new UniversityStudent({
      user_id: userId,
      university_id: university._id,
      student_email,
      student_id,
      major,
      graduation_year,
      verification_method: "email_domain",
    });

    // 4. Auto-verify for email domain method
    await universityStudent.verify();

    // 5. Update user record
    const user = await User.findByIdAndUpdate(
      userId,
      { university_id: university._id, isVerified: true },
      { new: true }
    );

    // 6. Update university student count
    university.total_students += 1;
    await university.save();

    // 7. Update onboarding progress
    const progress = await OnboardingProgress.findOne({ user_id: userId });
    await progress.completeStep("university_verification");

    // 8. Send verification success email
    await emailService.sendUniversityVerificationEmail(user.email, {
      userName: user.name,
      universityName: university.name,
      studentEmail: student_email,
      discountPercentage: university.discount_percentage,
    });

    return {
      university_student: universityStudent,
      university: university,
      discount_eligible: true,
      discount_percentage: university.discount_percentage,
      next_step: progress.current_step,
      completion_percentage: progress.completion_percentage,
    };
  }

  /**
   * Upload identity document
   */
  async uploadIdentityDocument(userId, file, documentType) {
    // 1. Upload file to S3
    const fileUrl = await storageService.uploadFile(file, "documents", userId);

    // 2. Create document record
    const document = new UserDocument({
      user_id: userId,
      document_type: documentType,
      document_name: file.originalname,
      file_url: fileUrl,
      file_size: file.size,
      file_type: file.mimetype.split("/")[1],
      status: "pending",
    });

    await document.save();

    // 3. Check if this completes identity verification
    const identityDocs = await UserDocument.find({
      user_id: userId,
      document_type: { $in: ["identity_card", "passport", "drivers_license"] },
      status: { $in: ["pending", "approved"] },
    });

    // 4. If sufficient documents uploaded, complete the step
    if (identityDocs.length >= 1) {
      const progress = await OnboardingProgress.findOne({ user_id: userId });
      await progress.completeStep("identity_verification");

      return {
        document,
        step_completed: true,
        next_step: progress.current_step,
        completion_percentage: progress.completion_percentage,
      };
    }

    return {
      document,
      step_completed: false,
      message: "Document uploaded. Please wait for admin approval.",
    };
  }

  /**
   * Order background check
   */
  async orderBackgroundCheck(userId, checkType) {
    const pricing = BackgroundCheck.getChecksPricing();
    const amount = pricing[checkType];

    if (!amount) {
      throw new Error("Invalid check type");
    }

    // 1. Create background check record
    const backgroundCheck = new BackgroundCheck({
      user_id: userId,
      check_type: checkType,
      amount_paid: amount,
      status: "pending",
    });

    await backgroundCheck.save();

    // Should integrate with your payment service
    const paymentResult = await paymentService.createOneTimePayment(
      userId,
      checkType, // 'background_check', 'income_check', 'social_credit_check'
      "stripe"
    );

    if (!paymentResult.success) {
      throw new Error(`Payment failed: ${paymentResult.error}`);
    }

    // Update background check with transaction ID
    backgroundCheck.transaction_id = paymentResult.transaction_id;

    // 3. Submit to Certn API (mock for now)
    const certnOrderId = `CERTN_${Date.now()}_${userId.toString().slice(-6)}`;
    backgroundCheck.certn_order_id = certnOrderId;
    backgroundCheck.status = "in_progress";
    await backgroundCheck.save();

    return {
      background_check: backgroundCheck,
      amount_paid: amount,
      estimated_completion: "2-5 business days",
    };
  }

  /**
   * Get user's onboarding progress with context
   */
  async getOnboardingProgress(userId) {
    const progress = await OnboardingProgress.findOne({
      user_id: userId,
    }).populate("user_id", "name email user_type isEmailVerified");

    if (!progress) {
      throw new Error("Onboarding progress not found");
    }

    // Get additional context
    const context = await this.getProgressContext(userId, progress.user_type);

    return {
      current_step: progress.current_step,
      completion_percentage: progress.completion_percentage,
      steps_completed: progress.steps_completed,
      steps_required: progress.steps_required,
      is_completed: progress.is_completed,
      next_actions: this.getNextActions(progress),
      context: context,
    };
  }

  /**
   * Complete onboarding and activate account
   */
  async completeOnboarding(userId) {
    const progress = await OnboardingProgress.findOne({ user_id: userId });

    if (!progress.is_completed) {
      throw new Error("Onboarding not yet complete");
    }

    // 1. Activate user account fully
    const user = await User.findByIdAndUpdate(
      userId,
      { status: "active", isVerified: true },
      { new: true }
    );

    // 2. Send welcome email
    await emailService.sendWelcomeEmail(user.email, {
      userName: user.name,
      userType: user.user_type,
      language: user.language_preference,
      discountEligible: user.university_id ? true : false,
    });

    return {
      user,
      onboarding_completed: true,
      account_activated: true,
      next_steps: this.getRoleSpecificNextSteps(user.user_type),
    };
  }

  // Helper methods
  async getProgressContext(userId, userType) {
    const context = {};

    // University verification context
    if (userType === "tenant") {
      const universityStudent = await UniversityStudent.findOne({
        user_id: userId,
      });
      if (universityStudent) {
        context.university_verification = {
          is_verified: universityStudent.is_verified,
          discount_eligible: universityStudent.discount_eligible,
          university: await University.findById(
            universityStudent.university_id,
            "name discount_percentage"
          ),
        };
      }
    }

    // Document verification context
    if (["landlord", "agency"].includes(userType)) {
      const documents = await UserDocument.find({ user_id: userId });
      context.documents = {
        total: documents.length,
        pending: documents.filter((d) => d.status === "pending").length,
        approved: documents.filter((d) => d.status === "approved").length,
        rejected: documents.filter((d) => d.status === "rejected").length,
      };
    }

    // Background check context
    const backgroundChecks = await BackgroundCheck.find({ user_id: userId });
    context.background_checks = {
      total: backgroundChecks.length,
      completed: backgroundChecks.filter((b) => b.status === "completed")
        .length,
      badges_earned: backgroundChecks.filter((b) => b.badge_awarded).length,
    };

    return context;
  }

  getNextActions(progress) {
    const actionMap = {
      email_verification: {
        action: "verify_email",
        title: "Verify Your Email",
        description: "Check your email and click the verification link",
      },
      basic_profile: {
        action: "complete_profile",
        title: "Complete Your Profile",
        description: "Add your personal information",
      },
      university_verification: {
        action: "verify_university",
        title: "Verify University Status",
        description: "Confirm your student email and details",
      },
      identity_verification: {
        action: "upload_documents",
        title: "Upload Identity Documents",
        description: "Upload government-issued ID for verification",
      },
    };

    return [
      actionMap[progress.current_step] || {
        action: "continue",
        title: "Continue Setup",
        description: "Complete remaining onboarding steps",
      },
    ];
  }

  getRoleSpecificNextSteps(userType) {
    const nextSteps = {
      tenant: [
        "Browse available properties",
        "Set up roommate finder profile",
        "Apply student discount if eligible",
      ],
      landlord: [
        "Create your first property listing",
        "Set up payment methods",
        "Review tenant applications",
      ],
      agency: [
        "Set up company profile",
        "Add team members",
        "Create multiple property listings",
      ],
    };

    return nextSteps[userType] || [];
  }

  /**
   * Update user profile image
   */
  async updateProfileImage(userId, imageUrl) {
    // 1. Update user profile
    const user = await User.findByIdAndUpdate(
      userId,
      { profile_img: imageUrl },
      { new: true }
    );

    // 2. Update onboarding progress if profile_image step exists
    const progress = await OnboardingProgress.findOne({ user_id: userId });
    if (progress && progress.steps_required.includes("profile_image")) {
      await progress.completeStep("profile_image");
    }

    return {
      user,
      onboarding: {
        next_step: progress?.current_step,
        completion_percentage: progress?.completion_percentage,
      },
    };
  }

  /**
   * Setup company verification information
   */
  async setupCompanyVerification(userId, companyData) {
    const {
      company_name,
      business_type,
      company_size,
      website,
      tax_id,
      business_address,
    } = companyData;

    // 1. Update user company information
    const user = await User.findByIdAndUpdate(
      userId,
      {
        "company_info.company_name": company_name,
        "company_info.business_type": business_type,
        "company_info.company_size": company_size,
        "company_info.website": website,
        "company_info.tax_id": tax_id,
        "company_info.business_address": business_address,
      },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found");
    }

    // 2. Check if user type requires document upload
    const requiresDocuments = ["agency", "bank_partner"].includes(
      user.user_type
    );

    if (!requiresDocuments) {
      // 3. Complete company verification step for university admins
      const progress = await OnboardingProgress.findOne({ user_id: userId });
      await progress.completeStep("company_verification");

      return {
        company_info: user.company_info,
        step_completed: true,
        next_step: progress.current_step,
        completion_percentage: progress.completion_percentage,
      };
    }

    return {
      company_info: user.company_info,
      step_completed: false,
      message:
        "Company information saved. Please upload required business documents.",
    };
  }

  /**
   * Upload business document for company verification
   */
  async uploadBusinessDocument(userId, file, documentType) {
    // 1. Upload file to S3
    const fileUrl = await storageService.uploadFile(
      file,
      "business-documents",
      userId
    );

    // 2. Create document record
    const document = new UserDocument({
      user_id: userId,
      document_type: documentType,
      document_name: file.originalname,
      file_url: fileUrl,
      file_size: file.size,
      file_type: file.mimetype.split("/")[1],
      status: "pending",
      purpose: "business_verification",
    });

    await document.save();

    // 3. Check if sufficient business documents uploaded
    const businessDocs = await UserDocument.find({
      user_id: userId,
      purpose: "business_verification",
      status: { $in: ["pending", "approved"] },
      is_active: true,
    });

    const requiredDocs = ["business_license", "tax_document"];
    const uploadedDocTypes = businessDocs.map((doc) => doc.document_type);
    const hasAllRequired = requiredDocs.every((type) =>
      uploadedDocTypes.includes(type)
    );

    // 4. If sufficient documents uploaded, complete the step
    if (hasAllRequired) {
      const progress = await OnboardingProgress.findOne({ user_id: userId });
      await progress.completeStep("company_verification");

      return {
        document,
        documents_uploaded: businessDocs.length,
        documents_required: requiredDocs.length,
        step_completed: true,
        next_step: progress.current_step,
        completion_percentage: progress.completion_percentage,
      };
    }

    return {
      document,
      documents_uploaded: businessDocs.length,
      documents_required: requiredDocs.length,
      step_completed: false,
      message: `Document uploaded. Please upload remaining documents: ${requiredDocs.filter((type) => !uploadedDocTypes.includes(type)).join(", ")}`,
    };
  }

  /**
   * Setup university profile for university admin
   */
  async setupUniversityProfile(userId, universityData) {
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
      address,
      discount_percentage,
      monthly_fee,
    } = universityData;

    // 1. Check if university already exists for this admin
    const existingUniversity = await University.findOne({
      admin_user_id: userId,
    });

    {
      if (existingUniversity) {
        throw new Error("University profile already exists for this admin");
      }
    }

    // 2. Check if domain is already taken
    const domainExists = await University.findOne({
      domain: domain.toLowerCase(),
    });
    {
      if (domainExists) {
        throw new Error("University domain is already registered");
      }
    }

    // 3. Create new university
    const university = new University({
      name,
      name_chinese,
      domain: domain.toLowerCase(),
      admin_user_id: userId,
      contact_email,
      contact_phone,
      university_type,
      established_year,
      student_population,
      website_url,
      address,
      trial_starts_at: new Date(),
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      subscription_status: "trial",
      monthly_fee: monthly_fee || 99.0,
      discount_percentage: discount_percentage || 15.0,
      total_students: 0,
      is_active: true,
    });

    await university.save();

    // 4. Update user record
    await User.findByIdAndUpdate(userId, {
      university_id: university._id,
    });

    // 5. Complete university setup step
    const progress = await OnboardingProgress.findOne({ user_id: userId });
    await progress.completeStep("university_setup");

    // 6. Calculate trial end date
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);

    return {
      university: university,
      trial_info: {
        trial_ends_at: trialEndDate,
        trial_days_remaining: 30,
        monthly_fee: university.monthly_fee,
      },
      next_step: progress.current_step,
      completion_percentage: progress.completion_percentage,
    };
  }

  /**
   * Upload university logo and branding
   */
  async uploadUniversityLogo(userId, file, brandColors) {
    // 1. Find university by admin user
    const university = await University.findOne({ admin_user_id: userId });

    if (!university) {
      throw new Error("University not found for this admin");
    }

    // 2. Upload logo to S3
    const logoUrl = await storageService.uploadFile(
      file,
      "university-logos",
      userId
    );

    // 3. Parse brand colors if provided
    let parsedBrandColors = {};
    if (brandColors) {
      try {
        parsedBrandColors =
          typeof brandColors === "string"
            ? JSON.parse(brandColors)
            : brandColors;
      } catch (error) {
        // Use default colors if parsing fails
        parsedBrandColors = {};
      }
    }

    // 4. Update university with logo and colors
    university.logo_url = logoUrl;
    if (parsedBrandColors.primary || parsedBrandColors.secondary) {
      university.brand_colors = parsedBrandColors;
    }

    await university.save();

    return {
      university: university,
      logo_url: logoUrl,
    };
  }

  /**
   * Get university dashboard data
   */
  async getUniversityDashboard(userId) {
    // 1. Find university by admin user
    const university = await University.findOne({ admin_user_id: userId });

    if (!university) {
      throw new Error("University not found for this admin");
    }

    // 2. Get university students
    const totalStudents = await UniversityStudent.countDocuments({
      university_id: university._id,
      is_active: true,
    });

    const verifiedStudents = await UniversityStudent.countDocuments({
      university_id: university._id,
      is_verified: true,
      is_active: true,
    });

    // 3. Get recent students (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStudents = await UniversityStudent.find({
      university_id: university._id,
      createdAt: { $gte: thirtyDaysAgo },
      is_active: true,
    })
      .populate("user_id", "name email createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    // 4. Calculate trial/subscription info
    const now = new Date();
    const trialDaysRemaining =
      university.subscription_status === "trial"
        ? Math.max(
            0,
            Math.ceil((university.trial_ends_at - now) / (1000 * 60 * 60 * 24))
          )
        : 0;

    // 5. Update university student count
    university.total_students = totalStudents;
    await university.save();

    return {
      university: {
        id: university._id,
        name: university.name,
        domain: university.domain,
        logo_url: university.logo_url,
        brand_colors: university.brand_colors,
        subscription_status: university.subscription_status,
        monthly_fee: university.monthly_fee,
        discount_percentage: university.discount_percentage,
      },
      statistics: {
        total_students: totalStudents,
        verified_students: verifiedStudents,
        discount_savings: totalStudents * 10, // Estimated monthly savings for students
        engagement_rate:
          totalStudents > 0
            ? ((verifiedStudents / totalStudents) * 100).toFixed(1)
            : 0,
      },
      recent_students: recentStudents.map((student) => ({
        name: student.user_id.name,
        email: student.user_id.email,
        student_id: student.student_id,
        major: student.major,
        verified: student.is_verified,
        joined_at: student.createdAt,
      })),
      subscription_info: {
        status: university.subscription_status,
        monthly_fee: university.monthly_fee,
        trial_days_remaining: trialDaysRemaining,
        next_billing_date:
          university.subscription_status === "active"
            ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            : null,
      },
    };
  }

  /**
   * Get background check pricing
   */
  async getBackgroundCheckPricing() {
    return BackgroundCheck.getChecksPricing();
  }

  /**
   * Skip optional step
   */
  async skipStep(userId, stepName, reason = "") {
    const progress = await OnboardingProgress.findOne({ user_id: userId });

    if (!progress) {
      throw new Error("Onboarding progress not found");
    }

    // Add to skipped steps if not already there
    if (!progress.steps_completed.some((step) => step.step_name === stepName)) {
      progress.steps_completed.push({
        step_name: stepName,
        completed_at: new Date(),
        skipped: true,
        skip_reason: reason,
      });
    }

    // Recalculate progress and move to next step
    await progress.moveToNextStep();

    return {
      next_step: progress.current_step,
      completion_percentage: progress.completion_percentage,
    };
  }

  /**
   * Retry failed step
   */
  async retryStep(userId, stepName) {
    const progress = await OnboardingProgress.findOne({ user_id: userId });

    if (!progress) {
      throw new Error("Onboarding progress not found");
    }

    // Remove step from completed if it exists
    const completedIndex = progress.steps_completed.findIndex(
      (step) => step.step_name === stepName
    );

    if (completedIndex > -1) {
      progress.steps_completed.splice(completedIndex, 1);
    }

    // Set current step and recalculate progress
    progress.current_step = stepName;
    progress.completion_percentage = Math.round(
      (progress.steps_completed.length / progress.steps_required.length) * 100
    );

    await progress.save();

    return {
      current_step: stepName,
      completion_percentage: progress.completion_percentage,
    };
  }
}

export const onboardingService = new OnboardingService();
