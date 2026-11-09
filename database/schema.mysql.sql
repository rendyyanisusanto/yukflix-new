-- ========================================================
-- Kinarya Yukflix Database Schema (MySQL / MariaDB)
-- Database: `kinarya-yukflix`
-- ========================================================

CREATE DATABASE IF NOT EXISTS `kinarya-yukflix` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `kinarya-yukflix`;

-- 1. Admin Users
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) DEFAULT 'Admin',
  `role` VARCHAR(50) DEFAULT 'admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Films
CREATE TABLE IF NOT EXISTS `films` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT,
  `duration_minutes` INT DEFAULT NULL,
  `release_date` DATE DEFAULT NULL,
  `poster_url` TEXT,
  `backdrop_url` TEXT,
  `embed_url` TEXT,
  `trailers_url` TEXT,
  `is_featured` TINYINT(1) DEFAULT 0,
  `is_coming_soon` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_films_slug` (`slug`),
  INDEX `idx_films_featured` (`is_featured`),
  INDEX `idx_films_coming_soon` (`is_coming_soon`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Genres
CREATE TABLE IF NOT EXISTS `genres` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_genres_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Film-Genres Junction
CREATE TABLE IF NOT EXISTS `film_genres` (
  `id` VARCHAR(36) PRIMARY KEY,
  `film_id` VARCHAR(36) NOT NULL,
  `genre_id` VARCHAR(36) NOT NULL,
  UNIQUE KEY `uk_film_genre` (`film_id`, `genre_id`),
  INDEX `idx_fg_film` (`film_id`),
  INDEX `idx_fg_genre` (`genre_id`),
  CONSTRAINT `fk_fg_film` FOREIGN KEY (`film_id`) REFERENCES `films` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fg_genre` FOREIGN KEY (`genre_id`) REFERENCES `genres` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Behind The Scenes
CREATE TABLE IF NOT EXISTS `behind_the_scenes` (
  `id` VARCHAR(36) PRIMARY KEY,
  `film_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) DEFAULT NULL,
  `thumbnail_url` TEXT,
  `media_type` VARCHAR(50) DEFAULT 'photo',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_bts_film` (`film_id`),
  CONSTRAINT `fk_bts_film` FOREIGN KEY (`film_id`) REFERENCES `films` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. FAQs
CREATE TABLE IF NOT EXISTS `faqs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `question` TEXT NOT NULL,
  `sort_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. FAQ Answers
CREATE TABLE IF NOT EXISTS `faq_answers` (
  `id` VARCHAR(36) PRIMARY KEY,
  `faq_id` VARCHAR(36) NOT NULL,
  `answer` TEXT NOT NULL,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_faq_answers_faq` (`faq_id`),
  CONSTRAINT `fk_faq_answer` FOREIGN KEY (`faq_id`) REFERENCES `faqs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Themes
CREATE TABLE IF NOT EXISTS `themes` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `primary_color` VARCHAR(7) DEFAULT '#c11267',
  `secondary_color` VARCHAR(7) DEFAULT '#e94e77',
  `background_color` VARCHAR(7) DEFAULT '#0f1115',
  `text_color` VARCHAR(7) DEFAULT '#ffffff',
  `is_active` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Site Settings
CREATE TABLE IF NOT EXISTS `site_settings` (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Settings
INSERT INTO `site_settings` (`key`, `value`) VALUES
  ('site_name', 'Yukflix'),
  ('tagline', 'Your Premium Streaming Platform'),
  ('footer_text', '© 2026 Yukflix. All rights reserved.')
ON DUPLICATE KEY UPDATE `key`=`key`;

-- Default Theme
INSERT INTO `themes` (`id`, `name`, `primary_color`, `secondary_color`, `background_color`, `text_color`, `is_active`) VALUES
  (UUID(), 'YukFlix Default', '#c11267', '#e94e77', '#0f1115', '#ffffff', 1)
ON DUPLICATE KEY UPDATE `id`=`id`;

