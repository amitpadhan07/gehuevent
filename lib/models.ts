import mongoose from "mongoose";

// ============================================================================
// USER MODEL
// ============================================================================
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    rollNumber: { type: String, trim: true, index: true },
    branch: { type: String, trim: true },
    year: { type: Number },
    role: {
      type: String,
      enum: ["student", "chairperson", "admin"],
      default: "student",
    },
    profilePictureUrl: { type: String },
    phone: { type: String, trim: true },
    emailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    clubMemberships: [
      {
        clubId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Club",
        },
        role: { type: String },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// ============================================================================
// CLUB MODEL
// ============================================================================
const ClubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    assets: {
      logoUrl: { type: String },
      bannerUrl: { type: String },
    },
    contact: {
      websiteUrl: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    isActive: { type: Boolean, default: true },
    memberCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ============================================================================
// EVENT MODEL
// ============================================================================
const EventSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    eventType: {
      type: String,
      enum: ["seminar", "workshop", "hackathon", "competition", "festival", "lecture", "other"],
      default: "other",
    },
    posterUrl: { type: String },
    location: {
      venueAddress: { type: String },
      isOnline: { type: Boolean, default: false },
      onlineLink: { type: String },
      coordinates: {
        lat: Number,
        long: Number,
      },
    },
    schedule: {
      startDate: { type: Date, required: true, index: true },
      endDate: { type: Date },
      registrationOpen: { type: Date },
      registrationClose: { type: Date },
    },
    capacity: {
      max: { type: Number },
      registeredCount: { type: Number, default: 0 },
    },
    isPublished: { type: Boolean, default: false, index: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// ============================================================================
// REGISTRATION MODEL
// ============================================================================
const RegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userSnapshot: {
      fullName: { type: String },
      rollNumber: { type: String },
      email: { type: String },
    },
    qrCode: {
      token: { type: String, index: true, unique: true, sparse: true },
      data: { type: String },
    },
    status: {
      type: String,
      enum: ["registered", "cancelled", "attended"],
      default: "registered",
    },
    cancelledAt: { type: Date },
    attendance: {
      isMarked: { type: Boolean, default: false },
      currentStatus: { type: String, enum: ["present", "absent", "late", "excused"] },
      logs: [
        {
          markedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          markedAt: { type: Date, default: Date.now },
          status: { type: String },
          location: { lat: Number, long: Number },
          notes: String,
        },
      ],
    },
    feedback: {
      comment: String,
      rating: { type: Number, min: 1, max: 5 },
      submittedAt: Date,
    },
    certificate: {
      isIssued: { type: Boolean, default: false },
      url: { type: String },
      number: { type: String, unique: true, sparse: true },
      issuedAt: { type: Date },
    },
  },
  { timestamps: true }
);

// Ensure a user can only register for an event once
RegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

// ============================================================================
// EMAIL TEMPLATE MODEL
// ============================================================================
const EmailTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    htmlContent: { type: String, required: true },
    variables: [String],
  },
  { timestamps: true }
);

// ============================================================================
// AUDIT LOG MODEL
// ============================================================================
const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    action: { type: String, required: true },
    target: {
      entityType: { type: String },
      entityId: { type: mongoose.Schema.Types.ObjectId },
      entityName: { type: String },
    },
    changes: { type: Map, of: mongoose.Schema.Types.Mixed },
    meta: {
      ipAddress: { type: String },
      userAgent: { type: String },
    },
  },
  {
    timestamps: true,
    expireAfterSeconds: 31536000, // TTL: 1 year
  }
);

// ============================================================================
// MODEL EXPORTS
// ============================================================================
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Club = mongoose.models.Club || mongoose.model("Club", ClubSchema);
export const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);
export const Registration = mongoose.models.Registration || mongoose.model("Registration", RegistrationSchema);
export const EmailTemplate =
  mongoose.models.EmailTemplate || mongoose.model("EmailTemplate", EmailTemplateSchema);
export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
