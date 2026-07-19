-- MySQL dump 10.13  Distrib 8.4.10, for Linux (x86_64)
--
-- Host: localhost    Database: delight_school_management
-- ------------------------------------------------------
-- Server version	8.4.10-0ubuntu0.25.10.1

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
) ENGINE=InnoDB AUTO_INCREMENT=154 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (1,4,8,'Account Update','Accounts','Kotobabi Admin updated an account status.','2026-06-06 07:29:02'),(2,4,8,'Account Status Change','Accounts','Changed Ama Boateng account status from active to locked.','2026-06-06 07:35:47'),(3,4,8,'Account Status Change','Accounts','Changed Akua Serwaa account status from active to disabled.','2026-06-06 07:36:23'),(4,4,8,'Account Status Change','Accounts','Changed Akua Serwaa account status from disabled to active.','2026-06-06 07:36:36'),(5,4,8,'Account Status Change','Accounts','Changed Ama Boateng account status from locked to active.','2026-06-06 07:36:40'),(6,4,8,'Student Added','Students','Registered student ama SAM with admission number AMD003.','2026-06-06 07:59:22'),(7,4,8,'Teacher Added','Teachers','Added teacher KOFI YAW with teacher ID TCH006.','2026-06-06 08:07:10'),(8,4,8,'Fee Recorded','Fees','Recorded fee for student ID 7. Payable: GHS 1000, Paid: GHS 500, Balance: GHS 500.','2026-06-06 08:10:22'),(9,4,8,'Announcement Posted','Announcements','Posted announcement: pta.','2026-06-06 08:13:24'),(10,5,9,'Announcement Posted','Announcements','Posted announcement: vacation.','2026-06-06 08:16:24'),(11,4,4,'Attendance Saved','Attendance','Saved attendance for student ID 1 as present on 2026-06-06.','2026-06-06 08:53:32'),(12,4,4,'Attendance Saved','Attendance','Saved attendance for student ID 5 as absent on 2026-06-06.','2026-06-06 08:53:33'),(13,4,4,'Score Added','Scores','Added English score for student ID 1. Total score: 90, Grade: A.','2026-06-06 09:02:12'),(14,4,1,'Announcement Posted','Announcements','Posted announcement: meeting.','2026-06-06 09:08:49'),(15,4,1,'Teacher Updated','Teachers','Updated teacher Akua Serwaa.','2026-06-06 10:38:24'),(16,4,1,'Teacher Updated','Teachers','Updated teacher KOFI YAW David.','2026-06-06 10:38:57'),(17,4,1,'Parent Updated','Parents','Updated parent Ama Boateng.','2026-06-06 10:46:34'),(18,4,1,'Parent Updated','Parents','Updated parent Ama Boateng Esi.','2026-06-06 10:46:57'),(19,1,1,'Student Updated','Students','Updated student YAW  KOFI n with admission number ADM006.','2026-06-06 10:49:52'),(20,1,1,'Student Updated','Students','Updated student SAM  KOFI manu with admission number AMD005.','2026-06-06 10:50:15'),(21,4,1,'Student Updated','Students','Updated student Abena Boateng with admission number ADM001.','2026-06-06 11:18:48'),(22,5,1,'Student Updated','Students','Updated student YAW  KOFI frank with admission number ADM006.','2026-06-06 11:20:20'),(23,4,1,'Student Updated','Students','Updated student KOFI SAM with admission number AMD004.','2026-06-06 11:21:14'),(24,4,1,'Teacher Updated','Teachers','Updated teacher KOFI YAW David.','2026-06-06 11:22:04'),(25,4,1,'Teacher Updated','Teachers','Updated teacher KOFI YAW David.','2026-06-06 11:22:24'),(26,4,1,'Score Approval Changed','Scores','Changed English score approval for student ID 1 to approved.','2026-06-06 11:23:11'),(27,4,1,'Account Status Change','Accounts','Changed Akua Serwaa account status from active to locked.','2026-06-06 11:59:58'),(28,4,1,'Student Updated','Students','Updated student Abena Boateng with admission number ADM001.','2026-06-06 12:01:25'),(29,4,1,'Student Updated','Students','Updated student ama SAM with admission number AMD003.','2026-06-06 12:19:20'),(30,4,1,'Student Updated','Students','Updated student ama SAM with admission number AMD003.','2026-06-06 12:24:44'),(31,4,1,'Student Updated','Students','Updated student ama SAM with admission number AMD003.','2026-06-06 12:25:22'),(32,4,1,'Student Updated','Students','Updated student Abena Boateng with admission number ADM001.','2026-06-06 12:26:50'),(33,4,1,'Student Updated','Students','Updated student Frank boateng with admission number AMD002.','2026-06-06 12:56:08'),(34,4,1,'Account Status Change','Accounts','Changed Akua Serwaa account status from locked to active.','2026-06-06 14:08:29'),(35,4,1,'Parent Updated','Parents','Updated parent Ama Boateng Esi.','2026-06-06 14:08:49'),(36,4,1,'Student Updated','Students','Updated student Frank boateng with admission number AMD002.','2026-06-06 14:57:06'),(37,4,1,'Account Status Updated','Accounts','Mr Boateng account changed to locked.','2026-06-06 15:48:30'),(38,4,1,'Account Status Updated','Accounts','Mr Boateng account changed to active.','2026-06-06 15:48:52'),(39,4,1,'Account Status Updated','Accounts','KOFI YAW David account changed to disabled.','2026-06-06 15:55:04'),(40,4,1,'Account Status Updated','Accounts','KOFI YAW David account changed to disabled.','2026-06-06 15:55:15'),(41,4,1,'Account Status Updated','Accounts','KOFI YAW David account changed to locked.','2026-06-06 15:55:20'),(42,4,1,'Account Status Updated','Accounts','KOFI YAW David account changed to active.','2026-06-06 15:55:23'),(43,4,1,'Account Status Updated','Accounts','KOFI YAW David account changed to locked.','2026-06-06 15:55:30'),(44,4,1,'Account Status Updated','Accounts','Ama Boateng Esi account changed to inactive.','2026-06-06 15:55:40'),(45,4,1,'Account Status Updated','Accounts','Ama Boateng Esi account changed to active.','2026-06-06 15:56:31'),(46,4,1,'Account Status Updated','Accounts','KOFI YAW David account changed to active.','2026-06-06 15:56:37'),(47,4,1,'Student Updated','Students','Updated student ama SAM with admission number AMD003.','2026-06-06 15:57:53'),(48,4,1,'Student Updated','Students','Updated student Frank boateng with admission number AMD002.','2026-06-06 15:58:11'),(49,4,1,'Student Updated','Students','Updated student Frank boateng with admission number AMD002.','2026-06-06 16:00:53'),(50,4,1,'Score Added','Scores','Added Maths score for student ID 7. Total score: 100, Grade: A.','2026-06-14 23:29:01'),(51,4,1,'Score Added','Scores','Added Maths score for student ID 6. Total score: 100, Grade: A.','2026-06-14 23:44:54'),(52,5,1,'Attendance Saved','Attendance','Saved attendance for student ID 3 as present on 2023-02-22.','2026-06-15 22:15:33'),(53,4,10,'Excel Scores Uploaded','Scores','Uploaded Excel scores for English. Saved: 1, Updated: 0, Skipped: 0.','2026-06-15 22:58:06'),(54,4,1,'Score Approval Changed','Scores','Changed English score approval for student ID 1 to approved.','2026-06-16 21:55:23'),(55,4,1,'Score Approval Changed','Scores','Changed Maths score approval for student ID 7 to approved.','2026-06-16 21:55:40'),(56,4,1,'Score Approval Changed','Scores','Changed English score approval for student ID 1 to pending.','2026-06-16 21:56:10'),(57,4,1,'Score Approval Changed','Scores','Changed English score approval for student ID 1 to pending.','2026-06-16 21:59:30'),(58,4,1,'Bulk Score Approval','Scores','Bulk changed English scores to approved. Records affected: 1.','2026-06-16 22:01:34'),(59,4,1,'Bulk Score Approval','Scores','Bulk changed English scores to approved. Records affected: 0.','2026-06-16 22:01:34'),(60,4,1,'Bulk Score Approval','Scores','Bulk changed English scores to approved. Records affected: 0.','2026-06-16 22:07:08'),(61,4,1,'Bulk Score Approval','Scores','Bulk changed English scores to approved. Records affected: 0.','2026-06-16 22:07:11'),(62,4,1,'Bulk Score Approval','Scores','Bulk changed English scores to approved. Records affected: 0.','2026-06-16 22:10:19'),(63,4,1,'Bulk Score Approval','Scores','Bulk changed English scores to approved. Records affected: 0.','2026-06-16 22:10:20'),(64,4,1,'Bulk Score Approval','Scores','Bulk changed English scores to approved. Records affected: 0.','2026-06-16 22:14:29'),(65,4,1,'Bulk Score Approval','Scores','Bulk changed English scores to approved. Records affected: 0.','2026-06-16 22:14:29'),(66,4,1,'Bulk Score Approval','Scores','Bulk changed English scores to approved. Records affected: 0.','2026-06-16 22:14:52'),(67,4,1,'Bulk Score Approval','Scores','Bulk changed English scores to approved. Records affected: 0.','2026-06-16 22:15:01'),(68,4,1,'Student Updated','Students','Updated student ama SAM with admission number AMD003.','2026-06-19 21:06:00'),(69,4,1,'Student Updated','Students','Updated student ama SAM with admission number AMD003.','2026-06-19 21:10:12'),(70,4,1,'Fee Payment Added','Fees','Added payment of GHS 500 for fee ID 2. Total paid: GHS 500, Balance: GHS 500.','2026-06-20 05:37:26'),(71,4,1,'Fee Payment Added','Fees','Added payment of GHS 100 for fee ID 2. Total paid: GHS 600, Balance: GHS 400.','2026-06-20 05:38:11'),(72,4,1,'Fee Payment Added','Fees','Added payment of GHS 200 for fee ID 1. Total paid: GHS 200, Balance: GHS 1000.','2026-06-20 05:39:23'),(73,4,1,'Score Approval Changed','Scores','Changed English score approval for student ID 1 to pending.','2026-06-20 05:45:07'),(74,4,1,'Score Added','Scores','Added ENGLISH score for student ID 1. Total score: 70, Grade: B.','2026-06-20 05:48:10'),(75,4,1,'Score Added','Scores','Added ENGLISH score for student ID 1. Total score: 70, Grade: B.','2026-06-20 06:16:10'),(76,4,1,'Score Approval Changed','Scores','Changed ENGLISH score approval for student ID 1 to approved.','2026-06-20 06:17:22'),(77,4,1,'Score Approval Changed','Scores','Changed ENGLISH score approval for student ID 1 to approved.','2026-06-20 06:17:22'),(78,4,1,'Score Approval Changed','Scores','Changed English score approval for student ID 1 to approved.','2026-06-20 06:26:11'),(79,4,1,'Score Approval Changed','Scores','Changed English score approval for student ID 1 to approved.','2026-06-20 06:26:11'),(80,4,1,'Score Added','Scores','Added ENGLISH score for student ID 6. Total score: 80, Grade: A.','2026-06-20 07:46:57'),(81,4,1,'Score Approval Changed','Scores','Changed ENGLISH score approval for student ID 6 to approved.','2026-06-20 07:47:27'),(82,4,1,'Score Approval Changed','Scores','Changed ENGLISH score approval for student ID 6 to approved.','2026-06-20 07:47:27'),(83,5,9,'Fee Recorded','Fees','Recorded fee for student ID 3. Payable: GHS 500, Paid: GHS 300, Balance: GHS 200.','2026-06-20 08:11:33'),(84,5,9,'Fee Payment Added','Fees','Added payment of GHS 100 for fee ID 3. Total paid: GHS 100, Balance: GHS 400.','2026-06-20 08:12:10'),(85,5,9,'Fee Payment Added','Fees','Added payment of GHS 300 for fee ID 3. Total paid: GHS 400, Balance: GHS 100.','2026-06-20 08:12:42'),(86,4,8,'Student Updated','Students','Updated student Frank boateng with admission number AMD002.','2026-06-20 11:15:58'),(87,4,1,'Fee Payment Added','Fees','Added payment of GHS 50 for fee ID 2. Total paid: GHS 650, Balance: GHS 350.','2026-07-04 14:08:24'),(88,5,1,'Class Term Fee Applied','Fees','Applied GHS 500 fee to class ID 16 for Term 1, 2025/2026. Created: 0, Updated: 1.','2026-07-04 14:31:42'),(89,5,1,'Class Term Fee Applied','Fees','Applied GHS 500 fee to class ID 16 for Term 2, 2025/2026. Created: 1, Updated: 0.','2026-07-04 14:32:25'),(90,4,1,'Teacher Updated','Teachers','Updated teacher KOFI YAW David.','2026-07-04 16:00:00'),(91,4,1,'Teacher Updated','Teachers','Updated teacher KOFI YAW David.','2026-07-04 16:00:13'),(92,4,1,'Teacher Updated','Teachers','Updated teacher KOFI YAW David.','2026-07-04 16:00:24'),(93,4,1,'Teacher Updated','Teachers','Updated teacher KOFI YAW David.','2026-07-04 16:05:24'),(94,4,1,'Teacher Updated','Teachers','Updated teacher KOFI YAW David.','2026-07-04 16:05:36'),(95,4,1,'Parent Updated','Parents','Updated parent Ama Boateng Esi.','2026-07-04 17:13:44'),(96,4,1,'Parent Updated','Parents','Updated parent DAVID SAM.','2026-07-04 17:13:54'),(97,4,1,'Parent Updated','Parents','Updated parent DAVID SAM.','2026-07-04 17:14:18'),(98,4,1,'Parent Updated','Parents','Updated parent DAVID SAM.','2026-07-04 17:22:05'),(99,4,1,'Parent Updated','Parents','Updated parent MARY SAM.','2026-07-04 17:22:13'),(100,4,1,'Parent Updated','Parents','Updated parent DAVID SAM.','2026-07-04 17:25:10'),(101,4,1,'Parent Updated','Parents','Updated parent MARY SAM.','2026-07-04 17:25:18'),(102,4,1,'Account Status Updated','Accounts','Akua Serw account changed to inactive.','2026-07-04 17:25:42'),(103,4,1,'Account Status Updated','Accounts','DAVID SAM account changed to disabled.','2026-07-04 17:25:55'),(104,4,1,'Account Status Updated','Accounts','DAVID SAM account changed to active.','2026-07-04 17:25:59'),(105,4,1,'Account Status Updated','Accounts','Akua Serw account changed to active.','2026-07-04 17:26:03'),(106,NULL,1,'Announcement Posted','Announcements','Posted announcement: good.','2026-07-04 17:35:14'),(107,NULL,1,'Announcement Posted','Announcements','Posted announcement: fil.','2026-07-04 17:35:31'),(108,NULL,1,'Announcement Posted','Announcements','Posted announcement: h.','2026-07-04 17:36:32'),(109,NULL,1,'Announcement Posted','Announcements','Posted announcement: k.','2026-07-04 17:41:43'),(110,NULL,1,'Announcement Posted','Announcements','Posted announcement: h.','2026-07-04 17:42:04'),(111,NULL,1,'Announcement Posted','Announcements','Posted announcement: k.','2026-07-04 17:47:26'),(112,5,1,'Fee Payment Added','Fees','Added payment of GHS 100 for fee ID 4. Total paid: GHS 100, Balance: GHS 500.','2026-07-04 19:51:21'),(113,4,1,'Teacher Updated','Teachers','Updated teacher KOFI YAW David.','2026-07-04 19:54:28'),(114,4,1,'Teacher Updated','Teachers','Updated teacher KOFI YAW David.','2026-07-04 19:54:40'),(115,4,1,'Parent Updated','Parents','Updated parent DAVID SAM.','2026-07-04 19:55:13'),(116,4,1,'Account Status Updated','Accounts','DAVID SAM account changed to active.','2026-07-04 20:12:03'),(117,5,9,'Class Term Fee Applied','Fees','Applied GHS 500 fee to class ID 16 for Term 1, 2025/2026. Created: 0, Updated: 1.','2026-07-04 21:35:23'),(118,5,9,'Fee Payment Added','Fees','Added payment of GHS 150 for fee ID 4. Total paid: GHS 250, Balance: GHS 350.','2026-07-04 21:40:05'),(119,4,8,'Excel Scores Uploaded','Scores','Uploaded Excel scores for ENGLISH. Saved: 0, Updated: 0, Skipped: 0.','2026-07-04 21:57:48'),(120,4,8,'Score Added','Scores','Added ENGLISH score for student ID 1. Total score: 100, Grade: A.','2026-07-04 22:14:49'),(121,4,8,'Score Approval Changed','Scores','Changed ENGLISH score approval for student ID 1 to approved.','2026-07-04 22:15:25'),(122,4,8,'Score Approval Changed','Scores','Changed ENGLISH score approval for student ID 1 to approved.','2026-07-04 22:15:25'),(123,4,8,'Attendance Saved','Attendance','Saved attendance for student ID 1 as present on 0006-07-04.','2026-07-04 22:21:20'),(124,4,8,'Announcement Posted','Announcements','Posted announcement: gg.','2026-07-04 22:28:43'),(125,4,8,'Teacher Updated','Teachers','Updated teacher Akua Serwaa.','2026-07-04 22:50:21'),(126,4,8,'Teacher Updated','Teachers','Updated teacher Akua Serwaa.','2026-07-04 22:50:33'),(127,4,8,'Teacher Updated','Teachers','Updated teacher KOFI YAW David.','2026-07-04 22:50:43'),(128,4,8,'Teacher Updated','Teachers','Updated teacher KOFI YAW David.','2026-07-04 22:50:51'),(129,4,8,'Parent Updated','Parents','Updated parent DAVID SAM.','2026-07-04 23:11:14'),(130,4,8,'Parent Updated','Parents','Updated parent DAVID SAM.','2026-07-04 23:11:24'),(131,4,8,'Teacher Added','Teachers','Added teacher KOFI YAW MAX with teacher ID TCH005.','2026-07-05 07:20:19'),(132,4,8,'Teacher Updated','Teachers','Updated teacher KOFI YAW MAX.','2026-07-05 07:30:45'),(133,4,1,'Student Added','Students','Registered student Rboert_Akpo with admission number AMD101.','2026-07-05 19:59:25'),(134,5,1,'Student Added','Students','Registered student Robert Akpo yaw with admission number AMD1002.','2026-07-05 20:07:00'),(135,4,1,'Student Added','Students','Registered student KOFI SAmual with admission number AMD105.','2026-07-05 20:10:00'),(136,4,1,'Excel Scores Uploaded','Scores','Uploaded Excel scores for ENGLISH. Saved: 1, Updated: 1, Skipped: 0.','2026-07-05 20:14:55'),(137,4,1,'Score Added','Scores','Added MATHEMATICS score for student ID 14. Total score: 90, Grade: A.','2026-07-05 20:16:30'),(138,4,1,'Score Approval Changed','Scores','Changed ENGLISH score approval for student ID 14 to approved.','2026-07-05 20:17:23'),(139,4,1,'Score Approval Changed','Scores','Changed ENGLISH score approval for student ID 14 to approved.','2026-07-05 20:17:23'),(140,4,1,'Score Approval Changed','Scores','Changed English score approval for student ID 1 to approved.','2026-07-05 20:17:38'),(141,4,1,'Score Approval Changed','Scores','Changed English score approval for student ID 1 to approved.','2026-07-05 20:17:38'),(142,4,1,'Class Term Fee Applied','Fees','Applied GHS 500 fee to class ID 30 for Term 2, 2025/2026. Created: 2, Updated: 0.','2026-07-05 20:26:08'),(143,4,1,'Fee Payment Added','Fees','Added payment of GHS 200 for fee ID 6. Total paid: GHS 200, Balance: GHS 300.','2026-07-05 20:27:16'),(144,4,1,'Fee Payment Added','Fees','Added payment of GHS 400 for fee ID 6. Total paid: GHS 600, Balance: GHS -100.','2026-07-05 20:29:12'),(145,4,1,'Parent Updated','Parents','Updated parent DAVID akpo.','2026-07-05 20:40:19'),(146,4,1,'Parent Updated','Parents','Updated parent DAVID akpo.','2026-07-05 20:40:37'),(147,4,1,'Account Status Updated','Accounts','DAVID akpo account changed to disabled.','2026-07-05 20:41:06'),(148,4,1,'Account Status Updated','Accounts','DAVID akpo account changed to inactive.','2026-07-05 20:41:10'),(149,4,1,'Account Status Updated','Accounts','DAVID akpo account changed to active.','2026-07-05 20:41:16'),(150,4,4,'Score Added','Scores','Added MATHEMATICS score for student ID 8. Total score: 80, Grade: A.','2026-07-05 20:44:24'),(151,4,4,'Attendance Saved','Attendance','Saved attendance for student ID 8 as present on 2026-07-05.','2026-07-05 20:45:05'),(152,5,1,'Teacher Updated','Teachers','Updated teacher KOFI YAW MAX.','2026-07-05 21:24:01'),(153,5,1,'Parent Updated','Parents','Updated parent DAVID akpo.','2026-07-05 21:24:29');
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (5,NULL,'good','hi','all','draft',NULL,NULL,'2026-07-04 17:35:14'),(6,NULL,'fil','hii','all','draft',NULL,NULL,'2026-07-04 17:35:31'),(7,NULL,'h','f','all','draft',NULL,NULL,'2026-07-04 17:36:32'),(8,NULL,'k','same','teachers','draft',NULL,NULL,'2026-07-04 17:41:42'),(9,NULL,'h','h','all','draft',NULL,NULL,'2026-07-04 17:42:03'),(10,NULL,'k','fg','parents','draft',NULL,NULL,'2026-07-04 17:47:25'),(11,4,'gg','jjgjgj','parents','draft',NULL,NULL,'2026-07-04 22:28:43');
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (1,4,1,1,1,'2026-06-01','Term 2','2025/2026','present','On time','2026-06-03 20:16:36'),(2,4,1,1,1,'2026-06-02','Term 2','2025/2026','present','Arrived late','2026-06-03 20:16:36'),(3,4,1,24,NULL,'2026-06-03','Term 2','2025/2026','present','On time','2026-06-03 20:16:36'),(4,4,1,24,NULL,'2026-06-06','Term 1','2025/2026','present',NULL,'2026-06-06 08:53:32'),(6,5,3,3,NULL,'2023-02-22','Term 1','2025/2026','present',NULL,'2026-06-15 22:15:33'),(7,4,1,24,NULL,'2026-06-20','Term 2','2025/2026','present',NULL,'2026-06-20 06:43:47'),(8,4,1,24,NULL,'2026-06-20','Term 1','2025/2026','present','on time','2026-06-20 06:45:34'),(10,5,3,16,NULL,'2026-07-04','Term 1','2025/2026','present',NULL,'2026-07-04 12:12:41'),(11,4,1,30,NULL,'0006-07-04','Term 1','2025/2026','present',NULL,'2026-07-04 22:21:20'),(12,4,14,30,NULL,'2026-07-05','Term 1','2025/2026','present',NULL,'2026-07-05 20:22:47'),(13,4,1,30,NULL,'2026-07-05','Term 1','2025/2026','present',NULL,'2026-07-05 20:22:48'),(14,4,8,16,1,'2026-07-05','Term 1','2025/2026','present',NULL,'2026-07-05 20:45:05');
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
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES (1,1,'Basic 4','2025/2026','active'),(2,1,'Basic 1','2025/2026','active'),(3,1,'Basic 5','2025/2026','active'),(16,4,'Basic 6','2025/2026','active'),(17,NULL,'Nursery 1','2025/2026','active'),(18,NULL,'Nursery 2','2025/2026','active'),(20,NULL,'Basic 2','2025/2026','active'),(21,NULL,'Basic 3','2025/2026','active'),(30,4,'Basic 9','2025/2026','active'),(31,NULL,'Kindergarten 1','2025/2026','active'),(32,NULL,'Kindergarten 2','2025/2026','active'),(33,NULL,'Basic 7','2025/2026','active'),(34,NULL,'Basic 8','2025/2026','active');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
INSERT INTO `contact_messages` VALUES (1,'ssa,m','set@gmail.com','233588446521','adminssion','for my child','email_failed','2026-06-20 17:26:32'),(2,'sam','set@gmail.com','200522446512','admission','my ward','email_failed','2026-06-20 17:36:28');
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fee_payments`
--

LOCK TABLES `fee_payments` WRITE;
/*!40000 ALTER TABLE `fee_payments` DISABLE KEYS */;
INSERT INTO `fee_payments` VALUES (1,2,4,7,500.00,'2026-06-20',NULL,1,'2026-06-20 05:37:26'),(2,2,4,7,100.00,'2026-06-20',NULL,1,'2026-06-20 05:38:11'),(3,1,4,3,200.00,'2026-06-20',NULL,1,'2026-06-20 05:39:23'),(4,3,5,3,100.00,'2026-06-20',NULL,9,'2026-06-20 08:12:10'),(5,3,5,3,300.00,'2026-06-20',NULL,9,'2026-06-20 08:12:42'),(6,2,4,7,50.00,'2026-07-04',NULL,1,'2026-07-04 14:08:24'),(7,4,5,3,100.00,'2026-07-04',NULL,1,'2026-07-04 19:51:21'),(8,4,5,3,150.00,'2026-07-04',NULL,9,'2026-07-04 21:40:05'),(9,6,4,14,200.00,'2026-07-05',NULL,1,'2026-07-05 20:27:15'),(10,6,4,14,400.00,'2026-07-05',NULL,1,'2026-07-05 20:29:12');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fees`
--

