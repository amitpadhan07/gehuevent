-- Create ENUM types
CREATE TYPE user_role AS ENUM ('student', 'chairperson', 'admin');
CREATE TYPE event_type_enum AS ENUM ('seminar', 'workshop', 'hackathon', 'competition', 'festival', 'lecture', 'other');
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
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
  UNIQUE KEY unique_club_user (club_id, user_id),
  INDEX idx_club_id (club_id),
  INDEX idx_user_id (user_id)
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
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_club_id (club_id),
  INDEX idx_event_date (event_date),
  INDEX idx_published (is_published)
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
  UNIQUE KEY unique_registration (event_id, user_id),
  INDEX idx_event_id (event_id),
  INDEX idx_user_id (user_id),
  INDEX idx_qr_token (qr_code_token),
  INDEX idx_attendance_marked (attendance_marked)
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
  FOREIGN KEY (marked_by) REFERENCES users(id),
  INDEX idx_registration_id (registration_id),
  INDEX idx_event_id (event_id),
  INDEX idx_marked_at (marked_at)
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_entity (entity_type, entity_id)
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
  UNIQUE KEY unique_cert (event_id, user_id),
  INDEX idx_event_id (event_id),
  INDEX idx_user_id (user_id)
);

-- Create indexes for common queries
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_event_club ON events(club_id);
CREATE INDEX idx_registration_status ON event_registrations(attendance_marked);
CREATE INDEX idx_club_active ON clubs(is_active);
