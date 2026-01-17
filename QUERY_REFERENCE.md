# SQL to MongoDB Query Reference

## Complete Examples: PostgreSQL → MongoDB

### 1. User Authentication

#### Signup
```typescript
// BEFORE (PostgreSQL)
const result = await pool.query(
  `INSERT INTO users (email, password_hash, full_name, roll_number, branch, year, role, email_verified) 
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
   RETURNING id, email, full_name, role`,
  [email, passwordHash, fullName, rollNumber, branch, year, role, true]
)
const user = result.rows[0]

// AFTER (MongoDB)
const user = await User.create({
  email: email.toLowerCase(),
  passwordHash,
  fullName,
  rollNumber: rollNumber || undefined,
  branch: branch || undefined,
  year: year || undefined,
  role,
  emailVerified: true,
})
```

#### Login
```typescript
// BEFORE (PostgreSQL)
const result = await pool.query(
  "SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1 AND is_active = true",
  [email]
)
const user = result.rows[0]

// AFTER (MongoDB)
const user = await User.findOne({ email: email.toLowerCase(), isActive: true })
```

#### Get User Profile
```typescript
// BEFORE (PostgreSQL)
const result = await pool.query(
  "SELECT id, email, full_name, role, roll_number, branch, year, profile_picture_url FROM users WHERE id = $1",
  [userId]
)
const user = result.rows[0]

// AFTER (MongoDB)
const user = await User.findById(userId).select(
  "email fullName role rollNumber branch year profilePictureUrl"
)
```

---

### 2. Event Management

#### Get All Events (with search, filter, sort, pagination)
```typescript
// BEFORE (PostgreSQL)
let query = `
  SELECT e.id, e.title, e.description, e.event_type, e.poster_url, 
         e.venue_address, e.is_online, e.online_link, e.event_date, e.max_capacity,
         c.id as club_id, c.name as club_name, c.logo_url,
         COUNT(er.id) as registered_count
  FROM events e
  LEFT JOIN clubs c ON e.club_id = c.id
  LEFT JOIN event_registrations er ON e.id = er.event_id AND er.is_cancelled = false
  WHERE e.is_published = true AND e.event_date > CURRENT_TIMESTAMP
