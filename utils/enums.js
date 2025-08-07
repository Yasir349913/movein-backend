

const PROPERTY_TYPES = {
    APARTMENT: 'apartment',
    HOUSE: 'house',
    CONDO: 'condo',
    STUDIO: 'studio',
    TOWNHOUSE: 'townhouse',
    BASEMENT: 'basement',
    ROOM: 'room',
    SHARED_ROOM: 'shared_room',
    LOFT: 'loft',
    DUPLEX: 'duplex',
    MOBILE_HOME: 'mobile_home',
    PENTHOUSE: 'penthouse',
    COTTAGE: 'cottage'
};

const PROPERTY_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    RENTED: 'rented',
    SOLD: 'sold'
};
const PLAN_DURATIONS = {
    ONE_TIME: 'one_time',
    MONTHLY: 'monthly',
    YEARLY: 'yearly'
};

const SUBSCRIPTION_STATUS = {
    ACTIVE: 'active',
    CANCELED: 'canceled',
    EXPIRED: 'expired',
    PAST_DUE: 'past_due'
};

const TRANSACTION_TYPES = {
    SUBSCRIPTION: 'subscription',
    PROPERTY_LISTING: 'property_listing'
};

// export {
//     USER_ROLES,
//     USER_STATUS,
//     PROPERTY_TYPES,
//     PROPERTY_STATUS,
//     PLAN_DURATIONS,
//     SUBSCRIPTION_STATUS,
//     TRANSACTION_TYPES
// };


// USER
export const USER_TYPES = [
  'tenant',
  'landlord', 
  'agency',
  'university_admin',
  'bank_partner',
  'admin',
  'super_admin'
];

export const USER_STATUS = [
  'pending',
  'active', 
  'inactive',
  'suspended',
  'banned'
];

export const USER_GENDER = [
  'male',
  'female',
  'other',
  'prefer_not_to_say'
]

// DOCUMENT
export const DOCUMENT_TYPE =[
  'identity_card',
  'passport',
  'drivers_license',  
  'student_id',
  'bank_statement',
  'pay_stub',
  'other'
];
export const DOCUMENT_STATUS = [
  'pending',
  'approved',
  'rejected'
];
