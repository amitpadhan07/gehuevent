const mongoose = require('mongoose');
const { Schema } = mongoose;

// -----------------------------------------------------------------------------
// 1. USERS
// -----------------------------------------------------------------------------
const UserSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    index: true 
  },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },
  rollNumber: { type: String, trim: true, index: true },
  branch: { type: String, trim: true },
  year: { type: Number },
  role: {
    type: String,
    enum: ['student', 'chairperson', 'admin'],
    default: 'student'
  },
  profilePictureUrl: { type: String },
  phone: { type: String, trim: true },
  emailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  
  // Embedded Club Memberships (Replacing the 'club_members' join table)
  // Allows O(1) access to "Which clubs do I manage/belong to?"
  clubMemberships: [{
    clubId: { type: Schema.Types.ObjectId, ref: 'Club' },
    role: { type: String }, // e.g., 'chairperson', 'member', 'logistics_head'
    joinedAt: { type: Date, default: Date.now }
  }]
}, { 
  timestamps: true // Automatically manages createdAt and updatedAt
});

// -----------------------------------------------------------------------------
// 2. CLUBS
// -----------------------------------------------------------------------------
const ClubSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String },
  assets: {
    logoUrl: { type: String },
    bannerUrl: { type: String }
  },
  contact: {
    websiteUrl: { type: String },
    email: { type: String },
    phone: { type: String }
  },
  isActive: { type: Boolean, default: true },
  
  // Optimization: Cached count of members to avoid expensive count queries
  memberCount: { type: Number, default: 0 } 
}, { 
  timestamps: true 
});

// -----------------------------------------------------------------------------
// 3. EVENTS
// -----------------------------------------------------------------------------
const EventSchema = new Schema({
  clubId: { type: Schema.Types.ObjectId, ref: 'Club', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  eventType: {
    type: String,
    enum: ['seminar', 'workshop', 'hackathon', 'competition', 'festival', 'lecture', 'other'],
    default: 'other'
  },
  posterUrl: { type: String },
  
  location: {
    venueAddress: { type: String },
    isOnline: { type: Boolean, default: false },
    onlineLink: { type: String },
    coordinates: { // Useful for map features later
      lat: Number,
      long: Number
    }
  },

  schedule: {
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date },
    registrationOpen: { type: Date },
    registrationClose: { type: Date }
  },

  capacity: {
    max: { type: Number },
    registeredCount: { type: Number, default: 0 } // Auto-incremented on registration
  },

  isPublished: { type: Boolean, default: false, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true 
});

// -----------------------------------------------------------------------------
// 4. REGISTRATIONS
// (Merges: event_registrations + attendance_logs + certificates)
// -----------------------------------------------------------------------------
const RegistrationSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  // Snapshot of user details at time of registration (Read Optimization)
  // Prevents needing to populate/join the User collection for simple attendee lists
  userSnapshot: {
    fullName: { type: String },
    rollNumber: { type: String },
    email: { type: String }
  },

  qrCode: {
    token: { type: String, index: true, unique: true, sparse: true },
    data: { type: String }
  },

  // Status Workflow
  status: { 
    type: String, 
    enum: ['registered', 'cancelled', 'attended'],
    default: 'registered' 
  },
  cancelledAt: { type: Date },

  attendance: {
    isMarked: { type: Boolean, default: false },
    currentStatus: { type: String, enum: ['present', 'absent', 'late', 'excused'] },
    
    // The history log is embedded here (formerly 'attendance_logs' table)
    logs: [{
      markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      markedAt: { type: Date, default: Date.now },
      status: { type: String },
      location: { lat: Number, long: Number },
      notes: String
    }]
  },

  feedback: {
    comment: String,
    rating: { type: Number, min: 1, max: 5 },
    submittedAt: Date
  },

  // Certificate details embedded here (formerly 'certificates' table)
  certificate: {
    isIssued: { type: Boolean, default: false },
    url: { type: String },
    number: { type: String, unique: true, sparse: true }, // sparse allows multiple nulls
    issuedAt: { type: Date }
  }
}, { 
  timestamps: true 
});

// Ensure a user can only register for an event once
RegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

// -----------------------------------------------------------------------------
// 5. EMAIL TEMPLATES
// -----------------------------------------------------------------------------
const EmailTemplateSchema = new Schema({
  name: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  htmlContent: { type: String, required: true },
  variables: [String] // List of expected {{variables}} for validation
}, { 
  timestamps: true 
});

// -----------------------------------------------------------------------------
// 6. AUDIT LOGS
// -----------------------------------------------------------------------------
const AuditLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true }, // e.g., 'UPDATE_EVENT', 'DELETE_USER'
  
  target: {
    entityType: { type: String }, // e.g., 'Event'
    entityId: { type: Schema.Types.ObjectId },
    entityName: { type: String } // Human readable identifier for the UI logs
  },
  
  changes: { type: Map, of: Schema.Types.Mixed }, // Flexible JSON for before/after
  
  meta: {
    ipAddress: { type: String },
    userAgent: { type: String }
  }
}, { 
  timestamps: true,
  expireAfterSeconds: 31536000 // Optional: TTL index to auto-delete logs after 1 year
});

// -----------------------------------------------------------------------------
// EXPORTS
// -----------------------------------------------------------------------------
const User = mongoose.model('User', UserSchema);
const Club = mongoose.model('Club', ClubSchema);
const Event = mongoose.model('Event', EventSchema);
const Registration = mongoose.model('Registration', RegistrationSchema);
const EmailTemplate = mongoose.model('EmailTemplate', EmailTemplateSchema);
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

module.exports = {
  User,
  Club,
  Event,
  Registration,
  EmailTemplate,
  AuditLog
};