
## **🏠 Property Schema Design**

Based on your monetization plan and onboarding flow, here's the **minimal but flexible** Property schema:

### **Property Model**
```javascript
// models/Property.js
{
  // Basic Property Info
  landlord_id: ObjectId, // Reference to User (landlord)
  title: String, // "Beautiful 2BR Downtown Apartment"
  description: String, // Detailed description
  
  // Location
  address: {
    street: String,
    city: String,
    state: String,
    zip_code: String,
    country: String // Default: 'US'
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  
  // Property Details
  property_type: String, // 'apartment', 'house', 'room', 'studio', 'condo'
  bedrooms: Number,
  bathrooms: Number,
  square_feet: Number,
  furnished: Boolean,
  
  // Rules & Preferences
  pets_allowed: Boolean,
  smoking_allowed: Boolean,
  gender_preference: String, // 'male', 'female', 'any', 'couples'
  
  // Media & Features
  images: [String], // Array of image URLs
  virtual_tour_url: String,
  amenities: [String], // ['parking', 'gym', 'pool', 'laundry', 'wifi']
  
  // Status
  is_active: Boolean, // Can create listings for this property
  is_rented: Boolean, // Triggers landlord monthly subscription
  current_tenant_id: ObjectId, // Reference to current tenant
  
  // Timestamps
  created_at: Date,
  updated_at: Date
}
```

### **Listing Model** (Property + Pricing + Duration)
```javascript
// models/Listing.js
{
  // Property Reference
  property_id: ObjectId, // Reference to Property
  landlord_id: ObjectId, // Reference to User (for easy queries)
  
  // Listing Type & Pricing
  listing_type: String, // 'basic', 'premium'
  monthly_rent: Number, // In cents (250000 = $2500)
  security_deposit: Number, // In cents
  utilities_included: Boolean,
  
  // Lease Terms
  lease_duration_months: Number, // 6, 12, 24
  available_from: Date,
  move_in_flexibility: String, // 'exact_date', 'flexible', 'asap'
  
  // Listing Management
  listing_fee_paid: Number, // 1999 ($19.99) or 4999 ($49.99)
  listing_duration_days: Number, // 30 or 60 days
  expires_at: Date,
  
  // Boost & Visibility
  is_boosted: Boolean,
  boost_expires_at: Date, // For $9.99 boost (7 days)
  
  // Analytics
  views_count: Number,
  inquiries_count: Number,
  applications_count: Number,
  
  // Status
  status: String, // 'draft', 'pending_payment', 'active', 'expired', 'rented', 'paused'
  admin_approved: Boolean,
  rejection_reason: String,
  
  // Related Transactions
  listing_fee_transaction_id: ObjectId, // Reference to Transaction
  boost_transaction_id: ObjectId,
  
  created_at: Date,
  updated_at: Date
}
```

## **🔄 Property-Listing Flow Integration**

### **1. Property Creation (Free)**
```javascript
// After landlord onboarding
POST /api/properties
{
  title: "2BR Downtown Apt",
  address: {...},
  bedrooms: 2,
  bathrooms: 1,
  // ... other property details
}
// → Creates Property record (is_active: true, is_rented: false)
```

### **2. Listing Creation (Requires Payment)**
```javascript
// Landlord creates listing for their property
POST /api/listings
{
  property_id: "prop_123",
  listing_type: "premium", // $49.99
  monthly_rent: 250000, // $2500
  lease_duration_months: 12,
  available_from: "2025-09-01"
}
// → Creates Listing record (status: 'pending_payment')
// → Redirects to payment flow
```

### **3. Payment Flow**
```javascript
// Pay listing fee
POST /api/payments/listing-fee
{
  listing_id: "listing_123",
  listing_type: "premium" // $49.99 for 60 days
}
// → Processes payment
// → Updates listing (status: 'active', expires_at: +60 days)
```

### **4. Property Gets Rented (Triggers Monthly Subscription)**
```javascript
// Landlord marks property as rented
PUT /api/properties/{id}/rent-status
{
  is_rented: true,
  current_tenant_id: "tenant_123"
}
// → Updates Property (is_rented: true)
// → Creates LandlordSubscription ($9.99/month)
// → Updates related Listing (status: 'rented')
```

## **💡 Key Design Benefits**

### **Separation of Concerns:**
- **Property** = Physical asset (created once, reused)
- **Listing** = Marketing campaign (paid, time-limited)

### **Monetization Integration:**
- ✅ **Listing Fees**: Tied to Listing model with payment tracking
- ✅ **Monthly Subscription**: Triggered by Property.is_rented status
- ✅ **Listing Boost**: Tracked in Listing model with expiry
- ✅ **Analytics**: Built into Listing for performance tracking

### **Business Logic Support:**
- ✅ **Multiple Listings**: One property can have multiple listings over time
- ✅ **Reactivation**: Property can be re-listed when tenant moves out
- ✅ **Subscription Management**: Monthly billing tied to actual rental status
- ✅ **Payment Tracking**: All fees linked to specific transactions

### **Query Efficiency:**
```javascript
// Find active listings in area
Listing.find({ status: 'active', expires_at: { $gt: new Date() } })

// Find rented properties for subscription billing
Property.find({ is_rented: true, landlord_id: landlord_id })

// Find properties needing subscription setup
Property.find({ is_rented: true, landlord_id: landlord_id })
  .populate('landlord_subscriptions')
```

**Does this Property + Listing structure make sense for your monetization flow? Should I proceed with creating the Mongoose models?**














## **🏢 Agency Property Management Flow**

Great question! Agencies have a **different flow** because they manage properties for **multiple landlords**. Here's how it works:

