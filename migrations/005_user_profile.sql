ALTER TABLE users ADD COLUMN profile_nickname TEXT;
ALTER TABLE users ADD COLUMN profile_phone TEXT;
ALTER TABLE users ADD COLUMN profile_email TEXT;
ALTER TABLE users ADD COLUMN profile_facebook TEXT;
ALTER TABLE users ADD COLUMN profile_line TEXT;
ALTER TABLE users ADD COLUMN profile_contact_type TEXT NOT NULL DEFAULT 'email';
ALTER TABLE users ADD COLUMN profile_image TEXT;
