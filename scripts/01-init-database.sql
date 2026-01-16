-- Create ENUM types
-- (Safe to run if types don't exist; if they do, you might see "type already exists" errors which can be ignored or handled by dropping them first)
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('student', 'chairperson', 'admin');

DROP TYPE IF EXISTS event_type_enum CASCADE;
CREATE TYPE event_type_enum AS ENUM ('seminar', 'workshop', 'hackathon', 'competition', 'festival', 'lecture', 'other');

DROP TYPE IF EXISTS attendance_status CASCADE;
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  roll_number VARCHAR(50),
  branch VARCHAR(100),
  year INT,
  role user_role DEFAULT 'student',
  profile_picture_url TEXT,
  phone VARCHAR(20),
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clubs table
CREATE TABLE clubs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  website_url VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Club members (association table)
CREATE TABLE club_members (
  id SERIAL PRIMARY KEY,
  club_id INT NOT NULL,
  user_id INT NOT NULL,
  role VARCHAR(50) NOT NULL, -- chairperson, vice-chair, member, etc.
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_club_user UNIQUE (club_id, user_id)
);

-- Events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  club_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type event_type_enum,
  poster_url TEXT,
  venue_address VARCHAR(255),
  is_online BOOLEAN DEFAULT FALSE,
  online_link VARCHAR(255),
  event_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  registration_open_date TIMESTAMP,
  registration_close_date TIMESTAMP,
  max_capacity INT,
  is_published BOOLEAN DEFAULT FALSE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Event registrations table
CREATE TABLE event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  qr_code_token VARCHAR(255) UNIQUE,
  qr_code_data TEXT,
  attendance_marked BOOLEAN DEFAULT FALSE,
  attended_at TIMESTAMP,
  attendance_status attendance_status,
  feedback TEXT,
  feedback_rating INT CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_submitted_at TIMESTAMP,
  is_cancelled BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_registration UNIQUE (event_id, user_id)
);

-- Attendance logs (detailed tracking)
CREATE TABLE attendance_logs (
  id SERIAL PRIMARY KEY,
  registration_id INT NOT NULL,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  status attendance_status,
  marked_by INT,
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  notes TEXT,
  FOREIGN KEY (registration_id) REFERENCES event_registrations(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id)
);

-- Email templates table
CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(100) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  variables JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  changes JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Certificates table
CREATE TABLE certificates (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  certificate_url TEXT,
  certificate_number VARCHAR(50) UNIQUE,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_cert UNIQUE (event_id, user_id)
);

-- Create indexes (PostgreSQL specific)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_clubs_name ON clubs(name);

CREATE INDEX idx_club_members_club_id ON club_members(club_id);
CREATE INDEX idx_club_members_user_id ON club_members(user_id);

CREATE INDEX idx_events_club_id ON events(club_id);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_published ON events(is_published);

CREATE INDEX idx_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_registrations_user_id ON event_registrations(user_id);
CREATE INDEX idx_registrations_qr_token ON event_registrations(qr_code_token);
CREATE INDEX idx_registrations_attendance_marked ON event_registrations(attendance_marked);

CREATE INDEX idx_attendance_logs_registration_id ON attendance_logs(registration_id);
CREATE INDEX idx_attendance_logs_event_id ON attendance_logs(event_id);
CREATE INDEX idx_attendance_logs_marked_at ON attendance_logs(marked_at);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

CREATE INDEX idx_certificates_event_id ON certificates(event_id);
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_clubs_is_active ON clubs(is_active);