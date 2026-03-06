-- ============================================================
-- Migration: Seed default fansub registration form fields
-- Run AFTER 20260306020000_fix_rls_policies.sql
-- ============================================================

-- Only insert if no fields exist yet for this form
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM form_fields WHERE form_name = 'fansub_registration') THEN
    INSERT INTO form_fields (form_name, field_key, field_label_he, field_label_en, field_type, is_required, sort_order, is_active, placeholder_he)
    VALUES
      ('fansub_registration', 'name',         'שם הקבוצה',        'Group Name',     'text',     true,  1, true, 'הכנס את שם הקבוצה'),
      ('fansub_registration', 'description',  'תיאור הקבוצה',     'Description',    'textarea', true,  2, true, 'תאר את הקבוצה בקצרה'),
      ('fansub_registration', 'website_url',  'אתר אינטרנט',      'Website URL',    'url',      false, 3, true, 'https://'),
      ('fansub_registration', 'discord_url',  'קישור Discord',     'Discord URL',    'url',      false, 4, true, 'https://discord.gg/...'),
      ('fansub_registration', 'telegram_url', 'קישור Telegram',    'Telegram URL',   'url',      false, 5, true, 'https://t.me/...'),
      ('fansub_registration', 'logo_url',     'לוגו הקבוצה',      'Logo URL',       'url',      false, 6, true, 'https://...'),
      ('fansub_registration', 'founded_at',   'תאריך הקמה',       'Founded Date',   'date',     false, 7, true, NULL),
      ('fansub_registration', 'contact_email','אימייל ליצירת קשר', 'Contact Email',  'email',    false, 8, true, NULL);
  END IF;
END $$;
