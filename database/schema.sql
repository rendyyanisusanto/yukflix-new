-- YukFlix Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Films table
CREATE TABLE IF NOT EXISTS films (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  duration_minutes INT,
  release_date DATE,
  poster_url TEXT,
  backdrop_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_coming_soon BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Genres table
CREATE TABLE IF NOT EXISTS genres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Film-Genres junction table
CREATE TABLE IF NOT EXISTS film_genres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  film_id UUID REFERENCES films(id) ON DELETE CASCADE,
  genre_id UUID REFERENCES genres(id) ON DELETE CASCADE,
  UNIQUE(film_id, genre_id)
);

-- Behind the scenes table
CREATE TABLE IF NOT EXISTS behind_the_scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  film_id UUID REFERENCES films(id) ON DELETE CASCADE,
  title VARCHAR(255),
  thumbnail_url TEXT,
  media_type VARCHAR(50), -- 'photo' or 'video'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FAQs table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FAQ Answers table
CREATE TABLE IF NOT EXISTS faq_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  faq_id UUID REFERENCES faqs(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Themes table
CREATE TABLE IF NOT EXISTS themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  primary_color VARCHAR(7) DEFAULT '#c11267',
  secondary_color VARCHAR(7) DEFAULT '#e94e77',
  background_color VARCHAR(7) DEFAULT '#0f1115',
  text_color VARCHAR(7) DEFAULT '#ffffff',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site Settings table
CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO site_settings (key, value) VALUES
  ('site_name', 'Yukflix'),
  ('tagline', 'Your Premium Streaming Platform'),
  ('footer_text', '© 2023 Yukflix. All rights reserved.')
ON CONFLICT (key) DO NOTHING;

-- Insert default theme
INSERT INTO themes (name, primary_color, secondary_color, background_color, text_color, is_active) VALUES
  ('YukFlix Default', '#c11267', '#e94e77', '#0f1115', '#ffffff', true)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_films_slug ON films(slug);
CREATE INDEX IF NOT EXISTS idx_films_featured ON films(is_featured);
CREATE INDEX IF NOT EXISTS idx_films_coming_soon ON films(is_coming_soon);
CREATE INDEX IF NOT EXISTS idx_genres_slug ON genres(slug);
CREATE INDEX IF NOT EXISTS idx_film_genres_film ON film_genres(film_id);
CREATE INDEX IF NOT EXISTS idx_film_genres_genre ON film_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_bts_film ON behind_the_scenes(film_id);
CREATE INDEX IF NOT EXISTS idx_faq_answers_faq ON faq_answers(faq_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to films table
DROP TRIGGER IF EXISTS update_films_updated_at ON films;
CREATE TRIGGER update_films_updated_at
  BEFORE UPDATE ON films
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to site_settings table
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
