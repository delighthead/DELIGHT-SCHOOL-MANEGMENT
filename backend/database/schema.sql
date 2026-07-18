CREATE DATABASE IF NOT EXISTS delight_school_management;

USE delight_school_management;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'parent') NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(150),
  status ENUM('active', 'locked', 'disabled', 'deleted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
);

CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_name VARCHAR(50) NOT NULL UNIQUE,
  academic_year VARCHAR(20) NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active'
);

CREATE TABLE parents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  ghana_card_number VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(150),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL UNIQUE,
  admission_number VARCHAR(50) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  other_name VARCHAR(100),
  sex ENUM('Male', 'Female') NOT NULL,
  date_of_birth DATE,
  place_of_birth VARCHAR(150),
  nationality VARCHAR(100),
  class_id INT,
  parent_ghana_card_number VARCHAR(50),
  photo VARCHAR(255),
  status ENUM('active', 'transferred', 'completed', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

CREATE TABLE teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  teacher_id VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  ghana_card_number VARCHAR(50) UNIQUE,
  phone VARCHAR(30),
  email VARCHAR(150),
  address TEXT,
  photo VARCHAR(255),
  status ENUM('active', 'locked', 'disabled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE teacher_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  class_id INT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  academic_year VARCHAR(20),
  status ENUM('active', 'inactive') DEFAULT 'active',
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

CREATE TABLE scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  admission_number VARCHAR(50),
  class_id INT,
  subject VARCHAR(100) NOT NULL,
  term VARCHAR(20),
  academic_year VARCHAR(20),
  assessment_score DECIMAL(5,2),
  examination_score DECIMAL(5,2),
  total_score DECIMAL(5,2),
  grade VARCHAR(10),
  position VARCHAR(20),
  remarks TEXT,
  entry_method ENUM('manual', 'excel_upload') DEFAULT 'manual',
  approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

CREATE TABLE score_uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT,
  class_id INT,
  subject VARCHAR(100),
  term VARCHAR(20),
  academic_year VARCHAR(20),
  file_name VARCHAR(255),
  validation_status ENUM('pending', 'valid', 'errors_found', 'approved', 'rejected') DEFAULT 'pending',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by INT NULL,
  approval_date TIMESTAMP NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE fees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  term VARCHAR(20),
  academic_year VARCHAR(20),
  amount_payable DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0,
  payment_date DATE,
  payment_status ENUM('paid', 'part_payment', 'unpaid') DEFAULT 'unpaid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT,
  teacher_id INT,
  attendance_date DATE NOT NULL,
  term VARCHAR(20),
  academic_year VARCHAR(20),
  status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE TABLE announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  audience ENUM('all', 'teachers', 'parents', 'students') DEFAULT 'all',
  status ENUM('published', 'draft', 'hidden', 'archived') DEFAULT 'draft',
  publish_date DATE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_name VARCHAR(200),
  report_type VARCHAR(100),
  class_id INT NULL,
  term VARCHAR(20),
  academic_year VARCHAR(20),
  generated_by INT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_path VARCHAR(255),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (generated_by) REFERENCES users(id)
);

CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_name VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255),
  module VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_title VARCHAR(150),
  page_content TEXT,
  status ENUM('published', 'hidden', 'draft') DEFAULT 'published',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE gallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150),
  album VARCHAR(100),
  image_file VARCHAR(255),
  description TEXT,
  status ENUM('published', 'hidden') DEFAULT 'published',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200),
  event_date DATE,
  event_time TIME,
  venue VARCHAR(150),
  description TEXT,
  status ENUM('upcoming', 'past', 'archived') DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