LOCK TABLES `fees` WRITE;
/*!40000 ALTER TABLE `fees` DISABLE KEYS */;
INSERT INTO `fees` VALUES (1,4,3,'Term 1','2025/2026',1200.00,200.00,1000.00,'2026-06-20','part_payment','2026-06-03 20:20:25'),(2,4,7,'Term 2','2025/2026',1000.00,650.00,350.00,'2026-07-04','part_payment','2026-06-06 08:10:22'),(3,5,3,'Term 1','2025/2026',1000.00,400.00,600.00,'2026-06-20','part_payment','2026-06-20 08:11:33'),(4,5,3,'Term 2','2025/2026',600.00,250.00,350.00,'2026-07-04','part_payment','2026-07-04 14:32:25'),(5,4,1,'Term 2','2025/2026',500.00,0.00,500.00,NULL,'unpaid','2026-07-05 20:26:08'),(6,4,14,'Term 2','2025/2026',500.00,600.00,-100.00,'2026-07-05','paid','2026-07-05 20:26:08');
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
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parent_student_links`
--

LOCK TABLES `parent_student_links` WRITE;
/*!40000 ALTER TABLE `parent_student_links` DISABLE KEYS */;
INSERT INTO `parent_student_links` VALUES (1,1,1,'mother','2026-06-06 10:15:35'),(3,2,1,'father','2026-06-06 14:57:05'),(6,3,7,'mother','2026-06-06 15:57:53'),(7,4,7,'father','2026-06-06 15:57:53'),(30,5,8,'mother','2026-07-05 19:59:25'),(31,6,8,'father','2026-07-05 19:59:25'),(32,7,13,'mother','2026-07-05 20:06:59'),(33,8,13,'father','2026-07-05 20:06:59'),(34,9,14,'mother','2026-07-05 20:10:00'),(35,10,14,'father','2026-07-05 20:10:00');
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parents`
--

