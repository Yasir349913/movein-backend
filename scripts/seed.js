// scripts/seed.js - Moveinn Rental Platform Seed Data
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { 
  User, University, UniversityStudent, BackgroundCheck, 
  UserDocument, OnboardingProgress
} from '../models/index.js';

// Main database seeding function
async function seedDatabase() {
  try {
    // First establish the database connection
    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected successfully');

    console.log('🌱 Starting database seeding...');

    // Clear existing data (except configuration)
    await clearDatabase();

    // Create admin users
    const admin = await createAdminUsers();
    console.log('👨‍💼 Admin users created');

    // Create partner universities
    const universities = await createPartnerUniversities();
    console.log('🏫 Partner universities created');

    if (process.env.NODE_ENV === 'production') {
      console.log('🚀 Production environment detected. Only admin users and universities seeded.');
      console.log(`\n📋 Admin credentials:\nEmail: ${admin.email}\nPassword: ${process.env.ADMIN_PASSWORD}\n`);
      await mongoose.disconnect();
      console.log('🔌 MongoDB disconnected');
      return;
    }

    // Development environment - create sample data
    console.log('🔧 Development environment - creating sample data...');
    await createSampleData(universities);

    console.log('🎉 Database seeding completed successfully!');
    console.log(`\n📋 Admin credentials:\nEmail: ${admin.email}\nPassword: ${process.env.ADMIN_PASSWORD}\n`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Clear existing data (keep configuration in production)
async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  
  await Promise.all([
    User.deleteMany({}),
    University.deleteMany({}),
    UniversityStudent.deleteMany({}),
    BackgroundCheck.deleteMany({}),
    UserDocument.deleteMany({}),
    OnboardingProgress.deleteMany({})
  ]);
  
  console.log('✅ Database cleared');
}

// Create admin users
async function createAdminUsers() {
  console.log('👨‍💼 Creating admin users...');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@moveinn.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  const admin = await User.create({
    name: 'System Administrator',
    email: adminEmail,
    password: adminPassword,
    user_type: 'admin',
    isEmailVerified: true,
    status: 'active',
    isVerified: true,
    language_preference: 'english'
  });

  // Create super admin
  const superAdmin = await User.create({
    name: 'Super Administrator',
    email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@moveinn.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!',
    user_type: 'super_admin',
    isEmailVerified: true,
    status: 'active',
    isVerified: true,
    language_preference: 'english'
  });

  console.log(`✅ Admin created with email: ${admin.email}`);
  console.log(`✅ Super Admin created with email: ${superAdmin.email}`);
  
  return admin;
}

// Create partner universities
async function createPartnerUniversities() {
  console.log('🏫 Creating partner universities...');

  // Create university admin users first
  const universityAdmins = await User.create([
    {
      name: 'Harvard Admin',
      email: 'admin@harvard.edu',
      password: 'Harvard123!',
      user_type: 'university_admin',
      isEmailVerified: true,
      status: 'active',
      language_preference: 'english'
    },
    {
      name: 'MIT Admin',
      email: 'admin@mit.edu',
      password: 'MIT123!',
      user_type: 'university_admin',
      isEmailVerified: true,
      status: 'active',
      language_preference: 'english'
    },
    {
      name: 'Stanford Admin',
      email: 'admin@stanford.edu',
      password: 'Stanford123!',
      user_type: 'university_admin',
      isEmailVerified: true,
      status: 'active',
      language_preference: 'english'
    },
    {
      name: 'UCLA Admin',
      email: 'admin@ucla.edu',
      password: 'UCLA123!',
      user_type: 'university_admin',
      isEmailVerified: true,
      status: 'active',
      language_preference: 'english'
    },
    {
      name: 'NYU Admin',
      email: 'admin@nyu.edu',
      password: 'NYU123!',
      user_type: 'university_admin',
      isEmailVerified: true,
      status: 'active',
      language_preference: 'english'
    }
  ]);

  // Create universities
  const universities = await University.create([
    {
      name: 'Harvard University',
      domain: 'harvard.edu',
      admin_user_id: universityAdmins[0]._id,
      contact_email: 'partnerships@harvard.edu',
      contact_phone: '+1-617-495-1000',
      subscription_status: 'active',
      monthly_fee: 99.00,
      discount_percentage: 15.00,
      total_students: 0,
      is_active: true
    },
    {
      name: 'Massachusetts Institute of Technology',
      domain: 'mit.edu',
      admin_user_id: universityAdmins[1]._id,
      contact_email: 'partnerships@mit.edu',
      contact_phone: '+1-617-253-1000',
      subscription_status: 'active',
      monthly_fee: 99.00,
      discount_percentage: 15.00,
      total_students: 0,
      is_active: true
    },
    {
      name: 'Stanford University',
      domain: 'stanford.edu',
      admin_user_id: universityAdmins[2]._id,
      contact_email: 'partnerships@stanford.edu',
      contact_phone: '+1-650-723-2300',
      subscription_status: 'active',
      monthly_fee: 99.00,
      discount_percentage: 15.00,
      total_students: 0,
      is_active: true
    },
    {
      name: 'University of California, Los Angeles',
      domain: 'ucla.edu',
      admin_user_id: universityAdmins[3]._id,
      contact_email: 'partnerships@ucla.edu',
      contact_phone: '+1-310-825-4321',
      subscription_status: 'trial',
      monthly_fee: 99.00,
      discount_percentage: 15.00,
      total_students: 0,
      is_active: true
    },
    {
      name: 'New York University',
      domain: 'nyu.edu',
      admin_user_id: universityAdmins[4]._id,
      contact_email: 'partnerships@nyu.edu',
      contact_phone: '+1-212-998-1212',
      subscription_status: 'active',
      monthly_fee: 99.00,
      discount_percentage: 20.00, // Special discount
      total_students: 0,
      is_active: true
    }
  ]);

  console.log(`✅ Created ${universities.length} partner universities`);
  return universities;
}

// Create sample data for development
async function createSampleData(universities) {
  console.log('📝 Creating sample development data...');

  // Create sample tenant users (students and non-students)
  const tenantUsers = await User.create([
    {
      name: 'John Smith',
      email: 'john.smith@harvard.edu',
      password: 'password123',
      user_type: 'tenant',
      phone: '+1234567890',
      date_of_birth: new Date('2000-05-15'),
      gender: 'male',
      occupation: 'Student',
      isEmailVerified: true,
      status: 'active',
      language_preference: 'english',
      university_id: universities[0]._id
    },
    {
      name: 'Emma Johnson',
      email: 'emma.johnson@mit.edu',
      password: 'password123',
      user_type: 'tenant',
      phone: '+1234567891',
      date_of_birth: new Date('1999-08-22'),
      gender: 'female',
      occupation: 'Student',
      isEmailVerified: true,
      status: 'active',
      language_preference: 'english',
      university_id: universities[1]._id
    },
    {
      name: 'Michael Chen',
      email: 'michael.chen@stanford.edu',
      password: 'password123',
      user_type: 'tenant',
      phone: '+1234567892',
      date_of_birth: new Date('2001-03-10'),
      gender: 'male',
      occupation: 'Student',
      isEmailVerified: true,
      status: 'active',
      language_preference: 'chinese',
      university_id: universities[2]._id
    },
    {
      name: 'Sarah Wilson',
      email: 'sarah.wilson@gmail.com',
      password: 'password123',
      user_type: 'tenant',
      phone: '+1234567893',
      date_of_birth: new Date('1995-12-05'),
      gender: 'female',
      occupation: 'Software Engineer',
      isEmailVerified: true,
      status: 'active',
      language_preference: 'english'
    },
    {
      name: 'David Rodriguez',
      email: 'david.rodriguez@ucla.edu',
      password: 'password123',
      user_type: 'tenant',
      phone: '+1234567894',
      date_of_birth: new Date('2000-11-18'),
      gender: 'male',
      occupation: 'Student',
      isEmailVerified: true,
      status: 'active',
      language_preference: 'english',
      university_id: universities[3]._id
    }
  ]);

  // Create sample landlord users
  const landlordUsers = await User.create([
    {
      name: 'Robert Thompson',
      email: 'robert.thompson@gmail.com',
      password: 'password123',
      user_type: 'landlord',
      phone: '+1555123456',
      date_of_birth: new Date('1975-04-20'),
      gender: 'male',
      occupation: 'Real Estate Investor',
      isEmailVerified: true,
      status: 'active',
      isVerified: true,
      language_preference: 'english',
      verificationBadges: {
        identity_verification: true,
        background_check: true
      }
    },
    {
      name: 'Lisa Martinez',
      email: 'lisa.martinez@gmail.com',
      password: 'password123',
      user_type: 'landlord',
      phone: '+1555123457',
      date_of_birth: new Date('1980-09-12'),
      gender: 'female',
      occupation: 'Property Manager',
      isEmailVerified: true,
      status: 'active',
      isVerified: true,
      language_preference: 'english',
      verificationBadges: {
        identity_verification: true
      }
    }
  ]);

  // Create sample agency user
  const agencyUsers = await User.create([
    {
      name: 'Property Plus Agency',
      email: 'admin@propertyplus.com',
      password: 'password123',
      user_type: 'agency',
      phone: '+1555987654',
      occupation: 'Property Management',
      isEmailVerified: true,
      status: 'active',
      isVerified: true,
      language_preference: 'english'
    }
  ]);

  console.log(`✅ Created ${tenantUsers.length} tenant users`);
  console.log(`✅ Created ${landlordUsers.length} landlord users`);
  console.log(`✅ Created ${agencyUsers.length} agency users`);

  // Create university student records for student users
  const universityStudents = [];
  
  // Harvard student
  universityStudents.push(await UniversityStudent.create({
    user_id: tenantUsers[0]._id,
    university_id: universities[0]._id,
    student_email: 'john.smith@harvard.edu',
    student_id: 'HS2024001',
    major: 'Computer Science',
    graduation_year: 2024,
    is_verified: true,
    verification_method: 'email_domain',
    discount_eligible: true,
    is_active: true
  }));

  // MIT student
  universityStudents.push(await UniversityStudent.create({
    user_id: tenantUsers[1]._id,
    university_id: universities[1]._id,
    student_email: 'emma.johnson@mit.edu',
    student_id: 'MIT2025002',
    major: 'Electrical Engineering',
    graduation_year: 2025,
    is_verified: true,
    verification_method: 'email_domain',
    discount_eligible: true,
    is_active: true
  }));

  // Stanford student
  universityStudents.push(await UniversityStudent.create({
    user_id: tenantUsers[2]._id,
    university_id: universities[2]._id,
    student_email: 'michael.chen@stanford.edu',
    student_id: 'SU2023003',
    major: 'Business Administration',
    graduation_year: 2023,
    is_verified: true,
    verification_method: 'email_domain',
    discount_eligible: true,
    is_active: true
  }));

  // UCLA student
  universityStudents.push(await UniversityStudent.create({
    user_id: tenantUsers[4]._id,
    university_id: universities[3]._id,
    student_email: 'david.rodriguez@ucla.edu',
    student_id: 'UCLA2024004',
    major: 'Psychology',
    graduation_year: 2024,
    is_verified: true,
    verification_method: 'email_domain',
    discount_eligible: true,
    is_active: true
  }));

  console.log(`✅ Created ${universityStudents.length} university student records`);

  // Update university student counts
  await University.findByIdAndUpdate(universities[0]._id, { total_students: 1 });
  await University.findByIdAndUpdate(universities[1]._id, { total_students: 1 });
  await University.findByIdAndUpdate(universities[2]._id, { total_students: 1 });
  await University.findByIdAndUpdate(universities[3]._id, { total_students: 1 });

  // Create sample background checks
  const backgroundChecks = await BackgroundCheck.create([
    {
      user_id: landlordUsers[0]._id,
      check_type: 'background',
      amount_paid: 24.99,
      certn_order_id: 'CERTN_001_SAMPLE',
      status: 'completed',
      overall_result: 'pass',
      badge_awarded: true,
      badge_type: 'background_verified',
      results: {
        criminal_record: {
          has_records: false,
          records_count: 0,
          severity_level: 'none'
        }
      },
      completed_at: new Date()
    },
    {
      user_id: tenantUsers[0]._id,
      check_type: 'social_credit',
      amount_paid: 21.99,
      certn_order_id: 'CERTN_002_SAMPLE',
      status: 'completed',
      overall_result: 'pass',
      badge_awarded: true,
      badge_type: 'social_approved',
      results: {
        social_credit: {
          social_score: 85,
          factors: {
            rental_history: 90,
            financial_responsibility: 85,
            social_references: 80
          }
        }
      },
      completed_at: new Date()
    }
  ]);

  console.log(`✅ Created ${backgroundChecks.length} background check records`);

  // Create sample onboarding progress records
  const onboardingProgresses = [];

  // Completed onboarding for verified users
  const completedUsers = [tenantUsers[0], tenantUsers[1], landlordUsers[0]];
  for (const user of completedUsers) {
    const progress = await OnboardingProgress.create({
      user_id: user._id,
      user_type: user.user_type,
      current_step: 'completed',
      completion_percentage: 100,
      steps_completed: [
        { step_name: 'email_verification', completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        { step_name: 'basic_profile', completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
        { step_name: user.user_type === 'tenant' ? 'university_verification' : 'identity_verification', completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
      ],
      steps_required: user.user_type === 'tenant' ? 
        ['email_verification', 'basic_profile', 'university_verification'] :
        ['email_verification', 'basic_profile', 'identity_verification'],
      is_completed: true,
      completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      last_activity_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });
    onboardingProgresses.push(progress);
  }

  // Partial onboarding for other users
  const partialUsers = [tenantUsers[2], tenantUsers[3], landlordUsers[1]];
  for (const user of partialUsers) {
    const progress = await OnboardingProgress.create({
      user_id: user._id,
      user_type: user.user_type,
      current_step: 'basic_profile',
      completion_percentage: 33,
      steps_completed: [
        { step_name: 'email_verification', completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
      ],
      steps_required: user.user_type === 'tenant' ? 
        ['email_verification', 'basic_profile', 'university_verification'] :
        ['email_verification', 'basic_profile', 'identity_verification'],
      is_completed: false,
      started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      last_activity_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    });
    onboardingProgresses.push(progress);
  }

  console.log(`✅ Created ${onboardingProgresses.length} onboarding progress records`);

  // Create sample user documents for landlords
  const userDocuments = await UserDocument.create([
    {
      user_id: landlordUsers[0]._id,
      document_type: 'drivers_license',
      document_name: 'Robert Thompson - Driver License',
      file_url: 'https://moveinn-storage.s3.amazonaws.com/documents/sample-drivers-license.pdf',
      file_size: 2048576, // 2MB
      file_type: 'pdf',
      status: 'approved',
      reviewed_by: null, // Would be admin user ID in real scenario
      reviewed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      review_notes: 'Document verified successfully',
      is_active: true
    },
    {
      user_id: landlordUsers[1]._id,
      document_type: 'identity_card',
      document_name: 'Lisa Martinez - ID Card',
      file_url: 'https://moveinn-storage.s3.amazonaws.com/documents/sample-id-card.pdf',
      file_size: 1536000, // 1.5MB
      file_type: 'pdf',
      status: 'pending',
      is_active: true
    }
  ]);

  console.log(`✅ Created ${userDocuments.length} user document records`);

  console.log('\n📊 Sample Data Summary:');
  console.log(`👥 Users: ${tenantUsers.length + landlordUsers.length + agencyUsers.length + 2} (including admins)`);
  console.log(`🏫 Universities: ${universities.length}`);
  console.log(`🎓 University Students: ${universityStudents.length}`);
  console.log(`🔍 Background Checks: ${backgroundChecks.length}`);
  console.log(`📄 Documents: ${userDocuments.length}`);
  console.log(`📈 Onboarding Progress: ${onboardingProgresses.length}`);
}

// Execute the seeding function
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}
seedDatabase();

export default seedDatabase;