-- MySQL dump 10.13  Distrib 8.4.9, for Linux (x86_64)
--
-- Host: localhost    Database: delight_school_management
-- ------------------------------------------------------
-- Server version	8.4.9-0ubuntu0.25.10.1

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
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (1,4,8,'Account Update','Accounts','Kotobabi Admin updated an account status.','2026-06-06 07:29:02'),(2,4,8,'Account Status Change','Accounts','Changed Ama Boateng account status from active to locked.','2026-06-06 07:35:47'),(3,4,8,'Account Status Change','Accounts','Changed Akua Serwaa account status from active to disabled.','2026-06-06 07:36:23'),(4,4,8,'Account Status Change','Accounts','Changed Akua Serwaa account status from disabled to active.','2026-06-06 07:36:36'),(5,4,8,'Account Status Change','Accounts','Changed Ama Boateng account status from locked to active.','2026-06-06 07:36:40'),(6,4,8,'Student Added','Students','Registered student ama SAM with admission number AMD003.','2026-06-06 07:59:22'),(7,4,8,'Teacher Added','Teachers','Added teacher KOFI YAW with teacher ID TCH006.','2026-06-06 08:07:10'),(8,4,8,'Fee Recorded','Fees','Recorded fee for student ID 7. Payable: GHS 1000, Paid: GHS 500, Balance: GHS 500.','2026-06-06 08:10:22'),(9,4,8,'Announcement Posted','Announcements','Posted announcement: pta.','2026-06-06 08:13:24'),(10,5,9,'Announcement Posted','Announcements','Posted announcement: vacation.','2026-06-06 08:16:24'),(11,4,4,'Attendance Saved','Attendance','Saved attendance for student ID 1 as present on 2026-06-06.','2026-06-06 08:53:32'),(12,4,4,'Attendance Saved','Attendance','Saved attendance for student ID 5 as absent on 2026-06-06.','2026-06-06 08:53:33'),(13,4,4,'Score Added','Scores','Added English score for student ID 1. Total score: 90, Grade: A.','2026-06-06 09:02:12'),(14,4,1,'Announcement Posted','Announcements','Posted announcement: meeting.','2026-06-06 09:08:49'),(15,4,1,'Teacher Updated','Teachers','Updated teacher Akua Serwaa.','2026-06-06 10:38:24'),(16,4,1,'Teacher Updated','Teachers','Updated teacher KOFI YAW David.','2026-06-06 10:38:57'),(17,4,1,'Parent Updated','Parents','Updated parent Ama Boateng.','2026-06-06 10:46:34'),(18,4,1,'Parent Updated','Parents','Updated parent Ama Boateng Esi.','2026-06-06 10:46:57'),(19,1,1,'Student Updated','Students','Updated student YAW  KOFI n with admission number ADM006.','2026-06-06 10:49:52'),(20,1,1,'Student Updated','Students','Updated student SAM  KOFI manu with admission number AMD005.','2026-06-06 10:50:15'),(21,4,1,'Student Updated','Students','Updated student Abena Boateng with admission number ADM001.','2026-06-06 11:18:48'),(22,5,1,'Student Updated','Students','Updated student YAW  KOFI frank with admission number ADM006.','2026-06-06 11:20:20'),(23,4,1,'Student Updated','Students','Updated student KOFI SAM with admission number AMD004.','2026-06-06 11:21:14'),(24,4,1,'Teacher Updated','Teachers','Updated teacher KOFI YAW David.','2026-06-06 11:22:04'),(25,4,1,'Teacher Updated','Teachers','Updated teacher KOFI YAW David.','2026-06-06 11:22:24'),(26,4,1,'Score Approval Changed','Scores','Changed English score approval for student ID 1 to approved.','2026-06-06 11:23:11'),(27,4,1,'Account Status Change','Accounts','Changed Akua Serwaa account status from active to locked.','2026-06-06 11:59:58'),(28,4,1,'Student Updated','Students','Updated student Abena Boateng with admission number ADM001.','2026-06-06 12:01:25'),(29,4,1,'Student Updated','Students','Updated student ama SAM with admission number AMD003.','2026-06-06 12:19:20'),(30,4,1,'Student Updated','Students','Updated student ama SAM with admission number AMD003.','2026-06-06 12:24:44'),(31,4,1,'Student Updated','Students','Updated student ama SAM with admission number AMD003.','2026-06-06 12:25:22'),(32,4,1,'Student Updated','Students','Updated student Abena Boateng with admission number ADM001.','2026-06-06 12:26:50'),(33,4,1,'Student Updated','Students','Updated student Frank boateng with admission number AMD002.','2026-06-06 12:56:08'),(34,4,1,'Account Status Change','Accounts','Changed Akua Serwaa account status from locked to active.','2026-06-06 14:08:29'),(35,4,1,'Parent Updated','Parents','Updated parent Ama Boateng Esi.','2026-06-06 14:08:49'),(36,4,1,'Student Updated','Students','Updated student Frank boateng with admission number AMD002.','2026-06-06 14:57:06'),(37,4,1,'Account Status Updated','Accounts','Mr Boateng account changed to locked.','2026-06-06 15:48:30'),(38,4,1,'Account Status Updated','Accounts','Mr Boateng account changed to active.','2026-06-06 15:48:52'),(39,4,1,'Account Status Updated','Accounts','KOFI YAW David account changed to disabled.','2026-06-06 15:55:04'),(40,4,1,'Account Status Updated','Accounts','KOFI YAW David account changed to disabled.','2026-06-06 15:55:15'),(41,4,1,'Account Status Updated','Accounts','KOFI YAW David account changed to locked.','2026-06-06 15:55:20'),(42,4,1,'Account Status Updated','Accounts','KOFI YAW David account changed to active.','2026-06-06 15:55:23'),(43,4,1,'Account Status Updated','Accounts','KOFI YAW David account changed to locked.','2026-06-06 15:55:30'),(44,4,1,'Account Status Updated','Accounts','Ama Boateng Esi account changed to inactive.','2026-06-06 15:55:40'),(45,4,1,'Account Status Updated','Accounts','Ama Boateng Esi account changed to active.','2026-06-06 15:56:31'),(46,4,1,'Account Status Updated','Accounts','KOFI YAW David account changed to active.','2026-06-06 15:56:37'),(47,4,1,'Student Updated','Students','Updated student ama SAM with admission number AMD003.','2026-06-06 15:57:53'),(48,4,1,'Student Updated','Students','Updated student Frank boateng with admission number AMD002.','2026-06-06 15:58:11'),(49,4,1,'Student Updated','Students','Updated student Frank boateng with admission number AMD002.','2026-06-06 16:00:53'),(50,4,1,'Score Added','Scores','Added Maths score for student ID 7. Total score: 100, Grade: A.','2026-06-14 23:29:01'),(51,4,1,'Score Added','Scores','Added Maths score for student ID 6. Total score: 100, Grade: A.','2026-06-14 23:44:54');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (2,4,'pta','no meeting tomorrow','parents','draft',NULL,NULL,'2026-06-06 08:13:24'),(3,5,'vacation','vacation on 25 july 2026','all','draft',NULL,NULL,'2026-06-06 08:16:24'),(4,4,'meeting','staff meeting at ofankor sch','teachers','draft',NULL,NULL,'2026-06-06 09:08:49');
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
  KEY `student_id` (`student_id`),
  KEY `class_id` (`class_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `attendance_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (1,4,1,1,1,'2026-06-01','Term 2','2025/2026','present','On time','2026-06-03 20:16:36'),(2,4,1,1,1,'2026-06-02','Term 2','2025/2026','present','Arrived late','2026-06-03 20:16:36'),(3,4,1,1,1,'2026-06-03','Term 2','2025/2026','present','On time','2026-06-03 20:16:36'),(4,4,1,1,1,'2026-06-06','Term 1','2025/2026','present',NULL,'2026-06-06 08:53:32');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (1,'Main Campus','Main Location','','','','inactive','2026-05-30 23:01:37'),(4,'Kotobabi','Kotobabi','','','Kotobabi','active','2026-05-30 23:04:32'),(5,'Ofankor','Ofankor','','','Ofankor','active','2026-05-30 23:04:32');
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
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES (1,1,'Basic 4','2025/2026','active'),(2,1,'Basic 1','2025/2026','active'),(3,1,'Basic 5','2025/2026','active'),(5,NULL,'KG 1','2025/2026','active'),(6,NULL,'Nursery','2025/2026','active'),(16,4,'Basic 6','2025/2026','active'),(17,NULL,'Nursery 1','','active'),(18,NULL,'Nursery 2','','active'),(19,NULL,'KG 2','','active'),(20,NULL,'Basic 2','','active'),(21,NULL,'Basic 3','','active'),(22,NULL,'JHS 1','','active'),(23,NULL,'JHS 2','','active'),(24,NULL,'JHS 3','','active');
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fees`
--

LOCK TABLES `fees` WRITE;
/*!40000 ALTER TABLE `fees` DISABLE KEYS */;
INSERT INTO `fees` VALUES (1,4,1,'Term 2','2025/2026',1200.00,800.00,400.00,'2026-06-03','part_payment','2026-06-03 20:20:25'),(2,4,7,'Term 2','2025/2026',1000.00,500.00,500.00,'2026-06-06','part_payment','2026-06-06 08:10:22');
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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parent_student_links`
--

LOCK TABLES `parent_student_links` WRITE;
/*!40000 ALTER TABLE `parent_student_links` DISABLE KEYS */;
INSERT INTO `parent_student_links` VALUES (1,1,1,'mother','2026-06-06 10:15:35'),(3,2,1,'father','2026-06-06 14:57:05'),(6,3,7,'mother','2026-06-06 15:57:53'),(7,4,7,'father','2026-06-06 15:57:53');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parents`
--

LOCK TABLES `parents` WRITE;
/*!40000 ALTER TABLE `parents` DISABLE KEYS */;
INSERT INTO `parents` VALUES (1,4,3,'GHA-111111111-1','Ama Boateng Esi','0243334444','ama.boateng@example.com','Kotobabi','2026-06-03 19:33:06','active'),(2,4,11,'GHA-222222222-2','Mr Boateng','0200000000',NULL,NULL,'2026-06-06 14:57:05','active'),(3,4,12,'GHA-002716669-9','MARY SAM','0244111111',NULL,NULL,'2026-06-06 15:57:53','active'),(4,4,13,'GHA-002716669-5','DAVID SAM','0244222222',NULL,NULL,'2026-06-06 15:57:53','active');
/*!40000 ALTER TABLE `parents` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
INSERT INTO `reports` VALUES (2,4,'Kotobabi Basic 4 Terminal Report','Terminal Report',1,'Term 2','2025/2026',1,'2026-06-06 05:38:10',NULL,NULL,NULL,NULL),(3,4,'Test Report','Terminal Report',1,'Term 1','2025/2026',1,'2026-06-15 00:24:10',NULL,'Good performance.','Keep improving.','10th September 2026'),(4,4,'Basic 4 report','Terminal Report',NULL,'Term 3','2025/2026',1,'2026-06-15 00:24:28',NULL,'always in school','good studentt','21 june 2026');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scores`
--

LOCK TABLES `scores` WRITE;
/*!40000 ALTER TABLE `scores` DISABLE KEYS */;
INSERT INTO `scores` VALUES (1,4,1,'ADM001',1,'Mathematics','Term 2','2025/2026',30.00,60.00,90.00,'A','1st','Excellent performance','manual','approved','2026-06-03 20:06:14'),(2,4,1,'ADM001',1,'English Language','Term 2','2025/2026',28.00,55.00,83.00,'A','2nd','Very good work','manual','approved','2026-06-03 20:06:14'),(3,4,1,'ADM001',1,'Science','Term 2','2025/2026',25.00,50.00,75.00,'B','4th','Good effort','manual','approved','2026-06-03 20:06:14'),(4,4,1,'ADM001',1,'English','Term 1','2025/2026',30.00,60.00,90.00,'A',NULL,NULL,'manual','approved','2026-06-06 09:02:11'),(5,4,7,'AMD003',6,'Maths','Term 2','2026/2027',30.00,70.00,100.00,'A','1st','good','manual','pending','2026-06-14 23:29:01'),(6,4,6,'AMD004',5,'Maths','Term 1','2025/2026',30.00,70.00,100.00,'A','5th','good','manual','approved','2026-06-14 23:44:54');
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
INSERT INTO `settings` VALUES (1,'Delight International School','Knowledge and Discipline Updated','0244113286 / 0277776449','delightintschool@gmail.com','Box AN 5044 Accra-Noth','/uploads/logo/school-logo-1781479368249.jpg','2025/2026','Term 1',30.00,70.00,100.00,50.00,'Ghana Card Number','Phone Number','yes',5,80.00,100.00,'Excellent',70.00,79.00,'Very Good',60.00,69.00,'Good',50.00,59.00,'Pass',0.00,49.00,'Needs Improvement','2026-06-14 23:22:48');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,4,'AMD002','AMD002','Frank boateng','Abena','Boateng',NULL,'Male','2015-04-12','Accra','Ghanaian','English, Twi',16,'GHA-111111111-1',NULL,'Ama Boateng Esi','GHA-111111111-1','0243334444','Mr Boateng','GHA-222222222-2','0200000000',NULL,'active','2026-05-27 11:41:43',NULL),(2,1,'STU005','AMD005','SAM  KOFI manu','SAM','KOFI',NULL,'Male','2021-02-02','ACCRA','Ghanaian',NULL,2,'GHA-002716665-9',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active','2026-05-27 12:21:43',NULL),(3,5,'ADM006','ADM006','YAW  KOFI frank','YAW','KOFI',NULL,'Male','2010-02-02','ACCRA','Ghanaian',NULL,3,'GHA-003716665-4',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active','2026-05-27 12:42:17',NULL),(4,1,'STU007','ADM007','YAW DARKO manu','YAW','manu','DARKO','Male','1905-02-01','ACCRA','Ghanaian',NULL,3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active','2026-05-27 13:03:12',NULL),(6,4,'AMD004','AMD004','KOFI SAM','KOFI','SAM',NULL,'Male','2022-06-21','ACCRA','Ghanaian','Twi English',5,'GHA-002716669-9','0244111111','MARY SAM','GHA-002716669-9','0244111111','DAVID SAM','GHA-002716669-5','0244222222',NULL,'active','2026-06-06 07:54:51',NULL),(7,4,'AMD003','AMD003','ama SAM','ama','SAM',NULL,'Female','2021-06-21','ACCRA','Ghanaian','Twi English',6,'GHA-002716669-9','0244111111','MARY SAM','GHA-002716669-9','0244111111','DAVID SAM','GHA-002716669-5','0244222222',NULL,'stopped','2026-06-06 07:59:22',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_assignments`
--

LOCK TABLES `teacher_assignments` WRITE;
/*!40000 ALTER TABLE `teacher_assignments` DISABLE KEYS */;
INSERT INTO `teacher_assignments` VALUES (1,4,1,1,'Mathematics','Class Teacher','2025/2026','active'),(2,4,1,1,'Twi','Class Teacher','2025/2026','active'),(3,4,1,1,'Mathematics','Class Teacher','2025/2026','active');
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `teacher_id` (`teacher_id`),
  UNIQUE KEY `ghana_card_number` (`ghana_card_number`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES (1,4,4,'TCH003','Akua Serwaa','GHA-333333333-3','0203334444','akua.serwaa@example.com',NULL,NULL,'active','2026-05-27 12:26:23'),(3,4,10,'TCH006','KOFI YAW David','GHA-22222222-2','0244333333',NULL,NULL,NULL,'active','2026-06-06 08:07:10');
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'School Admin','GHA-000000000-0','$2b$10$EdMShYK9jvKGi3vkUdRKd.QPZeOe/LqmdOTRGdCw0CMG4ZQhCCoEy','super_admin','0240000000','admin@delightschool.com','active','2026-05-27 11:03:25','2026-06-15 00:24:09'),(2,1,'Kwame Mensah','GHA-123456789-1','$2b$10$eDvPBIcU/fKnmoXXI95w8uMJs32g7XiX8/NFgElyWGwP0xB6q9guG','teacher','0201112222','kwame.mensah@example.com','active','2026-05-27 11:34:53','2026-05-27 13:03:55'),(3,4,'Ama Boateng Esi','GHA-111111111-1','$2b$10$h4Dt4Rnx24QeRyRVzHwqwuxQkAttOyJ6jxbcB/JWioSQPlQlykOhe','parent','0243334444','ama.boateng@example.com','active','2026-05-27 11:36:47','2026-06-06 16:08:14'),(4,4,'Akua Serwaa','GHA-333333333-3','$2b$10$7QxwvtaTYLxMUB3nskBSsuycnkzHAk.vn1YyOWPEw5.FTWYh2s8Ua','teacher','0203334444','akua.serwaa@example.com','active','2026-05-27 12:26:23','2026-06-06 09:58:48'),(8,4,'Kotobabi Admin','GHA-444444111-1','$2b$10$BXfRSf7wfHvpmRjJNqJYXexEBtDE6KY8AUT4CWIffmHCWHUwc.Tze','branch_admin','0244441111','kotobabi.admin@example.com','active','2026-06-03 20:31:24','2026-06-06 08:15:38'),(9,5,'Ofankor Admin','GHA-555555222-2','$2b$10$7Wt.JCxOerYv.Wv6dqLq9eiWM.Ilg03C8Zhr0erjhPp7CqwCJrwwy','branch_admin','0245552222','ofankor.admin@example.com','active','2026-06-03 20:31:46','2026-06-06 08:15:46'),(10,4,'KOFI YAW David','GHA-22222222-2','$2b$10$TwzREy73XTv0x86QXWjv7eEog9ZItUtbdb244v4i4dNcO.5Jv3MoG','teacher','0244333333',NULL,'active','2026-06-06 08:07:09','2026-06-06 16:09:23'),(11,4,'Mr Boateng','GHA-222222222-2','$2b$10$KqONWLLnQ08PorR9/mGr.ugG3.8vvKRXQ/IeGcEDF6O4MsY1ptI/a','parent','0200000000','father.boateng@example.com','active','2026-06-06 10:15:57','2026-06-06 16:22:17'),(12,4,'MARY SAM','GHA-002716669-9','$2b$10$ZEJ59PBcYG0GOIUieVrKGOJ3atEfnAzV1tyVO1kvUJONvfMPr4wBW','parent','0244111111',NULL,'active','2026-06-06 15:57:52',NULL),(13,4,'DAVID SAM','GHA-002716669-5','$2b$10$r82lZXZswsaj6kJkNC5xTOIKmqhapwxbcIkcrnXhxKKmxX9pgH1qa','parent','0244222222',NULL,'active','2026-06-06 15:57:53',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-15  0:34:28
