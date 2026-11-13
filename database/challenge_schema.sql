-- ========================================================
-- Film Challenge & Talent Registration Schema (MySQL)
-- Database: `kinarya-yukflix`
-- ========================================================

USE `kinarya-yukflix`;

-- 1. Film Challenges Table
CREATE TABLE IF NOT EXISTS `film_challenges` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `subtitle` VARCHAR(255) DEFAULT 'Kinarya Coop',
  `description` TEXT,
  `status` ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'published',
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_challenge_slug` (`slug`),
  INDEX `idx_challenge_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Challenge Videos Table
CREATE TABLE IF NOT EXISTS `challenge_videos` (
  `id` VARCHAR(36) PRIMARY KEY,
  `challenge_id` VARCHAR(36) NOT NULL,
  `video_order` INT NOT NULL DEFAULT 1,
  `title` VARCHAR(255) NOT NULL,
  `youtube_url` VARCHAR(500) NOT NULL,
  `youtube_video_id` VARCHAR(100) DEFAULT NULL,
  `instructions` TEXT,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cv_challenge` (`challenge_id`),
  INDEX `idx_cv_order` (`video_order`),
  CONSTRAINT `fk_cv_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `film_challenges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.5. Challenge Question Categories Table
CREATE TABLE IF NOT EXISTS `challenge_question_categories` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `description` TEXT DEFAULT NULL,
  `order_num` INT NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cqc_order` (`order_num`),
  INDEX `idx_cqc_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Challenge Questions Table
CREATE TABLE IF NOT EXISTS `challenge_questions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `challenge_id` VARCHAR(36) NOT NULL,
  `video_id` VARCHAR(36) NOT NULL,
  `category_id` VARCHAR(36) DEFAULT NULL,
  `category` VARCHAR(100) NOT NULL,
  `question_text` TEXT NOT NULL,
  `answer_type` ENUM('essay', 'single_choice', 'multiple_choice') NOT NULL DEFAULT 'essay',
  `options` JSON DEFAULT NULL,
  `question_order` INT NOT NULL DEFAULT 1,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cq_challenge` (`challenge_id`),
  INDEX `idx_cq_video` (`video_id`),
  INDEX `idx_cq_category` (`category_id`),
  INDEX `idx_cq_order` (`question_order`),
  CONSTRAINT `fk_cq_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `film_challenges` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cq_video` FOREIGN KEY (`video_id`) REFERENCES `challenge_videos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cq_category` FOREIGN KEY (`category_id`) REFERENCES `challenge_question_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Challenge Submissions Table
CREATE TABLE IF NOT EXISTS `challenge_submissions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `challenge_id` VARCHAR(36) NOT NULL,
  `registration_number` VARCHAR(50) NOT NULL UNIQUE,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `whatsapp` VARCHAR(50) NOT NULL,
  `institution` VARCHAR(255) NOT NULL,
  `province` VARCHAR(100) NOT NULL,
  `age_range` VARCHAR(50) NOT NULL,
  `organization_role` VARCHAR(255) DEFAULT NULL,
  `data_consent` TINYINT(1) NOT NULL DEFAULT 1,
  `experience_skills` TEXT DEFAULT NULL,
  `portfolio_url` VARCHAR(500) DEFAULT NULL,
  `motivation` TEXT DEFAULT NULL,
  `review_status` ENUM('submitted', 'under_review', 'shortlisted', 'not_selected') NOT NULL DEFAULT 'submitted',
  `reviewer_notes` TEXT DEFAULT NULL,
  `review_score` INT DEFAULT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cs_challenge` (`challenge_id`),
  INDEX `idx_cs_reg_num` (`registration_number`),
  INDEX `idx_cs_email` (`email`),
  INDEX `idx_cs_province` (`province`),
  INDEX `idx_cs_status` (`review_status`),
  CONSTRAINT `fk_cs_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `film_challenges` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Challenge Answers Table
CREATE TABLE IF NOT EXISTS `challenge_answers` (
  `id` VARCHAR(36) PRIMARY KEY,
  `submission_id` VARCHAR(36) NOT NULL,
  `question_id` VARCHAR(36) NOT NULL,
  `answer_text` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ca_submission` (`submission_id`),
  INDEX `idx_ca_question` (`question_id`),
  CONSTRAINT `fk_ca_submission` FOREIGN KEY (`submission_id`) REFERENCES `challenge_submissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ca_question` FOREIGN KEY (`question_id`) REFERENCES `challenge_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Challenge Submission Interests Table
CREATE TABLE IF NOT EXISTS `challenge_submission_interests` (
  `id` VARCHAR(36) PRIMARY KEY,
  `submission_id` VARCHAR(36) NOT NULL,
  `interest_name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_cs_interest` (`submission_id`, `interest_name`),
  INDEX `idx_csi_interest` (`interest_name`),
  CONSTRAINT `fk_csi_submission` FOREIGN KEY (`submission_id`) REFERENCES `challenge_submissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

