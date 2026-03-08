-- Create user_submissions table for community translation reports
CREATE TABLE user_submissions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anime_name       VARCHAR(255) NOT NULL,
  anime_name_en    VARCHAR(255),
  translator_name  VARCHAR(255) NOT NULL,
  translation_url  VARCHAR(512) NOT NULL,
  platform_type    VARCHAR(50)  NOT NULL,
  status           VARCHAR(50)  NOT NULL,
  description      TEXT,
  language_quality VARCHAR(50),
  submitted_by     UUID REFERENCES auth.users(id),
  is_verified      BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own submissions
CREATE POLICY "user_insert_own" ON user_submissions
  FOR INSERT WITH CHECK (submitted_by = auth.uid());

-- Users can read their own submissions
CREATE POLICY "user_read_own" ON user_submissions
  FOR SELECT USING (submitted_by = auth.uid());

-- Admin reads and updates all
CREATE POLICY "admin_all_submissions" ON user_submissions
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );
