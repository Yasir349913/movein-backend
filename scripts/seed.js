// scripts/seed.js
import mongoose from "mongoose";
import { connectDB } from "../config/index.js";
import {
  User,
  University,
  UniversityStudent,
  BackgroundCheck,
  UserDocument,
  OnboardingProgress,
} from "../models/index.js";
import { env } from "../config/index.js";

const isProd = env.NODE_ENV === "production";
const CLEAR_DB = isProd ? env.SEED_CLEAR === "true" : true;

// ----- helpers -----
async function ensureUser(doc) {
  const existing = await User.findOne({ email: doc.email });
  if (existing) return existing;
  return User.create(doc); // keep model hooks (e.g., password hashing)
}

async function ensureUniversity(doc) {
  const existing = await University.findOne({ domain: doc.domain });
  if (existing) return existing;
  return University.create(doc);
}

async function clearDatabase() {
  if (!CLEAR_DB) {
    console.log("Skipping clear (CLEAR_DB=false).");
    return;
  }
  console.log("Clearing collections...");
  await Promise.all([
    User.deleteMany({}),
    University.deleteMany({}),
    UniversityStudent.deleteMany({}),
    BackgroundCheck.deleteMany({}),
    UserDocument.deleteMany({}),
    OnboardingProgress.deleteMany({}),
  ]);
  console.log("Collections cleared.");
}

// ----- seed steps -----
async function createAdmins() {
  console.log("Seeding admins...");
  const admin = await ensureUser({
    name: "System Administrator",
    email: env.ADMIN_EMAIL || "admin@moveinn.com",
    password: env.ADMIN_PASSWORD || "Admin123!",
    user_type: "admin",
    isEmailVerified: true,
    status: "active",
    isVerified: true,
    language_preference: "english",
  });

  const superAdmin = await ensureUser({
    name: "Super Administrator",
    email: env.SUPER_ADMIN_EMAIL || "superadmin@moveinn.com",
    password: env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!",
    user_type: "super_admin",
    isEmailVerified: true,
    status: "active",
    isVerified: true,
    language_preference: "english",
  });

  console.log(`Admin: ${admin.email}`);
  console.log(`Super Admin: ${superAdmin.email}`);
  return { admin, superAdmin };
}

async function createPartnerUniversities() {
  console.log("Seeding partner universities...");

  const adminUsers = await Promise.all([
    ensureUser({
      name: "Harvard Admin",
      email: "admin@harvard.edu",
      password: "Harvard123!",
      user_type: "university_admin",
      isEmailVerified: true,
      status: "active",
      language_preference: "english",
    }),
    ensureUser({
      name: "MIT Admin",
      email: "admin@mit.edu",
      password: "MIT123!",
      user_type: "university_admin",
      isEmailVerified: true,
      status: "active",
      language_preference: "english",
    }),
    ensureUser({
      name: "Stanford Admin",
      email: "admin@stanford.edu",
      password: "Stanford123!",
      user_type: "university_admin",
      isEmailVerified: true,
      status: "active",
      language_preference: "english",
    }),
    ensureUser({
      name: "UCLA Admin",
      email: "admin@ucla.edu",
      password: "UCLA123!",
      user_type: "university_admin",
      isEmailVerified: true,
      status: "active",
      language_preference: "english",
    }),
    ensureUser({
      name: "NYU Admin",
      email: "admin@nyu.edu",
      password: "NYU123!",
      user_type: "university_admin",
      isEmailVerified: true,
      status: "active",
      language_preference: "english",
    }),
  ]);

  const universities = await Promise.all([
    ensureUniversity({
      name: "Harvard University",
      domain: "harvard.edu",
      admin_user_id: adminUsers[0]._id,
      contact_email: "partnerships@harvard.edu",
      contact_phone: "+1-617-495-1000",
      subscription_status: "active",
      monthly_fee: 99.0,
      discount_percentage: 15.0,
      total_students: 0,
      is_active: true,
    }),
    ensureUniversity({
      name: "Massachusetts Institute of Technology",
      domain: "mit.edu",
      admin_user_id: adminUsers[1]._id,
      contact_email: "partnerships@mit.edu",
      contact_phone: "+1-617-253-1000",
      subscription_status: "active",
      monthly_fee: 99.0,
      discount_percentage: 15.0,
      total_students: 0,
      is_active: true,
    }),
    ensureUniversity({
      name: "Stanford University",
      domain: "stanford.edu",
      admin_user_id: adminUsers[2]._id,
      contact_email: "partnerships@stanford.edu",
      contact_phone: "+1-650-723-2300",
      subscription_status: "active",
      monthly_fee: 99.0,
      discount_percentage: 15.0,
      total_students: 0,
      is_active: true,
    }),
    ensureUniversity({
      name: "University of California, Los Angeles",
      domain: "ucla.edu",
      admin_user_id: adminUsers[3]._id,
      contact_email: "partnerships@ucla.edu",
      contact_phone: "+1-310-825-4321",
      subscription_status: "trial",
      monthly_fee: 99.0,
      discount_percentage: 15.0,
      total_students: 0,
      is_active: true,
    }),
    ensureUniversity({
      name: "New York University",
      domain: "nyu.edu",
      admin_user_id: adminUsers[4]._id,
      contact_email: "partnerships@nyu.edu",
      contact_phone: "+1-212-998-1212",
      subscription_status: "active",
      monthly_fee: 99.0,
      discount_percentage: 20.0,
      total_students: 0,
      is_active: true,
    }),
  ]);

  console.log(`Universities: ${universities.length}`);
  return universities;
}

async function createSampleData(universities) {
  console.log("Seeding development sample data...");

  // tenants
  const tenantUsers = await User.create([
    {
      name: "John Smith",
      email: "john.smith@harvard.edu",
      password: "password123",
      user_type: "tenant",
      phone: "+1234567890",
      date_of_birth: new Date("2000-05-15"),
      gender: "male",
      occupation: "Student",
      isEmailVerified: true,
      status: "active",
      language_preference: "english",
      university_id: universities[0]._id,
    },
    {
      name: "Emma Johnson",
      email: "emma.johnson@mit.edu",
      password: "password123",
      user_type: "tenant",
      phone: "+1234567891",
      date_of_birth: new Date("1999-08-22"),
      gender: "female",
      occupation: "Student",
      isEmailVerified: true,
      status: "active",
      language_preference: "english",
      university_id: universities[1]._id,
    },
    {
      name: "Michael Chen",
      email: "michael.chen@stanford.edu",
      password: "password123",
      user_type: "tenant",
      phone: "+1234567892",
      date_of_birth: new Date("2001-03-10"),
      gender: "male",
      occupation: "Student",
      isEmailVerified: true,
      status: "active",
      language_preference: "chinese",
      university_id: universities[2]._id,
    },
    {
      name: "Sarah Wilson",
      email: "sarah.wilson@gmail.com",
      password: "password123",
      user_type: "tenant",
      phone: "+1234567893",
      date_of_birth: new Date("1995-12-05"),
      gender: "female",
      occupation: "Software Engineer",
      isEmailVerified: true,
      status: "active",
      language_preference: "english",
    },
    {
      name: "David Rodriguez",
      email: "david.rodriguez@ucla.edu",
      password: "password123",
      user_type: "tenant",
      phone: "+1234567894",
      date_of_birth: new Date("2000-11-18"),
      gender: "male",
      occupation: "Student",
      isEmailVerified: true,
      status: "active",
      language_preference: "english",
      university_id: universities[3]._id,
    },
  ]);

  // landlords
  const landlordUsers = await User.create([
    {
      name: "Robert Thompson",
      email: "robert.thompson@gmail.com",
      password: "password123",
      user_type: "landlord",
      phone: "+1555123456",
      date_of_birth: new Date("1975-04-20"),
      gender: "male",
      occupation: "Real Estate Investor",
      isEmailVerified: true,
      status: "active",
      isVerified: true,
      language_preference: "english",
      verificationBadges: {
        identity_verification: true,
        background_check: true,
      },
    },
    {
      name: "Lisa Martinez",
      email: "lisa.martinez@gmail.com",
      password: "password123",
      user_type: "landlord",
      phone: "+1555123457",
      date_of_birth: new Date("1980-09-12"),
      gender: "female",
      occupation: "Property Manager",
      isEmailVerified: true,
      status: "active",
      isVerified: true,
      language_preference: "english",
      verificationBadges: {
        identity_verification: true,
      },
    },
  ]);

  // agency
  const agencyUsers = await User.create([
    {
      name: "Property Plus Agency",
      email: "admin@propertyplus.com",
      password: "password123",
      user_type: "agency",
      phone: "+1555987654",
      occupation: "Property Management",
      isEmailVerified: true,
      status: "active",
      isVerified: true,
      language_preference: "english",
    },
  ]);

  // university students
  const universityStudents = await UniversityStudent.create([
    {
      user_id: tenantUsers[0]._id,
      university_id: universities[0]._id,
      student_email: "john.smith@harvard.edu",
      student_id: "HS2024001",
      major: "Computer Science",
      graduation_year: 2024,
      is_verified: true,
      verification_method: "email_domain",
      discount_eligible: true,
      is_active: true,
    },
    {
      user_id: tenantUsers[1]._id,
      university_id: universities[1]._id,
      student_email: "emma.johnson@mit.edu",
      student_id: "MIT2025002",
      major: "Electrical Engineering",
      graduation_year: 2025,
      is_verified: true,
      verification_method: "email_domain",
      discount_eligible: true,
      is_active: true,
    },
    {
      user_id: tenantUsers[2]._id,
      university_id: universities[2]._id,
      student_email: "michael.chen@stanford.edu",
      student_id: "SU2023003",
      major: "Business Administration",
      graduation_year: 2023,
      is_verified: true,
      verification_method: "email_domain",
      discount_eligible: true,
      is_active: true,
    },
    {
      user_id: tenantUsers[4]._id,
      university_id: universities[3]._id,
      student_email: "david.rodriguez@ucla.edu",
      student_id: "UCLA2024004",
      major: "Psychology",
      graduation_year: 2024,
      is_verified: true,
      verification_method: "email_domain",
      discount_eligible: true,
      is_active: true,
    },
  ]);

  await University.findByIdAndUpdate(universities[0]._id, { total_students: 1 });
  await University.findByIdAndUpdate(universities[1]._id, { total_students: 1 });
  await University.findByIdAndUpdate(universities[2]._id, { total_students: 1 });
  await University.findByIdAndUpdate(universities[3]._id, { total_students: 1 });

  // background checks
  const backgroundChecks = await BackgroundCheck.create([
    {
      user_id: landlordUsers[0]._id,
      check_type: "background",
      amount_paid: 24.99,
      certn_order_id: "CERTN_001_SAMPLE",
      status: "completed",
      overall_result: "pass",
      badge_awarded: true,
      badge_type: "background_verified",
      results: {
        criminal_record: {
          has_records: false,
          records_count: 0,
          severity_level: "none",
        },
      },
      completed_at: new Date(),
    },
    {
      user_id: tenantUsers[0]._id,
      check_type: "social_credit",
      amount_paid: 21.99,
      certn_order_id: "CERTN_002_SAMPLE",
      status: "completed",
      overall_result: "pass",
      badge_awarded: true,
      badge_type: "social_credit_verified",
      results: {
        social_credit: {
          social_score: 85,
          factors: {
            rental_history: 90,
            financial_responsibility: 85,
            social_references: 80,
          },
        },
      },
      completed_at: new Date(),
    },
  ]);

  // onboarding progress
  const onboardingProgresses = [];
  const completedUsers = [tenantUsers[0], tenantUsers[1], landlordUsers[0]];
  for (const user of completedUsers) {
    onboardingProgresses.push(
      await OnboardingProgress.create({
        user_id: user._id,
        user_type: user.user_type,
        current_step: "completed",
        completion_percentage: 100,
        steps_completed: [
          { step_name: "email_verification", completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          { step_name: "basic_profile", completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
          {
            step_name: user.user_type === "tenant" ? "university_verification" : "identity_verification",
            completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
        ],
        steps_required:
          user.user_type === "tenant"
            ? ["email_verification", "basic_profile", "university_verification"]
            : ["email_verification", "basic_profile", "identity_verification"],
        is_completed: true,
        completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        last_activity_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      })
    );
  }

  const partialUsers = [tenantUsers[2], tenantUsers[3], landlordUsers[1]];
  for (const user of partialUsers) {
    onboardingProgresses.push(
      await OnboardingProgress.create({
        user_id: user._id,
        user_type: user.user_type,
        current_step: "basic_profile",
        completion_percentage: 33,
        steps_completed: [{ step_name: "email_verification", completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }],
        steps_required:
          user.user_type === "tenant"
            ? ["email_verification", "basic_profile", "university_verification"]
            : ["email_verification", "basic_profile", "identity_verification"],
        is_completed: false,
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        last_activity_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      })
    );
  }

  // user documents
  const userDocuments = await UserDocument.create([
    {
      user_id: landlordUsers[0]._id,
      document_type: "drivers_license",
      document_name: "Robert Thompson - Driver License",
      file_url: "https://moveinn-storage.s3.amazonaws.com/documents/sample-drivers-license.pdf",
      file_size: 2048576,
      file_type: "pdf",
      status: "approved",
      reviewed_by: null,
      reviewed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      review_notes: "Document verified successfully",
      is_active: true,
    },
    {
      user_id: landlordUsers[1]._id,
      document_type: "identity_card",
      document_name: "Lisa Martinez - ID Card",
      file_url: "https://moveinn-storage.s3.amazonaws.com/documents/sample-id-card.pdf",
      file_size: 1536000,
      file_type: "pdf",
      status: "pending",
      is_active: true,
    },
  ]);

  console.log("Summary:");
  console.log(`  Tenants: ${tenantUsers.length}`);
  console.log(`  Landlords: ${landlordUsers.length}`);
  console.log(`  Agencies: ${agencyUsers.length}`);
  console.log(`  Universities: ${universities.length}`);
  console.log(`  University Students: ${universityStudents.length}`);
  console.log(`  Background Checks: ${backgroundChecks.length}`);
  console.log(`  Documents: ${userDocuments.length}`);
  console.log(`  Onboarding Progress: ${onboardingProgresses.length}`);
}

// ----- main -----
export default async function seedDatabase() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    console.log("Database connected.");

    await clearDatabase();

    const { admin } = await createAdmins();
    const universities = await createPartnerUniversities();

    if (isProd) {
      console.log("Production mode: only admins and universities were seeded.");
      console.log(`Admin email: ${admin.email}`);
    } else {
      await createSampleData(universities);
      console.log("Development mode: full sample data seeded.");
      console.log(`Admin email: ${admin.email}`);
    }
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

seedDatabase();