`

const params = []
let paramIndex = 1

if (search) {
  query += ` AND (e.title ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`
  params.push(`%${search}%`)
  paramIndex++
}

if (clubId) {
  query += ` AND e.club_id = $${paramIndex}`
  params.push(clubId)
  paramIndex++
}

query += " GROUP BY e.id, c.id ORDER BY e.event_date ASC"
query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
params.push(limit, offset)

const result = await pool.query(query, params)
const events = result.rows

// AFTER (MongoDB)
const filter = {
  isPublished: true,
  "schedule.startDate": { $gt: new Date() }
}

if (search) {
  filter.$or = [
    { title: { $regex: search, $options: "i" } },
    { description: { $regex: search, $options: "i" } }
  ]
}

if (clubId) {
  filter.clubId = new ObjectId(clubId)
}

const events = await Event.find(filter)
  .populate("clubId", "name assets")
  .sort({ "schedule.startDate": 1 })
  .skip(offset)
  .limit(limit)
  .lean()
```

#### Create Event
```typescript
// BEFORE (PostgreSQL)
const result = await pool.query(
  `INSERT INTO events (club_id, title, description, event_type, poster_url, venue_address, 
                      is_online, online_link, event_date, end_date, max_capacity, 
                      registration_open_date, registration_close_date, created_by, is_published)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
   RETURNING id, title, description, event_type, event_date, max_capacity`,
  [clubId, title, description, eventType, posterUrl, venueAddress, isOnline, 
   onlineLink, eventDate, endDate, maxCapacity, registrationOpenDate, 
   registrationCloseDate, userId]
)

// AFTER (MongoDB)
const event = await Event.create({
  clubId: new ObjectId(clubId),
  title,
  description,
  eventType: eventType || "other",
  posterUrl,
  location: {
    venueAddress,
    isOnline,
    onlineLink
  },
  schedule: {
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : undefined,
    registrationOpen: registrationOpenDate ? new Date(registrationOpenDate) : undefined,
    registrationClose: registrationCloseDate ? new Date(registrationCloseDate) : undefined
  },
  capacity: {
    max: maxCapacity,
    registeredCount: 0
  },
  isPublished: true,
  createdBy: new ObjectId(userId)
})
```

#### Update Event
```typescript
// BEFORE (PostgreSQL)
await pool.query(
  `UPDATE events 
   SET title = COALESCE($1, title),
       description = COALESCE($2, description),
       event_type = COALESCE($3, event_type),
       poster_url = COALESCE($4, poster_url),
       event_date = COALESCE($5, event_date),
       venue_address = COALESCE($6, venue_address),
       max_capacity = COALESCE($7, max_capacity),
       updated_at = CURRENT_TIMESTAMP
   WHERE id = $8`,
  [title, description, eventType, posterUrl, eventDate, venueAddress, maxCapacity, eventId]
)

// AFTER (MongoDB)
const updateData = {}
if (title) updateData.title = title
if (description) updateData.description = description
if (eventType) updateData.eventType = eventType
if (posterUrl) updateData.posterUrl = posterUrl
if (startDate) updateData["schedule.startDate"] = new Date(startDate)
if (venueAddress) updateData["location.venueAddress"] = venueAddress
if (maxCapacity) updateData["capacity.max"] = maxCapacity

await Event.findByIdAndUpdate(
  new ObjectId(eventId),
  { $set: updateData },
  { new: true }
)
```

---

### 3. Event Registration

#### Create Registration
```typescript
// BEFORE (PostgreSQL)
const regResult = await pool.query(
  `INSERT INTO event_registrations (event_id, user_id, qr_code_token, qr_code_data)
   VALUES ($1, $2, $3, $4)
   RETURNING id, event_id, user_id, registration_date`,
  [eventId, userId, qrToken, qrCode]
)

// AFTER (MongoDB)
const registration = await Registration.create({
  eventId: new ObjectId(eventId),
  userId: new ObjectId(userId),
  userSnapshot: {
    fullName: user.fullName,
    rollNumber: user.rollNumber,
    email: user.email
  },
  qrCode: {
    token: qrToken,
    data: qrCode
  },
  status: "registered"
})
```

#### Get Student Registrations
```typescript
// BEFORE (PostgreSQL)
const result = await pool.query(
  `SELECT er.id, er.event_id, er.registration_date, er.attendance_marked, 
          er.attendance_status, er.qr_code_data,
          e.id as event_id, e.title, e.event_date, e.venue_address, 
          e.is_online, e.online_link, e.poster_url,
          c.name as club_name, c.logo_url
   FROM event_registrations er
   JOIN events e ON er.event_id = e.id
   JOIN clubs c ON e.club_id = c.id
   WHERE er.user_id = $1 AND er.is_cancelled = false
   ORDER BY e.event_date DESC`,
  [userId]
)

// AFTER (MongoDB)
const registrations = await Registration.find({
  userId: new ObjectId(userId),
  status: { $ne: "cancelled" }
})
  .populate({
    path: "eventId",
    select: "title schedule location isOnline onlineLink posterUrl clubId",
    populate: {
      path: "clubId",
      select: "name assets"
    }
  })
  .sort({ "eventId.schedule.startDate": -1 })
  .lean()
```

#### Cancel Registration
```typescript
// BEFORE (PostgreSQL)
await pool.query(
  `UPDATE event_registrations 
   SET is_cancelled = true, cancelled_at = CURRENT_TIMESTAMP
   WHERE id = $1`,
  [registrationId]
)

// AFTER (MongoDB)
const registration = await Registration.findById(new ObjectId(registrationId))
registration.status = "cancelled"
registration.cancelledAt = new Date()
await registration.save()
```

---

### 4. Attendance Tracking

#### Mark Attendance (QR Scan)
```typescript
// BEFORE (PostgreSQL)
await pool.query(
  `UPDATE event_registrations 
   SET attendance_marked = true, attendance_status = 'present', attended_at = CURRENT_TIMESTAMP
   WHERE id = $1`,
  [registrationId]
)

await pool.query(
  `INSERT INTO attendance_logs (registration_id, event_id, user_id, status, marked_by, latitude, longitude)
   VALUES ($1, $2, $3, 'present', $4, $5, $6)`,
  [registrationId, eventId, userId, markedBy, latitude, longitude]
)

// AFTER (MongoDB)
const registration = await Registration.findById(new ObjectId(registrationId))
registration.attendance.isMarked = true
registration.attendance.currentStatus = "present"
registration.attendance.logs.push({
  markedBy: new ObjectId(markedByUserId),
  markedAt: new Date(),
  status: "present",
  location: latitude && longitude ? { lat: latitude, long: longitude } : undefined
})
await registration.save()
```

#### Manual Attendance
```typescript
// BEFORE (PostgreSQL)
await pool.query(
  `UPDATE event_registrations 
   SET attendance_marked = true, attendance_status = $1, attended_at = CURRENT_TIMESTAMP
   WHERE id = $2 AND event_id = $3`,
  [status, registrationId, eventId]
)

// AFTER (MongoDB)
const registration = await Registration.findById(new ObjectId(registrationId))
registration.attendance.isMarked = true
registration.attendance.currentStatus = status
registration.attendance.logs.push({
  markedBy: new ObjectId(markedByUserId),
  markedAt: new Date(),
  status,
  notes
})
await registration.save()
```

---

### 5. Analytics

#### Event Analytics
```typescript
// BEFORE (PostgreSQL)
const analyticsResult = await pool.query(
  `SELECT 
    COUNT(DISTINCT er.id) as total_registrations,
    COUNT(DISTINCT CASE WHEN er.attendance_marked AND er.attendance_status = 'present' THEN er.id END) as attendance_present,
    COUNT(DISTINCT CASE WHEN er.attendance_marked AND er.attendance_status = 'absent' THEN er.id END) as attendance_absent,
    COUNT(DISTINCT CASE WHEN er.attendance_marked AND er.attendance_status = 'late' THEN er.id END) as attendance_late,
    COUNT(DISTINCT CASE WHEN NOT er.attendance_marked THEN er.id END) as attendance_pending,
    COUNT(DISTINCT er.id) FILTER (WHERE er.feedback_submitted_at IS NOT NULL) as feedback_count,
    AVG(er.feedback_rating) as avg_rating
   FROM event_registrations er
   WHERE er.event_id = $1 AND er.is_cancelled = false`,
  [eventId]
)

// AFTER (MongoDB)
const registrations = await Registration.find({
  eventId: new ObjectId(eventId),
  status: { $ne: "cancelled" }
}).lean()

const totalRegistrations = registrations.length
const presentCount = registrations.filter(
  r => r.attendance.isMarked && r.attendance.currentStatus === "present"
).length
const absentCount = registrations.filter(
  r => r.attendance.isMarked && r.attendance.currentStatus === "absent"
).length
const lateCount = registrations.filter(
  r => r.attendance.isMarked && r.attendance.currentStatus === "late"
).length
const pendingCount = registrations.filter(r => !r.attendance.isMarked).length
const feedbackCount = registrations.filter(r => r.feedback.submittedAt).length
const avgRating = registrations.reduce((sum, r) => sum + (r.feedback.rating || 0), 0) / feedbackCount
```

---

### 6. Chairperson Dashboard

#### Get Chairperson Events
```typescript
// BEFORE (PostgreSQL)
const result = await pool.query(
  `SELECT e.id, e.title, e.description, e.event_type, e.event_date, e.venue_address,
          e.max_capacity, e.is_published, c.id as club_id, c.name as club_name,
          COUNT(DISTINCT er.id) as registered_count,
          COUNT(DISTINCT CASE WHEN er.attendance_marked THEN er.id END) as attended_count
   FROM events e
   JOIN clubs c ON e.club_id = c.id
   JOIN club_members cm ON c.id = cm.club_id
   LEFT JOIN event_registrations er ON e.id = er.event_id AND er.is_cancelled = false
   WHERE cm.user_id = $1 AND cm.role = 'chairperson' AND e.created_by = $1
   GROUP BY e.id, c.id
   ORDER BY e.event_date DESC`,
  [userId]
)

// AFTER (MongoDB)
const events = await Event.find({
  createdBy: new ObjectId(userId)
})
  .populate("clubId", "name")
  .sort({ "schedule.startDate": -1 })
  .lean()

// Get stats for each event
const eventsWithStats = await Promise.all(
  events.map(async event => {
    const registeredCount = await Registration.countDocuments({
      eventId: event._id,
      status: { $ne: "cancelled" }
    })
    const attendedCount = await Registration.countDocuments({
      eventId: event._id,
      "attendance.isMarked": true,
      "attendance.currentStatus": "present"
    })
    return { ...event, registeredCount, attendedCount }
  })
)
```

---

### 7. Club Management

#### Get Clubs
```typescript
// BEFORE (PostgreSQL)
const result = await pool.query(
  "SELECT id, name, description, logo_url, banner_url FROM clubs WHERE is_active = true ORDER BY name ASC LIMIT 100"
)

// AFTER (MongoDB)
const clubs = await Club.find({ isActive: true })
  .sort({ name: 1 })
  .limit(100)
  .lean()
```

#### Create Club
```typescript
// BEFORE (PostgreSQL)
await pool.query(
  `INSERT INTO clubs (name, description, logo_url, banner_url, website_url, email, phone)
   VALUES ($1, $2, $3, $4, $5, $6, $7)`,
  [name, description, logoUrl, bannerUrl, websiteUrl, email, phone]
)

// AFTER (MongoDB)
const club = await Club.create({
  name,
  description,
  assets: { logoUrl, bannerUrl },
  contact: { websiteUrl, email, phone }
})
```

---

### 8. Audit Logging

#### Log Audit Event
```typescript
// BEFORE (PostgreSQL)
await pool.query(
  `INSERT INTO audit_logs (user_id, action, entity_type, entity_id) 
   VALUES ($1, $2, $3, $4)`,
  [userId, "USER_SIGNUP", "users", userId]
)

// AFTER (MongoDB)
await AuditLog.create({
  userId: new ObjectId(userId),
  action: "USER_SIGNUP",
  target: {
    entityType: "User",
    entityId: new ObjectId(userId)
  }
})
```

---

## Common MongoDB Query Patterns

### Searching
```typescript
// ILIKE (case-insensitive like)
{ name: { $regex: "pattern", $options: "i" } }

// IN clause
{ status: { $in: ["registered", "attended"] } }

// NOT IN
{ status: { $nin: ["cancelled"] } }

// Greater than
{ "schedule.startDate": { $gt: new Date() } }

// And/Or
{ $and: [{ title: "..." }, { isPublished: true }] }
{ $or: [{ name: "..." }, { email: "..." }] }
```

### Aggregations
```typescript
// Count by status
db.registrations.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Average rating
db.registrations.aggregate([
  { $group: { _id: null, avgRating: { $avg: "$feedback.rating" } } }
])
```

### Updates
```typescript
// Update nested field
{ $set: { "location.venueAddress": "New Address" } }

// Push to array
{ $push: { "attendance.logs": logEntry } }

// Increment
{ $inc: { "capacity.registeredCount": 1 } }
```

---

## Performance Tips

### Use Indexes
```typescript
UserSchema.index({ email: 1 })
EventSchema.index({ clubId: 1, "schedule.startDate": 1 })
RegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true })
```

### Use `.lean()` for read-only queries
```typescript
// Faster (returns plain JS objects)
await Event.find().lean()

// Slower (returns Mongoose documents)
await Event.find()
```

### Use `.select()` to limit fields
```typescript
// Return only needed fields
await User.findById(id).select("email fullName")

// Exclude fields
await User.findById(id).select("-passwordHash -emailVerified")
```

### Use `.sort()` before `.limit()`
```typescript
// Efficient
await Event.find()
  .sort({ "schedule.startDate": 1 })
  .limit(10)

// Inefficient
await Event.find()
  .limit(10)
  .sort({ "schedule.startDate": 1 })
```

---

**For more examples, check the actual updated route files!** 📂