## **🔄 Agency vs Individual Landlord Flow**

### **Individual Landlord Flow:**
```
Landlord → Owns Property → Creates Listing → Pays $19.99/$49.99 → Gets Rented → Pays $9.99/month
```

### **Agency Flow:**
```
Agency → Pays $299/month → Manages Multiple Properties → Unlimited Listings → No Per-Listing Fees
   ↓                           ↓                            ↓
Sub-accounts (up to 5) → Properties from Different → All Listings Included
                         Property Owners            in Monthly Package
```

## **🗄️ Updated Schema Design**

### **1. Property Model Enhancement**
```javascript
// models/Property.js
{
  // Property Ownership
  landlord_id: ObjectId, // Reference to User (property owner)
  managed_by_agency_id: ObjectId, // Reference to User (agency) - NULL for individual landlords
  listing_agent_id: ObjectId, // Reference to User (specific agent) - NULL for individual landlords
  
  // Management Agreement
  management_type: String, // 'self_managed', 'agency_managed'
  management_fee_percentage: Number, // Agency commission (e.g., 10%)
  management_start_date: Date,
  management_end_date: Date,
  
  // Rest of property fields...
  title: String,
  address: {...},
  property_type: String,
  // ... existing fields
}
```

### **2. Listing Model Enhancement**
```javascript
// models/Listing.js
{
  // Property & Management
  property_id: ObjectId,
  landlord_id: ObjectId, // Property owner
  managed_by_agency_id: ObjectId, // Agency managing this listing (NULL for individuals)
  created_by_user_id: ObjectId, // Who actually created the listing (agent or landlord)
  
  // Payment Logic
  listing_fee_paid: Number, // 0 for agency listings, 1999/4999 for individual landlords
  is_agency_listing: Boolean, // True = no listing fees, False = pay per listing
  
  // Rest of listing fields...
  monthly_rent: Number,
  listing_type: String,
  // ... existing fields
}
```

### **3. Agency Sub-Account Model**
```javascript
// models/AgencySubAccount.js
{
  agency_subscription_id: ObjectId, // Reference to main agency subscription
  sub_user_id: ObjectId, // Reference to User (the agent)
  role: String, // 'agent', 'manager', 'viewer'
  permissions: {
    create_listings: Boolean,
    manage_properties: Boolean,
    view_analytics: Boolean,
    manage_tenants: Boolean
  },
  is_active: Boolean,
  created_at: Date
}
```

## **🎯 Agency Property Management Flow**

### **Step 1: Agency Setup** (After Onboarding)
```javascript
// Agency pays $299/month subscription
POST /api/subscriptions/agency
{
  company_name: "ABC Real Estate",
  monthly_fee: 29900 // $299
}
// → Creates AgencySubscription
// → Unlocks unlimited listings
```

### **Step 2: Add Sub-Accounts** (Optional)
```javascript
// Create agent accounts (up to 5)
POST /api/agency/sub-accounts
{
  agent_email: "john@abcrealestate.com",
  role: "agent",
  permissions: {
    create_listings: true,
    manage_properties: true
  }
}
// → Creates User with user_type: 'agency_sub_account'
// → Links to main agency subscription
```

### **Step 3: Add Properties to Manage**
```javascript
// Agency adds properties they manage
POST /api/properties
{
  title: "Client's Downtown Condo",
  landlord_id: "actual_property_owner_id",
  managed_by_agency_id: "agency_user_id",
  management_type: "agency_managed",
  management_fee_percentage: 10,
  // ... property details
}
// → Creates Property with agency management
```

### **Step 4: Create Unlimited Listings**
```javascript
// No payment required for agency listings
POST /api/listings
{
  property_id: "prop_123",
  listing_type: "premium", // FREE for agencies
  monthly_rent: 300000,
  managed_by_agency_id: "agency_user_id",
  created_by_user_id: "agent_user_id" // Which agent created it
}
// → Creates Listing (is_agency_listing: true, listing_fee_paid: 0)
// → Goes live immediately (no payment required)
```

## **💰 Revenue Flow Differences**

### **Individual Landlords:**
- ✅ Pay $19.99/$49.99 per listing
- ✅ Pay $9.99/month after property is rented
- ✅ Limited to their own properties

### **Agencies:**
- ✅ Pay $299/month flat rate
- ✅ Unlimited listings (no per-listing fees)
- ✅ Manage multiple properties for different owners
- ✅ Up to 5 sub-accounts included
- ✅ Advanced analytics dashboard

## **🔍 Database Queries**

### **Find Agency Properties:**
```javascript
// All properties managed by an agency
Property.find({ managed_by_agency_id: agency_id })

// All listings created by agency
Listing.find({ managed_by_agency_id: agency_id })

// Properties managed by specific agent
Listing.find({ created_by_user_id: agent_id })
```

### **Agency Dashboard Analytics:**
```javascript
// Total properties under management
Property.countDocuments({ managed_by_agency_id: agency_id })

// Active listings performance
Listing.find({ 
  managed_by_agency_id: agency_id, 
  status: 'active' 
}).select('views_count inquiries_count monthly_rent')
```

## **🎯 Key Benefits of This Approach:**

1. **Flexible Property Ownership** - Properties can be self-managed or agency-managed
2. **No Double Payment** - Agencies don't pay listing fees on top of $299/month
3. **Sub-Account Management** - Agents can create listings under agency umbrella
4. **Revenue Tracking** - Clear separation between agency and individual revenue
5. **Scalable** - Easy to add white-label features later

**Does this agency property management structure make sense? Should I proceed with implementing these enhanced models?**