-- YukFlix Row Level Security Policies
-- Run this AFTER schema.sql

-- Enable RLS on all tables
ALTER TABLE films ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE film_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE behind_the_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Films policies
-- Public can read all films
CREATE POLICY "Public can view films" ON films
  FOR SELECT USING (true);

-- Authenticated users can insert/update/delete
CREATE POLICY "Authenticated can insert films" ON films
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update films" ON films
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete films" ON films
  FOR DELETE USING (auth.role() = 'authenticated');

-- Genres policies
CREATE POLICY "Public can view genres" ON genres
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert genres" ON genres
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update genres" ON genres
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete genres" ON genres
  FOR DELETE USING (auth.role() = 'authenticated');

-- Film-Genres policies
CREATE POLICY "Public can view film_genres" ON film_genres
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage film_genres" ON film_genres
  FOR ALL USING (auth.role() = 'authenticated');

-- Behind the scenes policies
CREATE POLICY "Public can view bts" ON behind_the_scenes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage bts" ON behind_the_scenes
  FOR ALL USING (auth.role() = 'authenticated');

-- FAQs policies
CREATE POLICY "Public can view active faqs" ON faqs
  FOR SELECT USING (is_active = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated can manage faqs" ON faqs
  FOR ALL USING (auth.role() = 'authenticated');

-- FAQ Answers policies
CREATE POLICY "Public can view faq_answers" ON faq_answers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage faq_answers" ON faq_answers
  FOR ALL USING (auth.role() = 'authenticated');

-- Themes policies
CREATE POLICY "Public can view themes" ON themes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage themes" ON themes
  FOR ALL USING (auth.role() = 'authenticated');

-- Site Settings policies
CREATE POLICY "Public can view settings" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage settings" ON site_settings
  FOR ALL USING (auth.role() = 'authenticated');