LOCK TABLES `parents` WRITE;
/*!40000 ALTER TABLE `parents` DISABLE KEYS */;
INSERT INTO `parents` VALUES (1,4,3,'GHA-111111111-1','Ama Boateng Esi','0243334444','ama.boateng@example.com','Kotobabi','2026-06-03 19:33:06','active'),(2,4,11,'GHA-222222222-2','Mr Boateng','0200000000',NULL,NULL,'2026-06-06 14:57:05','active'),(3,4,12,'GHA-002716669-9','MARY SAM','0244111111',NULL,NULL,'2026-06-06 15:57:53','active'),(4,4,13,'GHA-002716669-5','DAVID SAM','0244222222',NULL,NULL,'2026-06-06 15:57:53','active'),(5,4,24,'GHA-055381780-5','Charity Amivor','0243776721',NULL,NULL,'2026-07-05 19:59:25','active'),(6,4,25,'GHA-123456789-0','Anthony Akpo','0244756437',NULL,NULL,'2026-07-05 19:59:25','active'),(7,5,26,'GHA-055381780-6','Rose Acqua','0243776722',NULL,NULL,'2026-07-05 20:06:59','active'),(8,5,27,'GHA-123456789-2','Kelvin sam','0244756436',NULL,NULL,'2026-07-05 20:06:59','active'),(9,4,28,'GHA-111111111-6','Charity Ama','0243776728',NULL,NULL,'2026-07-05 20:10:00','active'),(10,5,29,'GHA-123456789-8','DAVID akpo','0244756439',NULL,NULL,'2026-07-05 20:10:00','active');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotion_history`
--

LOCK TABLES `promotion_history` WRITE;
/*!40000 ALTER TABLE `promotion_history` DISABLE KEYS */;
INSERT INTO `promotion_history` VALUES (1,4,1,22,23,'JHS 1','JHS 2','2025/2026',1,'2026-06-15 22:39:36'),(2,4,1,23,24,'JHS 2','JHS 3','2026/2027',1,'2026-06-19 21:26:18'),(3,5,3,3,16,'Basic 5','Basic 6','2025/2026',1,'2026-06-20 04:59:28'),(4,4,14,34,30,'Basic 8','Basic 9','2025/2026',1,'2026-07-05 20:12:14');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
INSERT INTO `reports` VALUES (2,4,'Kotobabi Basic 4 Terminal Report','Terminal Report',1,'Term 2','2025/2026',1,'2026-06-06 05:38:10',NULL,NULL,NULL,NULL),(3,4,'Test Report','Terminal Report',1,'Term 1','2025/2026',1,'2026-06-15 00:24:10',NULL,'Good performance.','Keep improving.','10th September 2026'),(4,4,'Basic 4 report','Terminal Report',NULL,'Term 3','2025/2026',1,'2026-06-15 00:24:28',NULL,'always in school','good studentt','21 june 2026'),(5,4,'TER','Terminal Report',2,'Term 2','2025/2026',1,'2026-06-17 16:23:21',NULL,NULL,NULL,NULL),(6,4,'TER','Terminal Report',16,'Term 1','2025/2026',8,'2026-07-04 22:30:02',NULL,NULL,NULL,'2 sep 2026');
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scores`
--

