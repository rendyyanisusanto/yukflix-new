# YukFlix Database Setup

Follow these steps to setup your Supabase database for YukFlix.

## 1. Create Storage Bucket

In your Supabase Dashboard, go to **Storage** and create this bucket (**public**):

### Bucket: `media`
This single bucket will contain all media files organized in folders:
- `posters/` - Film poster images
- `backdrops/` - Film backdrop images  
- `behind-the-scenes/` - BTS media

**Settings:**
- ✅ Public bucket
- ✅ File size limit: 50MB (recommended)
- ✅ Allowed MIME types: image/*, video/*

## 2. Run SQL Scripts

In your Supabase Dashboard, go to **SQL Editor** and run these scripts **in order**:

### Step 1: Create Database Schema
Copy and paste the contents of `database/schema.sql` into the SQL editor and run it.

This will create:
- All database tables (films, genres, faqs, themes, etc.)
- Default settings
- Default theme
- Indexes for performance
- Triggers for automatic timestamps

### Step 2: Enable Row Level Security
Copy and paste the contents of `database/policies.sql` into the SQL editor and run it.

This will:
- Enable RLS on all tables
- Set public read access
- Set authenticated write access

### Step 3: Configure Storage Policies
Copy and paste the contents of `database/storage.sql` into the SQL editor and run it.

This will:
- Enable storage policies for all buckets
- Allow public viewing
- Allow authenticated uploads/deletion

## 3. Create Admin User

In your Supabase Dashboard, go to **Authentication > Users** and create a new user:

- Email: Your admin email (e.g., `admin@yukflix.com`)
- Password: Your secure password
- Email Confirm: ✅ (auto-confirm)

## 4. Test the Setup

1. Navigate to http://localhost:5174/admin/login
2. Login with your admin credentials
3. You should be redirected to the dashboard
4. Try creating a test film in the Films section

## Database Schema Overview

### Films Table
- id, title, slug, description
- duration_minutes, release_date
- poster_url, backdrop_url
- is_featured, is_coming_soon
- timestamps

### Genres Table
- id, name, slug
- created_at

### Film-Genres Junction
- Links films to genres (many-to-many)

### Behind The Scenes
- Film-related BTS media
- Links to films via film_id

### FAQs & Answers
- Questions with multiple answers
- Sort order and active/inactive toggle

### Themes
- Customizable color schemes
- One active theme at a time

### Site Settings
- Key-value pairs for site configuration

## Troubleshooting

### "Missing Supabase environment variables"
- Check that `.env` file exists
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
- Restart dev server after adding env vars

### "Failed to fetch"
- Check Supabase project is active
- Verify URL and key are correct
- Check browser console for CORS errors

### "Permission denied" errors
- Verify RLS policies are created (`database/policies.sql`)
- Check storage bucket policies (`database/storage.sql`)
- Ensure user is authenticated

### Storage upload fails
- Verify `media` bucket exists and is public
- Check storage policies are applied
- Verify file size limits
- Check allowed MIME types

## Next Steps

After setup:
1. ✅ Create some genres
2. ✅ Add your first film
3. ✅ Upload poster and backdrop images
4. ✅ Add BTS media
5. ✅ Create FAQs
6. ✅ Check frontpage to see your content!
