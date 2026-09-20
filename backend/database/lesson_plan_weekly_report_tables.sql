USE delight_school_management;

CREATE TABLE IF NOT EXISTS lesson_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NULL,
  class_id INT NULL,
  class_name VARCHAR(150) NOT NULL,
  subject VARCHAR(150) NOT NULL,
  week VARCHAR(50) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  objectives TEXT,
  resources TEXT,
  file_path VARCHAR(255),
  file_original_name VARCHAR(255),
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  admin_comment TEXT,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_lesson_teacher (teacher_id),
  INDEX idx_lesson_class (class_id),
  INDEX idx_lesson_subject (subject),
  INDEX idx_lesson_week (week),
  INDEX idx_lesson_status (status)
);

CREATE TABLE IF NOT EXISTS weekly_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NULL,
  class_id INT NULL,
  class_name VARCHAR(150) NOT NULL,
  report_type VARCHAR(150) NOT NULL,
  week VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  activities TEXT,
  learner_participation TEXT,
  progress TEXT,
  challenges TEXT,
  interventions TEXT,
  file_path VARCHAR(255),
  file_original_name VARCHAR(255),
  status ENUM('Pending', 'Reviewed') DEFAULT 'Pending',
  admin_comment TEXT,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_weekly_teacher (teacher_id),
  INDEX idx_weekly_class (class_id),
  INDEX idx_weekly_type (report_type),
  INDEX idx_weekly_week (week),
  INDEX idx_weekly_status (status)
);