LOCK TABLES `scores` WRITE;
/*!40000 ALTER TABLE `scores` DISABLE KEYS */;
INSERT INTO `scores` VALUES (1,4,1,'ADM001',1,'Mathematics','Term 2','2025/2026',30.00,60.00,90.00,'A','1st','Excellent performance','manual','approved','2026-06-03 20:06:14'),(2,4,1,'ADM001',1,'English Language','Term 2','2025/2026',28.00,55.00,83.00,'A','2nd','Very good work','manual','approved','2026-06-03 20:06:14'),(3,4,1,'ADM001',1,'Science','Term 2','2025/2026',25.00,50.00,75.00,'B','4th','Good effort','manual','approved','2026-06-03 20:06:14'),(4,4,1,'AMD002',30,'English','Term 1','2025/2026',20.00,75.00,95.00,'A',NULL,NULL,'excel_upload','approved','2026-06-06 09:02:11'),(11,4,1,'AMD002',30,'ENGLISH','Term 1','2025/2026',20.00,80.00,100.00,'A',NULL,NULL,'manual','approved','2026-07-04 22:14:48'),(12,4,14,'AMD105',30,'ENGLISH','Term 1','2025/2026',20.00,70.00,90.00,'A',NULL,NULL,'excel_upload','approved','2026-07-05 20:14:55'),(13,4,14,'AMD105',30,'MATHEMATICS','Term 1','2025/2026',15.00,75.00,90.00,'A',NULL,NULL,'manual','approved','2026-07-05 20:16:30'),(14,4,8,'AMD101',16,'MATHEMATICS','Term 1','2025/2026',20.00,60.00,80.00,'A',NULL,NULL,'manual','pending','2026-07-05 20:44:24');
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,4,'AMD002','AMD002','Frank boateng','Abena','Boateng',NULL,'Male','2015-04-12','Accra','Ghanaian','English, Twi',30,'GHA-111111111-1',NULL,'Ama Boateng Esi','GHA-111111111-1','0243334444','Mr Boateng','GHA-222222222-2','0200000000',NULL,'active','2026-05-27 11:41:43','/uploads/students/1781954157802-962641556.png'),(2,1,'STU005','AMD005','SAM  KOFI manu','SAM','KOFI',NULL,'Male','2021-02-02','ACCRA','Ghanaian',NULL,2,'GHA-002716665-9',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active','2026-05-27 12:21:43',NULL),(3,5,'ADM006','ADM006','YAW  KOFI frank','YAW','KOFI',NULL,'Male','2010-02-02','ACCRA','Ghanaian',NULL,16,'GHA-003716665-4',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active','2026-05-27 12:42:17',NULL),(4,1,'STU007','ADM007','YAW DARKO manu','YAW','manu','DARKO','Male','1905-02-01','ACCRA','Ghanaian',NULL,3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active','2026-05-27 13:03:12',NULL),(8,4,'AMD101','AMD101','Rboert_Akpo','Rboert_Akpo','-',NULL,'Male','2000-01-02','Accra','Ghanaian','Twi English',16,NULL,NULL,'Charity Amivor','GHA-055381780-5','0243776721','Anthony Akpo','GHA-123456789-0','0244756437',NULL,'active','2026-07-05 19:59:25',NULL),(13,5,'AMD1002','AMD1002','Robert Akpo yaw','Robert','Akpo yaw',NULL,'Female','2003-02-02','kumasi','Beninese','Twi English',33,NULL,NULL,'Rose Acqua','GHA-055381780-6','0243776722','Kelvin sam','GHA-123456789-2','0244756436',NULL,'active','2026-07-05 20:06:59','/uploads/students/1783282019103-988724776.png'),(14,4,'AMD105','AMD105','KOFI SAmual','KOFI','SAmual',NULL,'Male','2012-07-05','Accra','Burkinabe','English',30,NULL,NULL,'Charity Ama','GHA-111111111-6','0243776728','DAVID akpo','GHA-123456789-8','0244756439',NULL,'active','2026-07-05 20:09:59','/uploads/students/1783282199880-90802390.jpg');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_assignments`
--

LOCK TABLES `teacher_assignments` WRITE;
/*!40000 ALTER TABLE `teacher_assignments` DISABLE KEYS */;
INSERT INTO `teacher_assignments` VALUES (1,4,1,1,'Mathematics','Class Teacher','2025/2026','active'),(2,4,1,1,'Twi','Class Teacher','2025/2026','active'),(3,4,1,1,'Mathematics','Class Teacher','2025/2026','active'),(4,4,1,16,'ENGLISH','Subject Teacher','2025/2026','active'),(5,4,4,33,'SOCIAL STUDIES','Class Teacher','2025/2026','active');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES (1,4,4,'TCH003','Akua Serwaa','GHA-333333333-3','0203334446','aku7.serwaa@example.com',NULL,NULL,'active','2026-05-27 12:26:23','/uploads/teachers/teacher-profile-1783284178515.png'),(3,4,10,'TCH006','KOFI YAW David','GHA-22222222-2','0244333333',NULL,NULL,NULL,'active','2026-06-06 08:07:10','/uploads/teachers/teacher-profile-1781970909767.png'),(4,5,23,'TCH005','KOFI YAW MAX','GHA-002716665-8','0244113280',NULL,NULL,NULL,'active','2026-07-05 07:20:19',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'School Admin','GHA-000000000-0','$2b$10$5ogqRWJS7fyLLAVZx2d9Yu7qIDXFRpTjQNQJhJAgCnZfCn.GS4VPO','super_admin','0240000001','admin@delightschool.com','active','2026-05-27 11:03:25','2026-07-05 21:47:55','/uploads/admins/admin-profile-1783278793775.jpg'),(2,1,'Kwame Mensah','GHA-123456789-1','$2b$10$eDvPBIcU/fKnmoXXI95w8uMJs32g7XiX8/NFgElyWGwP0xB6q9guG','teacher','0201112222','kwame.mensah@example.com','active','2026-05-27 11:34:53','2026-05-27 13:03:55',NULL),(3,4,'Ama Boateng Esi','GHA-111111111-1','$2b$10$h4Dt4Rnx24QeRyRVzHwqwuxQkAttOyJ6jxbcB/JWioSQPlQlykOhe','parent','0243334444','ama.boateng@example.com','active','2026-05-27 11:36:47','2026-07-05 18:01:15',NULL),(4,4,'Akua Serwaa','GHA-333333333-3','$2b$10$uQ/rPd4HdopwnVjSp3mlW./gZrsoa1U4fyyYlRXU92Xvw9D1YnFCu','teacher','0203334446','aku7.serwaa@example.com','active','2026-05-27 12:26:23','2026-07-05 20:42:26',NULL),(8,4,'Kotobabi Admin','GHA-444444111-1','$2b$10$IBmW/63kj2EMHsNzCYXvRO4VLObVrwOo4LbdODuIH5Qr3kX6ZuPJS','branch_admin','0244441111','kotobabi.admin@example.com','active','2026-06-03 20:31:24','2026-07-05 19:27:09','/uploads/admins/admin-profile-1783200204143.png'),(9,5,'Ofankor Admin','GHA-555555222-2','$2b$10$Ihd51f5IikT.dmTN6WvHTugrJlLH5MaypUu.1yU8POggGFDJ5ZBUW','branch_admin','0245552222','ofankor.admin@example.com','active','2026-06-03 20:31:46','2026-07-05 17:57:30','/uploads/admins/admin-profile-1781958058688.jpeg'),(10,4,'KOFI YAW David','GHA-22222222-2','$2b$10$IFlaqeoc5x1Uvgs/uDNMguXZIXynAH3xeXm0z89GRjz.fqCA4M4uC','teacher','0244333333',NULL,'active','2026-06-06 08:07:09','2026-07-05 18:00:38',NULL),(11,4,'Mr Boateng','GHA-222222222-2','$2b$10$KqONWLLnQ08PorR9/mGr.ugG3.8vvKRXQ/IeGcEDF6O4MsY1ptI/a','parent','0200000000','father.boateng@example.com','active','2026-06-06 10:15:57','2026-06-06 16:22:17',NULL),(12,4,'MARY SAM','GHA-002716669-9','$2b$10$ZEJ59PBcYG0GOIUieVrKGOJ3atEfnAzV1tyVO1kvUJONvfMPr4wBW','parent','0244111111',NULL,'active','2026-06-06 15:57:52',NULL,NULL),(13,4,'DAVID SAM','GHA-002716669-5','$2b$10$r82lZXZswsaj6kJkNC5xTOIKmqhapwxbcIkcrnXhxKKmxX9pgH1qa','parent','0244222222',NULL,'active','2026-06-06 15:57:53',NULL,NULL),(20,4,'Akua Serw','GHA-333333333-4','$2b$10$wDkYT7Ic6ZwkH.SX915c1uI83gy357NH.Spm58SiC.vp/ZpK6y6wK','teacher','0203334447','aku7.serwaa@example.com','active','2026-07-04 15:45:59',NULL,NULL),(23,5,'KOFI YAW MAX','GHA-002716665-8','$2b$10$7gZZV9Y.OI8.SEo7V/vlP.Ks5/MglXyMRsLu5yUTz.86rCaDYhFLO','teacher','0244113280',NULL,'active','2026-07-05 07:20:19',NULL,NULL),(24,4,'Charity Amivor','GHA-055381780-5','$2b$10$fylmkrYepc/dmmGxJiMJo.KtRG9Dxu5LL0eyvDFosetGS0MjtH4GG','parent','0243776721',NULL,'active','2026-07-05 19:59:25',NULL,NULL),(25,4,'Anthony Akpo','GHA-123456789-0','$2b$10$XK.INOj1fB2ci972/g2L8OaRSYfbfWXGNnJwhFxK2Uoc6OJzLyaP2','parent','0244756437',NULL,'active','2026-07-05 19:59:25',NULL,NULL),(26,5,'Rose Acqua','GHA-055381780-6','$2b$10$UAQmkoix/a1/XXlese02z.3uLWHA1wZ49IwQ3ICycmH.zaqJ83A3a','parent','0243776722',NULL,'active','2026-07-05 20:06:59',NULL,NULL),(27,5,'Kelvin sam','GHA-123456789-2','$2b$10$oDnylotg7oegG1q//FJFgeBtJ4m34kFvn.9qf4MWNP/Rb1OF169sG','parent','0244756436',NULL,'active','2026-07-05 20:06:59',NULL,NULL),(28,4,'Charity Ama','GHA-111111111-6','$2b$10$ZLvZRYLIoNJtbaWbxJVNXOdNmyd2alztgjh2gcHOOa0VI9Pe9t6vy','parent','0243776728',NULL,'active','2026-07-05 20:10:00','2026-07-05 20:51:46',NULL),(29,5,'DAVID akpo','GHA-123456789-8','$2b$10$KPVnDjZuful4Tk3nvwxc2O3IN4iHvwRnpaMlVk1v5O6U9H5Os.E6C','parent','0244756439',NULL,'active','2026-07-05 20:10:00','2026-07-05 20:55:43',NULL);
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
INSERT INTO `website_content_blocks` VALUES (1,'home','home_stat_students_number','Students Number','text','5+','2026-07-04 17:52:18'),(2,'home','home_stat_students_label','Students Label','text','Stu','2026-07-04 17:52:18'),(3,'home','home_stat_teachers_number','Teachers Number','text','1+','2026-07-04 17:52:18'),(4,'home','home_stat_teachers_label','Teachers Label','text','Teac','2026-07-04 17:52:18'),(5,'home','home_stat_years_number','Years Number','text','2+','2026-07-04 17:52:18'),(6,'home','home_stat_years_label','Years Label','text','Service','2026-07-04 17:52:18'),(7,'home','home_stat_success_number','Success Rate Number','text','5%','2026-07-04 17:52:18'),(8,'home','home_stat_success_label','Success Rate Label','text','Rate','2026-07-04 17:52:18'),(9,'home','home_why_title','Why Choose Us Title','text','Choose Us?','2026-07-04 17:52:19'),(10,'home','home_quality_title','Quality Teaching Title','text','Teaching','2026-07-04 17:52:19'),(11,'home','home_quality_text','Quality Teaching Text','text','We ','2026-07-04 17:52:19'),(12,'home','home_discipline_title','Discipline Title','text','Disci','2026-07-04 17:52:19'),(13,'home','home_discipline_text','Discipline Text','text','We tr','2026-07-04 17:52:19'),(14,'home','home_parent_title','Parent Partnership Title','text','Parent ','2026-07-04 17:52:19'),(15,'home','home_parent_text','Parent Partnership Text','text','We wor','2026-07-04 17:52:19'),(46,'about','about_heading','About Main Heading','text','About ','2026-07-04 17:53:07'),(47,'about','about_who_title','Who We Are Title','text','Who ','2026-07-04 17:53:07'),(48,'about','about_who_text','Who We Are Text','text','Delight Inter','2026-07-04 17:53:07'),(49,'about','about_mission_title','Mission Title','text','Our ','2026-07-04 17:53:07'),(50,'about','about_mission_text','Mission Text','text','To provide ','2026-07-04 17:53:07'),(51,'about','about_vision_title','Vision Title','text','Vision','2026-07-04 17:53:07'),(52,'about','about_vision_text','Vision Text','text','go','2026-07-04 17:53:08'),(53,'about','about_values_title','Values Title','text','Our','2026-07-04 17:53:08'),(54,'about','about_values_text','Values Text','text','Discipline,','2026-07-04 17:53:08'),(79,'contact','contact_heading','Contact Main Heading','text','Contact Us','2026-06-20 16:17:40'),(80,'contact','contact_intro_title','Contact Intro Title','text','Contact Information','2026-07-04 18:26:24'),(81,'contact','contact_intro_text','Contact Intro Text','text','We are ha','2026-07-04 18:20:09'),(82,'contact','contact_address_title','Address Title','text','Our Location','2026-06-20 16:17:40'),(83,'contact','contact_address_text','Address Text','text','Visit Delight ','2026-07-04 18:20:09'),(84,'contact','contact_phone_title','Phone Title','text','Phone Numbers','2026-06-20 18:14:28'),(85,'contact','contact_phone_text','Phone Text','text','0244113286 / 0277776449','2026-07-04 19:25:28'),(86,'contact','contact_email_title','Email Title','text','Email Address','2026-06-20 16:17:40'),(87,'contact','contact_email_text','Email Text','text','delightintschool@gmail.com','2026-06-20 18:14:28'),(88,'contact','contact_hours_title','Working Hours Title','text','Working Hours','2026-06-20 16:17:40'),(89,'contact','contact_hours_text','Working Hours Text','text','Monday to Friday: 6:00 AM to 4:00 PM','2026-07-04 18:14:41'),(90,'contact','contact_message_title','Message Title','text','Send Us a Message','2026-06-20 16:17:40'),(91,'contact','contact_message_text','Message Text','text','Fill the co','2026-07-04 18:20:09'),(92,'gallery','gallery_heading','Gallery Main Heading','text','Gallery','2026-06-20 16:21:54'),(93,'gallery','gallery_intro_title','Gallery Intro Title','text','Our School Gallery','2026-06-20 16:21:54'),(94,'gallery','gallery_intro_text','Gallery Intro Text','text','View ','2026-07-04 18:17:20'),(95,'contact','contact_location_title','Location Title','text','Location / Address','2026-06-20 18:14:28'),(96,'contact','contact_location_text','Location Text','textarea','Box AN 5044, Accra-North','2026-07-04 18:14:41'),(97,'contact','contact_social_title','Social Media Title','text','Social Media','2026-06-20 18:14:28'),(98,'contact','contact_map_title','Map Title','text','Map Location','2026-06-20 18:14:28'),(105,'admission','admission_online_title','Online Admission Title','text','Online Admission Enquirys','2026-06-20 18:22:55'),(106,'admission','admission_online_text','Online Admission Text','text','Parents and g','2026-07-04 17:53:36'),(107,'gallery','gallery_title','Gallery Title','text','Our School Gallery','2026-07-04 18:14:41'),(108,'gallery','gallery_intro','Gallery Introduction','textarea','View pictures from our school activities, programs, and special events.','2026-07-04 18:14:41'),(138,'events','events_main_heading','Events Main Heading','text','Events','2026-07-04 19:17:16'),(139,'events','events_intro_text','Events Introduction','textarea','Stay updated ','2026-07-04 19:20:57'),(140,'events','event1_date','Event 1 Date','text','21/02/2028','2026-07-04 19:27:26'),(141,'events','event1_time','Event 1 Time','text','12:35pm','2026-07-04 19:27:26'),(142,'events','event1_title','Event 1 Title','text','PTA Meeting','2026-07-04 19:17:16'),(143,'events','event1_text','Event 1 Description','textarea','Parents and guardians are invited to attend the PTA ','2026-07-04 19:27:26'),(144,'events','event2_date','Event 2 Date','text','12/08/2026','2026-07-04 19:27:26'),(145,'events','event2_time','Event 2 Time','text','Enter time','2026-07-04 19:17:16'),(146,'events','event2_title','Event 2 Title','text','12:35','2026-07-04 19:27:26'),(147,'events','event2_text','Event 2 Description','textarea','Details of the academic event will be displayed here.','2026-07-04 19:17:16'),(148,'events','event3_date','Event 3 Date','text','Enter date','2026-07-04 19:17:16'),(149,'events','event3_time','Event 3 Time','text','Enter time','2026-07-04 19:17:16'),(150,'events','event3_title','Event 3 Title','text','School Activity','2026-07-04 19:17:16'),(151,'events','event3_text','Event 3 Description','textarea','Details of the school activity will be displayed here.','2026-07-04 19:17:16');
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
INSERT INTO `website_pages` VALUES (1,'home','1','Delight International School','1','','admission.html','2026-07-04 17:52:18'),(2,'about','Us','About Delight International School','Who We Are\n\nr','','','2026-07-04 17:53:07'),(3,'admission','Admission','Admission Open','Admission is open for new pupils.','','contact.html','2026-07-04 17:53:36'),(4,'events','E','School','come and write','','vacation festival','2026-07-04 19:20:57'),(5,'gallery','','','goo','','','2026-07-04 18:16:26'),(6,'contact','Contact','Contact Us','Ge','','','2026-07-04 18:20:09');
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

-- Dump completed on 2026-07-05 21:53:36
