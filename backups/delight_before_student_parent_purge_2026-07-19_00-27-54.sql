-- MySQL dump 10.13  Distrib 8.4.10, for Linux (x86_64)
--
-- Host: localhost    Database: delight_school_management
-- ------------------------------------------------------
-- Server version	8.4.10-0ubuntu0.26.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `module` varchar(100) DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (1,1,1,'Branch Created','Branches','Created branch Main Campus.','2026-07-12 23:04:46'),(2,1,1,'Branch Updated','Branches','Activity edit check','2026-07-12 23:09:14'),(9,1,1,'Fee Recorded','Fees','Recorded fee for student ID 5. Payable: GHS 1000, Paid: GHS 0, Balance: GHS 1000.','2026-07-13 00:10:55'),(10,1,1,'Fee Payment Added','Fees','Added payment of GHS 750 for fee ID 1. Total paid: GHS 750, Balance: GHS 250.','2026-07-13 00:10:55'),(12,1,1,'Fee Recorded','Fees','Recorded fee for student ID 6. Payable: GHS 1000, Paid: GHS 250, Balance: GHS 750.','2026-07-13 00:11:51'),(13,1,1,'Fee Payment Added','Fees','Added payment of GHS 750 for fee ID 2. Total paid: GHS 1000, Balance: GHS 0.','2026-07-13 00:11:52'),(14,1,1,'Fee Payment Added','Fees','Added payment of GHS 750 for fee ID 4. Total paid: GHS 1000, Balance: GHS 0.','2026-07-13 00:12:20'),(15,2,1,'Branch Created','Branches','Created branch DELIGHT INT SCHOOL (OFANKOR).','2026-07-18 22:42:47');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `audience` enum('all','teachers','parents','students') DEFAULT 'all',
  `status` enum('published','draft','hidden','archived') DEFAULT 'draft',
  `publish_date` date DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `student_id` int NOT NULL,
  `class_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `term` varchar(20) DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `status` enum('present','absent') NOT NULL,
  `remarks` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attendance_record` (`student_id`,`attendance_date`,`term`,`academic_year`),
  KEY `student_id` (`student_id`),
  KEY `class_id` (`class_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `attendance_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_name` varchar(150) NOT NULL,
  `location` varchar(200) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (1,'Main Campus Updated','Accra Central','0241111111','updated-maincampus@delight.edu',NULL,'active','2026-07-12 23:04:46'),(2,'DELIGHT INT SCHOOL (OFANKOR)','OFANKOR SPOT M','0244113286','delightintschool@gmail.com','Box AN 5044 Accra North','active','2026-07-18 22:42:47');
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `class_name` varchar(50) NOT NULL,
  `academic_year` varchar(20) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `class_name` (`class_name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES (1,1,'Basic 1','2025/2026','active'),(2,1,'Basic 2','2025/2026','active'),(3,1,'Basic 3','2025/2026','active'),(4,1,'Basic 4','2025/2026','active'),(5,1,'Basic 5','2025/2026','active'),(6,NULL,'Nursery 1','2025/2026','active'),(7,NULL,'Nursery 2','2025/2026','active'),(8,NULL,'Kindergarten 1','2025/2026','active'),(9,NULL,'Kindergarten 2','2025/2026','active'),(10,NULL,'Basic 6','2025/2026','active'),(11,NULL,'Basic 7','2025/2026','active'),(12,NULL,'Basic 8','2025/2026','active'),(13,NULL,'Basic 9','2025/2026','active');
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message` text NOT NULL,
  `email_status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `title` varchar(200) DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `event_time` time DEFAULT NULL,
  `venue` varchar(150) DEFAULT NULL,
  `description` text,
  `status` enum('upcoming','past','archived') DEFAULT 'upcoming',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fee_payments`
--

DROP TABLE IF EXISTS `fee_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fee_id` int NOT NULL,
  `branch_id` int DEFAULT NULL,
  `student_id` int NOT NULL,
  `payment_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_date` date NOT NULL,
  `payment_note` varchar(255) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fee_id` (`fee_id`),
  KEY `student_id` (`student_id`),
  KEY `branch_id` (`branch_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_payments`
--

LOCK TABLES `fee_payments` WRITE;
/*!40000 ALTER TABLE `fee_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `fee_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fees`
--

DROP TABLE IF EXISTS `fees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `student_id` int NOT NULL,
  `term` varchar(20) DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `amount_payable` decimal(10,2) DEFAULT '0.00',
  `amount_paid` decimal(10,2) DEFAULT '0.00',
  `balance` decimal(10,2) DEFAULT '0.00',
  `payment_date` date DEFAULT NULL,
  `payment_status` enum('paid','part_payment','unpaid') DEFAULT 'unpaid',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `fees_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fees`
--

LOCK TABLES `fees` WRITE;
/*!40000 ALTER TABLE `fees` DISABLE KEYS */;
/*!40000 ALTER TABLE `fees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gallery`
--

DROP TABLE IF EXISTS `gallery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `title` varchar(150) DEFAULT NULL,
  `album` varchar(100) DEFAULT NULL,
  `image_file` varchar(255) DEFAULT NULL,
  `description` text,
  `status` enum('published','hidden') DEFAULT 'published',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gallery`
--

LOCK TABLES `gallery` WRITE;
/*!40000 ALTER TABLE `gallery` DISABLE KEYS */;
/*!40000 ALTER TABLE `gallery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pages`
--

DROP TABLE IF EXISTS `pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `page_title` varchar(150) DEFAULT NULL,
  `page_content` text,
  `status` enum('published','hidden','draft') DEFAULT 'published',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pages`
--

LOCK TABLES `pages` WRITE;
/*!40000 ALTER TABLE `pages` DISABLE KEYS */;
/*!40000 ALTER TABLE `pages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parent_student_links`
--

DROP TABLE IF EXISTS `parent_student_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parent_student_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_id` int NOT NULL,
  `student_id` int NOT NULL,
  `relationship` enum('mother','father','guardian') DEFAULT 'guardian',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_parent_student` (`parent_id`,`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parent_student_links`
--

LOCK TABLES `parent_student_links` WRITE;
/*!40000 ALTER TABLE `parent_student_links` DISABLE KEYS */;
/*!40000 ALTER TABLE `parent_student_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parents`
--

DROP TABLE IF EXISTS `parents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `ghana_card_number` varchar(50) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('active','inactive','locked','disabled','deleted') DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ghana_card_number` (`ghana_card_number`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `parents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parents`
--

LOCK TABLES `parents` WRITE;
/*!40000 ALTER TABLE `parents` DISABLE KEYS */;
/*!40000 ALTER TABLE `parents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotion_history`
--

DROP TABLE IF EXISTS `promotion_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotion_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `student_id` int NOT NULL,
  `from_class_id` int DEFAULT NULL,
  `to_class_id` int DEFAULT NULL,
  `from_class_name` varchar(100) DEFAULT NULL,
  `to_class_name` varchar(100) DEFAULT NULL,
  `academic_year` varchar(50) DEFAULT NULL,
  `promoted_by` int DEFAULT NULL,
  `promoted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotion_history`
--

LOCK TABLES `promotion_history` WRITE;
/*!40000 ALTER TABLE `promotion_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotion_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `report_name` varchar(200) DEFAULT NULL,
  `report_type` varchar(100) DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `term` varchar(20) DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `generated_by` int DEFAULT NULL,
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `file_path` varchar(255) DEFAULT NULL,
  `teacher_comment` text,
  `headteacher_comment` text,
  `reopening_date` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `class_id` (`class_id`),
  KEY `generated_by` (`generated_by`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `score_uploads`
--

DROP TABLE IF EXISTS `score_uploads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `score_uploads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `term` varchar(20) DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `validation_status` enum('pending','valid','errors_found','approved','rejected') DEFAULT 'pending',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_by` int DEFAULT NULL,
  `approval_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `class_id` (`class_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `score_uploads_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`),
  CONSTRAINT `score_uploads_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `score_uploads_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `score_uploads`
--

LOCK TABLES `score_uploads` WRITE;
/*!40000 ALTER TABLE `score_uploads` DISABLE KEYS */;
/*!40000 ALTER TABLE `score_uploads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scores`
--

DROP TABLE IF EXISTS `scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `student_id` int NOT NULL,
  `admission_number` varchar(50) DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `subject` varchar(100) NOT NULL,
  `term` varchar(20) DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `assessment_score` decimal(5,2) DEFAULT NULL,
  `examination_score` decimal(5,2) DEFAULT NULL,
  `total_score` decimal(5,2) DEFAULT NULL,
  `grade` varchar(10) DEFAULT NULL,
  `position` varchar(20) DEFAULT NULL,
  `remarks` text,
  `entry_method` enum('manual','excel_upload') DEFAULT 'manual',
  `approval_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `class_id` (`class_id`),
  CONSTRAINT `scores_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `scores_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scores`
--

LOCK TABLES `scores` WRITE;
/*!40000 ALTER TABLE `scores` DISABLE KEYS */;
/*!40000 ALTER TABLE `scores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_name` varchar(200) DEFAULT 'Delight International School',
  `school_motto` varchar(255) DEFAULT NULL,
  `school_phone` varchar(50) DEFAULT NULL,
  `school_email` varchar(150) DEFAULT NULL,
  `school_address` text,
  `school_logo` varchar(255) DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT '2025/2026',
  `current_term` varchar(20) DEFAULT 'Term 1',
  `assessment_max_score` decimal(10,2) DEFAULT '30.00',
  `examination_max_score` decimal(10,2) DEFAULT '70.00',
  `total_max_score` decimal(10,2) DEFAULT '100.00',
  `pass_mark` decimal(10,2) DEFAULT '50.00',
  `default_username` varchar(100) DEFAULT 'Ghana Card Number',
  `default_password` varchar(100) DEFAULT 'Phone Number',
  `allow_password_reset` enum('yes','no') DEFAULT 'yes',
  `lock_after_attempts` int DEFAULT '5',
  `grade_a_min` decimal(10,2) DEFAULT '80.00',
  `grade_a_max` decimal(10,2) DEFAULT '100.00',
  `grade_a_remark` varchar(100) DEFAULT 'Excellent',
  `grade_b_min` decimal(10,2) DEFAULT '70.00',
  `grade_b_max` decimal(10,2) DEFAULT '79.00',
  `grade_b_remark` varchar(100) DEFAULT 'Very Good',
  `grade_c_min` decimal(10,2) DEFAULT '60.00',
  `grade_c_max` decimal(10,2) DEFAULT '69.00',
  `grade_c_remark` varchar(100) DEFAULT 'Good',
  `grade_d_min` decimal(10,2) DEFAULT '50.00',
  `grade_d_max` decimal(10,2) DEFAULT '59.00',
  `grade_d_remark` varchar(100) DEFAULT 'Pass',
  `grade_f_min` decimal(10,2) DEFAULT '0.00',
  `grade_f_max` decimal(10,2) DEFAULT '49.00',
  `grade_f_remark` varchar(100) DEFAULT 'Needs Improvement',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'Delight International School','ARISE AND SHINE','0244113286 / 0277776449','delightintschool@gmail.com','Box AN 5044 Accra-Noth','/uploads/logo/school-logo-1783154789422.png','2025/2026','Term 1',30.00,70.00,100.00,50.00,'Ghana Card Number','Phone Number','yes',3,80.00,100.00,'Excellent',70.00,79.00,'Very Good',60.00,69.00,'Good',50.00,59.00,'Pass',0.00,49.00,'Needs Improvement','2026-07-04 08:46:29');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `student_id` varchar(50) NOT NULL,
  `admission_number` varchar(50) NOT NULL,
  `full_name` varchar(200) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `surname` varchar(100) NOT NULL,
  `other_name` varchar(100) DEFAULT NULL,
  `sex` enum('Male','Female') NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `place_of_birth` varchar(150) DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `language_spoken` varchar(100) DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `parent_ghana_card_number` varchar(50) DEFAULT NULL,
  `parent_phone` varchar(30) DEFAULT NULL,
  `mother_name` varchar(150) DEFAULT NULL,
  `mother_ghana_card` varchar(50) DEFAULT NULL,
  `mother_phone` varchar(30) DEFAULT NULL,
  `father_name` varchar(150) DEFAULT NULL,
  `father_ghana_card` varchar(50) DEFAULT NULL,
  `father_phone` varchar(30) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','stopped','transferred','completed') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `profile_picture` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`),
  UNIQUE KEY `admission_number` (`admission_number`),
  KEY `class_id` (`class_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_assignments`
--

DROP TABLE IF EXISTS `teacher_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `teacher_id` int NOT NULL,
  `class_id` int NOT NULL,
  `subject` varchar(100) NOT NULL,
  `role` varchar(100) DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `class_id` (`class_id`),
  CONSTRAINT `teacher_assignments_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`),
  CONSTRAINT `teacher_assignments_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_assignments`
--

LOCK TABLES `teacher_assignments` WRITE;
/*!40000 ALTER TABLE `teacher_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `teacher_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `teacher_id` varchar(50) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `ghana_card_number` varchar(50) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text,
  `photo` varchar(255) DEFAULT NULL,
  `status` enum('active','locked','disabled') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `profile_picture` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teacher_id` (`teacher_id`),
  UNIQUE KEY `ghana_card_number` (`ghana_card_number`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `full_name` varchar(150) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('super_admin','branch_admin','admin','teacher','parent') NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `status` enum('active','inactive','locked','disabled','deleted') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,NULL,'Super Admin','GHA-002716665-9','$2b$10$LPwhY9RVCoJylyOJk2XT1uuVR8OoIO/KCOv2BWfXBUhIYCIurv1b.','super_admin','0244113286','','active','2026-07-12 22:54:06','2026-07-18 22:07:07','/uploads/admins/admin-profile-1784412608818.png');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `website_content_blocks`
--

DROP TABLE IF EXISTS `website_content_blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `website_content_blocks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `page_key` varchar(50) NOT NULL,
  `block_key` varchar(100) NOT NULL,
  `block_label` varchar(150) NOT NULL,
  `block_type` varchar(30) NOT NULL DEFAULT 'text',
  `block_content` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_page_block` (`page_key`,`block_key`)
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website_content_blocks`
--

LOCK TABLES `website_content_blocks` WRITE;
/*!40000 ALTER TABLE `website_content_blocks` DISABLE KEYS */;
INSERT INTO `website_content_blocks` VALUES (1,'home','home_stat_students_number','Students Number','text','50+','2026-07-12 22:58:28'),(2,'home','home_stat_students_label','Students Label','text','Stu','2026-07-04 17:52:18'),(3,'home','home_stat_teachers_number','Teachers Number','text','50+','2026-07-12 22:58:28'),(4,'home','home_stat_teachers_label','Teachers Label','text','Teac','2026-07-04 17:52:18'),(5,'home','home_stat_years_number','Years Number','text','2+','2026-07-04 17:52:18'),(6,'home','home_stat_years_label','Years Label','text','Service','2026-07-04 17:52:18'),(7,'home','home_stat_success_number','Success Rate Number','text','5%','2026-07-04 17:52:18'),(8,'home','home_stat_success_label','Success Rate Label','text','Rate','2026-07-04 17:52:18'),(9,'home','home_why_title','Why Choose Us Title','text','Choose Us?','2026-07-04 17:52:19'),(10,'home','home_quality_title','Quality Teaching Title','text','Teaching','2026-07-04 17:52:19'),(11,'home','home_quality_text','Quality Teaching Text','text','We ','2026-07-04 17:52:19'),(12,'home','home_discipline_title','Discipline Title','text','Disci','2026-07-04 17:52:19'),(13,'home','home_discipline_text','Discipline Text','text','We tr','2026-07-04 17:52:19'),(14,'home','home_parent_title','Parent Partnership Title','text','Parent ','2026-07-04 17:52:19'),(15,'home','home_parent_text','Parent Partnership Text','text','We wor','2026-07-04 17:52:19'),(46,'about','about_heading','About Main Heading','text','About ','2026-07-04 17:53:07'),(47,'about','about_who_title','Who We Are Title','text','Who ','2026-07-04 17:53:07'),(48,'about','about_who_text','Who We Are Text','text','Delight Inter','2026-07-04 17:53:07'),(49,'about','about_mission_title','Mission Title','text','Our ','2026-07-04 17:53:07'),(50,'about','about_mission_text','Mission Text','text','To provide ','2026-07-04 17:53:07'),(51,'about','about_vision_title','Vision Title','text','Vision','2026-07-04 17:53:07'),(52,'about','about_vision_text','Vision Text','text','go','2026-07-04 17:53:08'),(53,'about','about_values_title','Values Title','text','Our','2026-07-04 17:53:08'),(54,'about','about_values_text','Values Text','text','Discipline,','2026-07-04 17:53:08'),(79,'contact','contact_heading','Contact Main Heading','text','Contact Us','2026-06-20 16:17:40'),(80,'contact','contact_intro_title','Contact Intro Title','text','Contact Information','2026-07-04 18:26:24'),(81,'contact','contact_intro_text','Contact Intro Text','text','We are ha','2026-07-04 18:20:09'),(82,'contact','contact_address_title','Address Title','text','Our Location','2026-06-20 16:17:40'),(83,'contact','contact_address_text','Address Text','text','Visit Delight ','2026-07-04 18:20:09'),(84,'contact','contact_phone_title','Phone Title','text','Phone Numbers','2026-06-20 18:14:28'),(85,'contact','contact_phone_text','Phone Text','text','0244113286 / 0277776449','2026-07-04 19:25:28'),(86,'contact','contact_email_title','Email Title','text','Email Address','2026-06-20 16:17:40'),(87,'contact','contact_email_text','Email Text','text','delightintschool@gmail.com','2026-06-20 18:14:28'),(88,'contact','contact_hours_title','Working Hours Title','text','Working Hours','2026-06-20 16:17:40'),(89,'contact','contact_hours_text','Working Hours Text','text','Monday to Friday: 6:00 AM to 4:00 PM','2026-07-04 18:14:41'),(90,'contact','contact_message_title','Message Title','text','Send Us a Message','2026-06-20 16:17:40'),(91,'contact','contact_message_text','Message Text','text','Fill the co','2026-07-04 18:20:09'),(92,'gallery','gallery_heading','Gallery Main Heading','text','Gallery','2026-06-20 16:21:54'),(93,'gallery','gallery_intro_title','Gallery Intro Title','text','Our School Gallery','2026-06-20 16:21:54'),(94,'gallery','gallery_intro_text','Gallery Intro Text','text','View ','2026-07-04 18:17:20'),(95,'contact','contact_location_title','Location Title','text','Location / Address','2026-06-20 18:14:28'),(96,'contact','contact_location_text','Location Text','textarea','Box AN 5044, Accra-North','2026-07-04 18:14:41'),(97,'contact','contact_social_title','Social Media Title','text','Social Media','2026-06-20 18:14:28'),(98,'contact','contact_map_title','Map Title','text','Map Location','2026-06-20 18:14:28'),(105,'admission','admission_online_title','Online Admission Title','text','Online Admission Enquirys','2026-06-20 18:22:55'),(106,'admission','admission_online_text','Online Admission Text','text','Parents and g','2026-07-04 17:53:36'),(107,'gallery','gallery_title','Gallery Title','text','Our School Gallery','2026-07-04 18:14:41'),(108,'gallery','gallery_intro','Gallery Introduction','textarea','View pictures from our school activities, programs, and special events.','2026-07-04 18:14:41'),(138,'events','events_main_heading','Events Main Heading','text','Events','2026-07-04 19:17:16'),(139,'events','events_intro_text','Events Introduction','textarea','Stay updated ','2026-07-04 19:20:57'),(140,'events','event1_date','Event 1 Date','text','21/02/2028','2026-07-04 19:27:26'),(141,'events','event1_time','Event 1 Time','text','12:35pm','2026-07-04 19:27:26'),(142,'events','event1_title','Event 1 Title','text','PTA Meeting','2026-07-04 19:17:16'),(143,'events','event1_text','Event 1 Description','textarea','Parents and guardians are invited to attend the PTA ','2026-07-04 19:27:26'),(144,'events','event2_date','Event 2 Date','text','12/08/2026','2026-07-04 19:27:26'),(145,'events','event2_time','Event 2 Time','text','Enter time','2026-07-04 19:17:16'),(146,'events','event2_title','Event 2 Title','text','12:35','2026-07-04 19:27:26'),(147,'events','event2_text','Event 2 Description','textarea','Details of the academic event will be displayed here.','2026-07-04 19:17:16'),(148,'events','event3_date','Event 3 Date','text','Enter date','2026-07-04 19:17:16'),(149,'events','event3_time','Event 3 Time','text','Enter time','2026-07-04 19:17:16'),(150,'events','event3_title','Event 3 Title','text','School Activity','2026-07-04 19:17:16'),(151,'events','event3_text','Event 3 Description','textarea','Details of the school activity will be displayed here.','2026-07-04 19:17:16');
/*!40000 ALTER TABLE `website_content_blocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `website_gallery`
--

DROP TABLE IF EXISTS `website_gallery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `website_gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image_title` varchar(150) DEFAULT NULL,
  `image_caption` text,
  `image_path` varchar(255) NOT NULL,
  `status` varchar(30) DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `category` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website_gallery`
--

LOCK TABLES `website_gallery` WRITE;
/*!40000 ALTER TABLE `website_gallery` DISABLE KEYS */;
INSERT INTO `website_gallery` VALUES (1,'cardet','','/uploads/gallery/gallery-1781972753453.png','deleted','2026-06-20 16:25:53',NULL),(2,'cardet','','/uploads/gallery/gallery-1781972817309.jpeg','deleted','2026-06-20 16:26:57',NULL),(3,'School Building','','/uploads/gallery/gallery-1781973720853.png','deleted','2026-06-20 16:42:00','school_building'),(4,'School Building','','/uploads/gallery/gallery-1781973749497.jpg','deleted','2026-06-20 16:42:29','school_building'),(5,'Sports Day','','/uploads/gallery/gallery-1781974002538.jpg','active','2026-06-20 16:46:42','sports_day'),(6,'Graduation','','/uploads/gallery/gallery-1781974113146.png','deleted','2026-06-20 16:48:33','graduation'),(7,'Excursion','','/uploads/gallery/gallery-1781974402636.jpeg','deleted','2026-06-20 16:53:22','excursion'),(8,'Clubs','','/uploads/gallery/gallery-1781975222267.jpeg','active','2026-06-20 17:07:02','clubs'),(9,'Cultural Day','','/uploads/gallery/gallery-1781975329476.jpeg','deleted','2026-06-20 17:08:49','cultural_day'),(10,'School Building','','/uploads/gallery/gallery-1783187798471.png','active','2026-07-04 17:56:38','school_building'),(11,'Excursion','','/uploads/gallery/gallery-1783189029298.png','active','2026-07-04 18:17:09','excursion');
/*!40000 ALTER TABLE `website_gallery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `website_pages`
--

DROP TABLE IF EXISTS `website_pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `website_pages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `page_key` varchar(50) NOT NULL,
  `page_title` varchar(150) NOT NULL,
  `section_title` varchar(150) DEFAULT NULL,
  `section_content` text,
  `button_text` varchar(100) DEFAULT NULL,
  `button_link` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `page_key` (`page_key`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `website_pages`
--

LOCK TABLES `website_pages` WRITE;
/*!40000 ALTER TABLE `website_pages` DISABLE KEYS */;
INSERT INTO `website_pages` VALUES (1,'home','1','Delight International School','1','Apply Now','https://docs.google.com/forms/d/e/1FAIpQLSe0gID4VYQBk6m1ZTvgodypO1bKIYs1m43R22ueAxqXClhK4Q/viewform','2026-07-13 00:44:02'),(2,'about','Us','About Delight International School','Who We Are\n\nr','','','2026-07-04 17:53:07'),(3,'admission','Admission','Admission Open','Admission is open for new pupils.','Apply Online Admission','https://docs.google.com/forms/d/e/1FAIpQLSe0gID4VYQBk6m1ZTvgodypO1bKIYs1m43R22ueAxqXClhK4Q/viewform','2026-07-13 00:44:02'),(4,'events','E','School','come and write','','vacation festival','2026-07-04 19:20:57'),(5,'gallery','','','goo','','','2026-07-04 18:16:26'),(6,'contact','Contact','Contact Us','Ge','','','2026-07-04 18:20:09');
/*!40000 ALTER TABLE `website_pages` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-19  0:27:55
