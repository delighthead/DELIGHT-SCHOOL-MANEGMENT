-- DELIGHT INTERNATIONAL SCHOOL
-- BASIC 9 MOCK EXAMINATION MODULE
-- New tables only. Existing terminal scores are not modified.

CREATE TABLE IF NOT EXISTS mock_examinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    class_id INT NOT NULL,
    mock_name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    examination_date DATE NULL,
    status ENUM('draft', 'active', 'completed') DEFAULT 'draft',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_mock (
        branch_id,
        class_id,
        mock_name,
        academic_year
    ),

    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS mock_subject_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mock_id INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    objectives_max INT NOT NULL,
    written_max INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_mock_subject (mock_id, subject),
    UNIQUE KEY unique_mock_subject_reference (mock_id, id),

    CONSTRAINT chk_mock_objectives_max
        CHECK (objectives_max IN (30, 40)),

    CONSTRAINT chk_mock_written_max
        CHECK (written_max = 100 - objectives_max),

    FOREIGN KEY (mock_id)
        REFERENCES mock_examinations(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mock_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mock_id INT NOT NULL,
    student_id INT NOT NULL,
    subject_setting_id INT NOT NULL,
    objectives_score DECIMAL(5,2) NULL,
    written_score DECIMAL(5,2) NULL,
    total_score DECIMAL(5,2)
        GENERATED ALWAYS AS (
            CASE
                WHEN objectives_score IS NULL
                  OR written_score IS NULL
                THEN NULL
                ELSE objectives_score + written_score
            END
        ) STORED,
    grade VARCHAR(10),
    remarks VARCHAR(150),
    entered_by INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_student_mock_subject (
        mock_id,
        student_id,
        subject_setting_id
    ),

    CONSTRAINT fk_mock_score_subject
        FOREIGN KEY (mock_id, subject_setting_id)
        REFERENCES mock_subject_settings(mock_id, id),

    CONSTRAINT chk_mock_objectives_score
        CHECK (
            objectives_score IS NULL
            OR objectives_score >= 0
        ),

    CONSTRAINT chk_mock_written_score
        CHECK (
            written_score IS NULL
            OR written_score >= 0
        ),

    FOREIGN KEY (mock_id)
        REFERENCES mock_examinations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (student_id)
        REFERENCES students(id),

    FOREIGN KEY (subject_setting_id)
        REFERENCES mock_subject_settings(id),

    FOREIGN KEY (entered_by)
        REFERENCES users(id)
);


-- Validate mock scores before insertion
DELIMITER //

CREATE TRIGGER mock_scores_validate_insert
BEFORE INSERT ON mock_scores
FOR EACH ROW
BEGIN
    DECLARE max_objectives INT;
    DECLARE max_written INT;

    SELECT objectives_max, written_max
    INTO max_objectives, max_written
    FROM mock_subject_settings
    WHERE id = NEW.subject_setting_id
      AND mock_id = NEW.mock_id;

    IF NEW.objectives_score > max_objectives
       OR NEW.written_score > max_written THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Mock score exceeds subject maximum';
    END IF;
END//

CREATE TRIGGER mock_scores_validate_update
BEFORE UPDATE ON mock_scores
FOR EACH ROW
BEGIN
    DECLARE max_objectives INT;
    DECLARE max_written INT;

    SELECT objectives_max, written_max
    INTO max_objectives, max_written
    FROM mock_subject_settings
    WHERE id = NEW.subject_setting_id
      AND mock_id = NEW.mock_id;

    IF NEW.objectives_score > max_objectives
       OR NEW.written_score > max_written THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Mock score exceeds subject maximum';
    END IF;
END//

DELIMITER ;
