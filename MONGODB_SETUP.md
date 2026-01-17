# MongoDB Setup Instructions

## Quick Start Guide

### Step 1: Install MongoDB Package
```bash
pnpm add mongoose
```
✅ Already done (you ran `pnpm add mongoose`)

---

### Step 2: Configure Environment Variables

Create or update your `.env.local` file:

```env
# MongoDB Connection
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/college-event-portal?retryWrites=true

# JWT Configuration
JWT_SECRET=your-very-secure-secret-key-minimum-32-characters

# Brevo Email Service
BREVO_API_KEY=your-brevo-api-key-here

# Application
NODE_ENV=development
```

---

### Step 3: Get MongoDB Connection String

#### Option A: MongoDB Atlas (Cloud - Recommended)
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free account or sign in
3. Create a cluster
4. Click "Connect"
5. Choose "Drivers" > "Node.js"
6. Copy the connection string
7. Replace `<username>`, `<password>`, and `<dbname>` with your credentials

#### Option B: Local MongoDB
```env
MONGO_URL=mongodb://localhost:27017/college-event-portal
```

---

### Step 4: Verify Database Connection

Run this test command:
```bash
pnpm dev
```

Check the terminal for:
```
✅ MongoDB connected successfully
```

---

### Step 5: Test API Endpoints

#### Signup Test
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@college.edu",
    "password": "password123",
    "fullName": "John Doe",
    "rollNumber": "CS001",
    "branch": "Computer Science",
    "year": 2
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "ObjectId(...)",
    "email": "student@college.edu",
    "fullName": "John Doe",
    "role": "student"
  },
  "token": "eyJhbGc..."
}
```

#### Login Test
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@college.edu",
    "password": "password123"
  }'
```

#### Get Profile Test
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Step 6: Create Sample Data

#### Create a Club (Admin Only)
```bash
curl -X POST http://localhost:3000/api/clubs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "Coding Club",
    "description": "A club for programmers",
    "websiteUrl": "https://codingclub.com",
    "email": "coding@college.edu",
    "phone": "+91-9999999999"
  }'
```

#### Create an Event (Chairperson)
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CHAIRPERSON_TOKEN" \
  -d '{
    "clubId": "CLUB_ID_FROM_ABOVE",
    "title": "Web Development Workshop",
    "description": "Learn React and Next.js",
    "eventType": "workshop",
    "startDate": "2026-02-15T10:00:00Z",
    "endDate": "2026-02-15T12:00:00Z",
    "maxCapacity": 50,
    "venueAddress": "Room 101, Main Building",
    "isOnline": false
  }'
```

---

### Step 7: Troubleshooting

#### Issue: `MONGO_URL is not defined`
**Solution:**
1. Check `.env.local` file exists
2. Restart the dev server: `Ctrl+C` then `pnpm dev`
3. Verify the connection string is correct

#### Issue: `MongooseError: Cannot connect to MongoDB`
**Solution:**
1. Check MongoDB Atlas IP whitelist includes your IP
2. Verify credentials in connection string
3. Ensure network connectivity to MongoDB

#### Issue: `Type ObjectId is missing`
**Solution:**
```bash
pnpm add mongoose
pnpm install
```

#### Issue: Port 3000 already in use
**Solution:**
```bash
# Use different port
PORT=3001 pnpm dev
```

---

### Step 8: Database Backup

#### Atlas Automatic Backups
- Atlas automatically backs up your data
- Free tier has 7-day backup retention
- Access backups in Atlas console > Backups

#### Manual Backup
```bash
# Export data from MongoDB
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/college-event-portal"

# Import data
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/college-event-portal" ./dump
```

---

### Step 9: Performance Monitoring

#### Enable Query Logging
```typescript
// In lib/db.ts
mongoose.set('debug', true)
```

#### Check MongoDB Metrics
- Visit [MongoDB Atlas Console](https://cloud.mongodb.com)
- Go to Monitoring > Metrics
- Review query performance

---

### Step 10: Production Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] MongoDB Atlas IP whitelist updated
- [ ] Database backups enabled
- [ ] Error monitoring setup (Sentry, etc.)
- [ ] All API tests passing
- [ ] Load testing completed
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Audit logs enabled
- [ ] Monitoring alerts set up

---

## Database Schema Overview

```
Users Collection:
├── email (indexed, unique)
├── passwordHash
├── fullName
├── rollNumber (indexed)
├── branch
├── year
├── role (enum)
├── clubMemberships []
│   ├── clubId
│   ├── role
│   └── joinedAt
└── timestamps

Events Collection:
├── clubId (indexed)
├── title
├── description
├── eventType
├── posterUrl
├── location
│   ├── venueAddress
│   ├── isOnline
│   ├── onlineLink
│   └── coordinates
├── schedule
│   ├── startDate (indexed)
│   ├── endDate
│   ├── registrationOpen
│   └── registrationClose
├── capacity
│   ├── max
│   └── registeredCount
├── isPublished (indexed)
├── createdBy
└── timestamps

Registrations Collection:
├── eventId (indexed)
├── userId (indexed)
├── userSnapshot
├── qrCode
│   ├── token (unique)
│   └── data
├── status (enum)
├── attendance
│   ├── isMarked
│   ├── currentStatus
│   └── logs []
├── feedback
├── certificate
└── timestamps

Clubs Collection:
├── name (unique)
├── description
├── assets
├── contact
├── memberCount
└── timestamps

EmailTemplates Collection:
├── name (unique)
├── subject
├── htmlContent
└── variables []

AuditLogs Collection:
├── userId (indexed)
├── action
├── target
├── changes
├── meta
└── TTL (1 year)
```

---

## API Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "token": "optional-jwt"
}
```

### Error Response
```json
{
  "error": "Error message",
  "statusCode": 400
}
```

---

## Need Help?

1. Check [MONGO_MIGRATION.md](./MONGO_MIGRATION.md) for detailed migration info
2. Review [Mongoose Documentation](https://mongoosejs.com)
3. Check error logs in terminal
4. Verify MongoDB connection string

---

**You're all set! Happy coding! 🚀**
