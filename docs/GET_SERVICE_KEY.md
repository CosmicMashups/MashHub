# How to Get Your Supabase Service Role Key

## The Problem
Your current `SUPABASE_SERVICE_ROLE_KEY` is only 41 characters starting with `sb_secret_`.

A **valid** Supabase service role key should be:
- ✅ 180+ characters long
- ✅ Starts with `eyJ` (it's a JWT token)
- ✅ Looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5amZvZml6dHZ6cGJsc2t1b2FuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0NjczMjg4NSwiZXhwIjoxOTYyMzA4ODg1fQ...`

## Steps to Get the Correct Key

### Option 1: From Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/xyjfofiztvzpblskuoan/settings/api

2. Look for the **"service_role"** section (NOT the "anon" key)

3. Click the "Copy" button or reveal icon to see the full key

4. The key should be very long (180+ characters) and start with `eyJ`

### Option 2: Using Supabase CLI

```bash
# Login to Supabase CLI
supabase login

# Get your project's service role key
supabase projects api-keys --project-ref xyjfofiztvzpblskuoan
```

## Update Your .env File

Once you have the correct key, update your `.env` file:

```env
VITE_SUPABASE_URL=https://xyjfofiztvzpblskuoan.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5amZvZml6dHZ6cGJsc2t1b2FuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0NjczMjg4NSwiZXhwIjoxOTYyMzA4ODg1fQ.FULL_KEY_HERE
```

⚠️ **IMPORTANT**: 
- Make sure to copy the ENTIRE key (it will be very long)
- No spaces before or after the `=`
- No quotes around the key
- The key should all be on one line

## Verify the Update

After updating your .env file, run:
```bash
python check_env.py
```

You should now see:
- Length: **180+ characters** (not 41)
- Starts with: **eyJ...** (not sb_secret_)

Then try the upsert script again:
```bash
python src\assets\upsert.py
```
