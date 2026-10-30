# Supabase Troubleshooting, API Keys & Resolution Guide

This guide consolidates troubleshooting steps, diagnostic workflows, API key configurations, and Row Level Security (RLS) resolutions for MashHub's Supabase backend.

---

## 1. Quick Triage & Diagnostic Steps

# ðŸš¨ Supabase Offline? Quick Fix Guide

## ðŸ” Diagnose the Problem
```bash
npm run diagnose
```

## ðŸ› ï¸ Common Quick Fixes

### 1ï¸âƒ£ **Restart Dev Server**
Most common issue! Vite only loads .env at startup.
```bash
# Stop server (Ctrl+C), then:
npm run dev
```

### 2ï¸âƒ£ **Check .env File**
Make sure `.env` exists in project root with:
```env
VITE_SUPABASE_URL=https://xyjfofiztvzpblskuoan.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Get keys from: https://supabase.com/dashboard/project/xyjfofiztvzpblskuoan/settings/api

### 3ï¸âƒ£ **Supabase Project Paused?**
Free tier pauses after 7 days of inactivity.
- Go to: https://supabase.com/dashboard
- Click "Resume" or "Restore" if paused
- Wait 1-2 minutes for it to wake up

### 4ï¸âƒ£ **Clear Cache**
In Browser DevTools (F12):
- Application tab â†’ Clear Storage â†’ Clear all
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### 5ï¸âƒ£ **RLS Policies Blocking?**
If queries fail with "policy violation":
```sql
-- Run in Supabase SQL Editor:
CREATE POLICY "Allow anonymous read access"
ON songs FOR SELECT
TO anon
USING (true);
```

## ðŸ“š Full Documentation
- `SUPABASE_CONNECTION_GUIDE.md` - Complete troubleshooting
- `FIX_RLS_GUIDE.md` - Row Level Security setup
- `SUPABASE_KEYS_EXPLAINED.md` - Understanding API keys

## ðŸ”„ Retry Connection
If you fixed the issue:
1. Click "Show details" on the yellow banner
2. Click "Retry Connection" button
3. Or just reload the page

## âœ… Working Offline?
No problem! The app works fully offline with IndexedDB.
- All features work locally
- Just can't sync across devices
- Click "Dismiss" to hide the banner

## ðŸ†˜ Still Stuck?
Run diagnostics and check the output:
```bash
npm run diagnose
```

Share the output (without exposing your keys) for help debugging.


---

## 2. Supabase Connection Troubleshooting

# Supabase Connection Troubleshooting Guide

## Problem
You're seeing the message: **"Supabase is unavailable. Changes are being saved locally and will not sync across devices."**

This means the app has fallen back to offline mode (IndexedDB/Dexie) because it couldn't connect to Supabase.

---

## Quick Diagnosis

### Step 1: Run the Diagnostic Script

```bash
npm run diagnose
# OR
node diagnose_supabase.cjs
```

This will check:
- âœ… If your `.env` file exists and is loaded correctly
- âœ… If environment variables are set properly
- âœ… If Supabase connection works
- âœ… If the songs table is accessible

---

## Common Causes & Solutions

### 1. Missing or Invalid Environment Variables

**Symptoms:**
- Console shows: "Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
- Or: "Invalid API key"

**Solution:**
1. Verify your `.env` file exists in the project root
2. Check it contains:
   ```env
   VITE_SUPABASE_URL=https://xyjfofiztvzpblskuoan.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Get your actual keys from: [Supabase API Settings](https://supabase.com/dashboard/project/xyjfofiztvzpblskuoan/settings/api)
4. **Restart your dev server** after updating `.env`

**Important:**
- âŒ Don't add spaces: `VITE_SUPABASE_URL = value` (wrong)
- âœ… No spaces: `VITE_SUPABASE_URL=value` (correct)
- âŒ Usually don't need quotes: `VITE_SUPABASE_URL="value"` (unnecessary)

---

### 2. Development Server Not Restarted

**Symptoms:**
- You updated `.env` but still seeing the error
- Environment variables appear correct

**Solution:**
1. Stop your dev server (Ctrl+C)
2. Start it again:
   ```bash
   npm run dev
   ```

Vite only loads `.env` at startup!

---

### 3. Supabase Project Paused or Inactive

**Symptoms:**
- Connection timeout (>10 seconds)
- Network error in browser console

**Solution:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Check if your project is paused (free tier pauses after inactivity)
3. Click "Resume" or "Restore" if needed
4. Wait 1-2 minutes for project to wake up
5. Try the "Retry Connection" button in the app

---

### 4. Row Level Security (RLS) Policies Blocking Access

**Symptoms:**
- Connection succeeds but queries fail
- Console shows: "Row Level Security policy violation"

**Solution:**
1. Go to [Table Editor](https://supabase.com/dashboard/project/xyjfofiztvzpblskuoan/editor)
2. Select the `songs` table
3. Click "RLS" tab
4. Either:
   - **Option A:** Temporarily disable RLS for testing (not recommended for production)
   - **Option B:** Add a policy to allow SELECT for `anon` role:
     ```sql
     CREATE POLICY "Allow anonymous read access"
     ON songs FOR SELECT
     TO anon
     USING (true);
     ```

See `FIX_RLS_GUIDE.md` for detailed RLS policy setup.

---

### 5. Network/Firewall Issues

**Symptoms:**
- Connection timeout
- Works on other networks but not yours

**Solution:**
1. Check if you can access Supabase dashboard in browser
2. Try disabling VPN or antivirus temporarily
3. Check if corporate firewall is blocking `*.supabase.co`
4. Try different network (mobile hotspot) to isolate issue

---

### 6. Browser Cache Issues

**Symptoms:**
- Everything looks correct but still offline
- Just updated environment variables

**Solution:**
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Clear:
   - âœ… Local Storage
   - âœ… Session Storage
   - âœ… IndexedDB
   - âœ… Cache Storage
4. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
5. Restart dev server

---

## How the Health Check Works

The app performs a health check on startup (`src/lib/supabaseHealth.ts`):

1. **Checks for environment variables** (URL and anon key)
2. **Attempts connection** with 5-second timeout
3. **Retries 2 times** to avoid false negatives
4. **Falls back to local mode** if all attempts fail

The timeout is **5 seconds** per attempt, with **2 retries** (total ~10 seconds).

You can see the health check code here: `src/lib/supabaseHealth.ts`

---

## Checking Your Browser Console

Open DevTools (F12) and look for errors:

### Good Signs (Supabase working):
```
App component rendering...
App state: { songs: 20000, loading: false, error: null }
```

### Bad Signs (Supabase unavailable):
```
Error: Missing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
OR
Error: Invalid API key
OR
Error: Timeout of 5000ms exceeded
```

---

## Testing the Connection Manually

### In Browser Console:
```javascript
// Check env vars
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

// Test query (if app is loaded)
const { data, error } = await supabase.from('songs').select('id').limit(1);
console.log({ data, error });
```

### Using the Retry Button:
1. Click "Show details" on the offline banner
2. View the error message
3. Click "Retry Connection" after fixing the issue
4. If it succeeds, the banner disappears automatically

---

## Still Not Working?

### Check These Files:
1. **`.env`** - Environment variables correctly set?
2. **`src/lib/supabase.ts`** - Supabase client initialization
3. **`src/lib/supabaseHealth.ts`** - Health check logic
4. **`src/contexts/BackendContext.tsx`** - Connection status management

### Verify Supabase Setup:
1. Tables exist: [Table Editor](https://supabase.com/dashboard/project/xyjfofiztvzpblskuoan/editor)
2. RLS policies: [Check here](https://supabase.com/dashboard/project/xyjfofiztvzpblskuoan/auth/policies)
3. API keys: [Settings â†’ API](https://supabase.com/dashboard/project/xyjfofiztvzpblskuoan/settings/api)

### Last Resort:
1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Clear browser data completely
3. Try different browser
4. Check Supabase status: https://status.supabase.com/

---

## Working in Offline Mode

If you can't fix Supabase right now, the app still works! 

âœ… **All features work offline:**
- Add/edit/delete songs
- Create projects
- Search and filter
- Import/export

âŒ **Limitations:**
- Changes only stored locally (browser)
- No sync across devices
- Data lost if you clear browser data
- No auth/multi-user features

**To dismiss the banner:** Click the "Dismiss" button (it won't show again this session)

---

## Getting Help

If you're still stuck:
1. Run `node diagnose_supabase.js` and share the output
2. Check browser console (F12) for errors
3. Share your `.env` structure (WITHOUT exposing keys):
   ```
   VITE_SUPABASE_URL=https://[redacted].supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc... (224 characters)
   ```
4. Check Supabase project logs in dashboard


---

## 3. Understanding Supabase API Keys (Anon vs Service Role)

# Supabase API Keys Explained

## Two Main Keys in Supabase

When you go to: **Project Settings â†’ API**, you'll see:

### 1. ðŸŸ¢ **anon/public key** (Publishable Key)
- âœ… Safe to use in frontend code (React, Vue, etc.)
- âœ… Already in your .env as `VITE_SUPABASE_ANON_KEY`
- âš ï¸ Limited permissions - respects Row Level Security (RLS) policies
- Starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` and contains `"role":"anon"`

**Example use:** User authentication, reading public data, frontend operations

### 2. ðŸ”´ **service_role key** (Secret Key)
- âŒ NEVER expose in frontend code
- âŒ Has full admin access - bypasses ALL RLS policies
- âœ… Use ONLY in backend/server-side scripts
- Starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` and contains `"role":"service_role"`

**Example use:** Admin operations, bulk imports/updates, server-side scripts

---

## For the UPSERT Script

The Python upsert script needs the **service_role key** because:
- It performs bulk write operations
- It may need to bypass RLS policies
- It's running server-side (not in a browser)

## How to Find Your service_role Key

Go to: https://supabase.com/dashboard/project/xyjfofiztvzpblskuoan/settings/api

You should see a section that looks like this:

```
Project API keys

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ anon public                                              â”‚
â”‚ This key is safe to use in a browser if you have        â”‚
â”‚ enabled Row Level Security for your tables and          â”‚
â”‚ configured policies.                                     â”‚
â”‚ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...       â”‚ [Copy]
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ service_role secret                                      â”‚
â”‚ This key has the ability to bypass Row Level Security.  â”‚
â”‚ Never share it publicly.                                 â”‚
â”‚ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...       â”‚ [Copy]
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

You need the **second one** - the "service_role secret" key.

## Still Can't Find It?

Some possible reasons:

### Option 1: You might have it hidden
Look for a button that says "Reveal" or an eye icon ðŸ‘ï¸ next to the service_role key section.

### Option 2: Check your account permissions
You need to be an **Owner** or **Admin** of the Supabase project to see the service_role key.

### Option 3: Generate a new one
If you're the owner and still can't see it:
1. Go to Project Settings â†’ API
2. Look for "Reset service_role key" or "Generate new key" option
3. Copy the newly generated key

---

## Your Current .env Should Look Like:

```env
# Frontend keys (safe to expose)
VITE_SUPABASE_URL=https://xyjfofiztvzpblskuoan.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...very_long_key...anon...

# Backend/Script keys (NEVER expose in frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJ...very_long_key...service_role...
```

Both keys are JWT tokens that start with `eyJ` and are 180+ characters long, but:
- The anon key contains `"role":"anon"` (if you decode it)
- The service_role key contains `"role":"service_role"` (if you decode it)


---

## 4. How to Retrieve the Service Role Key

# How to Get Your Supabase Service Role Key

## The Problem
Your current `SUPABASE_SERVICE_ROLE_KEY` is only 41 characters starting with `sb_secret_`.

A **valid** Supabase service role key should be:
- âœ… 180+ characters long
- âœ… Starts with `eyJ` (it's a JWT token)
- âœ… Looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5amZvZml6dHZ6cGJsc2t1b2FuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0NjczMjg4NSwiZXhwIjoxOTYyMzA4ODg1fQ...`

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

âš ï¸ **IMPORTANT**: 
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


---

## 5. Resolving Row Level Security (RLS) for Upserts

# Fixing Row Level Security (RLS) for UPSERT Operations

## The Problem
Your anon key can READ data but cannot INSERT/UPDATE because of Row Level Security policies.

## Solutions (Choose One)

### Option 1: Temporarily Disable RLS (Easiest - For Development Only)

âš ï¸ **Warning:** This makes your tables publicly writable. Only do this for development!

1. Go to: https://supabase.com/dashboard/project/xyjfofiztvzpblskuoan/editor

2. Click on **SQL Editor** in the left sidebar

3. Run this SQL:
```sql
-- Disable RLS on songs table
ALTER TABLE songs DISABLE ROW LEVEL SECURITY;

-- Disable RLS on song_sections table
ALTER TABLE song_sections DISABLE ROW LEVEL SECURITY;
```

4. Run your upsert script:
```bash
python src\assets\upsert.py
```

5. **Re-enable RLS after import** (IMPORTANT):
```sql
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_sections ENABLE ROW LEVEL SECURITY;
```

---

### Option 2: Create RLS Policies that Allow Upsert (Better - For Production)

This allows anyone to insert/update but maintains RLS structure:

1. Go to SQL Editor in Supabase
2. Run this SQL:

```sql
-- Policy to allow INSERT on songs table
CREATE POLICY "Allow public insert" ON songs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy to allow UPDATE on songs table
CREATE POLICY "Allow public update" ON songs
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policy to allow INSERT on song_sections table
CREATE POLICY "Allow public insert" ON song_sections
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy to allow UPDATE on song_sections table
CREATE POLICY "Allow public update" ON song_sections
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
```

3. Run your upsert script:
```bash
python src\assets\upsert.py
```

---

### Option 3: Use Service Role Key (Best - If Available)

Your current service role key (`sb_secret_...`, 41 chars) appears to be a placeholder.

To get the real service role key:

1. Go to: https://supabase.com/dashboard/project/xyjfofiztvzpblskuoan/settings/api

2. Look for **"service_role"** key section (NOT the anon/public key)

3. It should be:
   - 180+ characters long
   - Start with `eyJ`
   - Labeled as "secret" with warning about RLS bypass

4. Update your `.env` file:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
```

5. The upsert script will automatically use the service role key if it's valid (>100 chars)

---

## Recommended Approach for Your Use Case

Since you're doing a **one-time data import** from CSV files:

**Best Option:** Option 1 (Temporarily disable RLS)
- Quick and easy
- Safe for one-time import
- Re-enable RLS after import

**Steps:**
1. Disable RLS (SQL above)
2. Run: `python src\assets\upsert.py`
3. Verify data imported correctly
4. Re-enable RLS (SQL above)

---

## Security Notes

- **anon key**: Safe to expose in frontend, respects RLS
- **service_role key**: Full admin access, NEVER expose in frontend
- **Disabling RLS**: Only for development/import, not for production apps
- **Public policies**: Anyone can write, consider adding authentication checks

---

## Quick SQL Reference

### Check if RLS is enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('songs', 'song_sections');
```

### View existing policies
```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('songs', 'song_sections');
```

### Drop a policy (if you make a mistake)
```sql
DROP POLICY "policy_name" ON table_name;
```


---

## 6. Invalid API Key & Environment Variable Troubleshooting

# Troubleshooting: Invalid API Key Error

## The Issue
You're getting `SupabaseException: Invalid API key` when running the upsert script.

## Diagnostic Steps

### Step 1: Check Environment Variables
Run the diagnostic script from the project root:
```bash
cd "d:\Projects\Research Projects\MashHub"
python check_env.py
```

This will show:
- Whether the .env file is being found and loaded
- Which environment variables are set
- The length and format of your keys

### Step 2: Verify Your .env File

Open your `.env` file and verify it contains:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Common Issues:**
1. âŒ Extra spaces around the `=` sign
   - Wrong: `SUPABASE_SERVICE_ROLE_KEY = your_key`
   - Right: `SUPABASE_SERVICE_ROLE_KEY=your_key`

2. âŒ Quotes around values (usually not needed)
   - Wrong: `SUPABASE_SERVICE_ROLE_KEY="your_key"`
   - Right: `SUPABASE_SERVICE_ROLE_KEY=your_key`

3. âŒ Missing or incorrect variable name
   - Must be exactly: `SUPABASE_SERVICE_ROLE_KEY`
   - Not: `SUPABASE_SERVICE_KEY` or `SERVICE_ROLE_KEY`

4. âŒ Wrong key type being used
   - The script needs the **Service Role Key** (not the anon key)
   - Find it in Supabase Dashboard â†’ Settings â†’ API â†’ service_role key

### Step 3: Verify Your Supabase Keys

1. Go to your Supabase project dashboard
2. Navigate to **Settings** â†’ **API**
3. You should see two keys:
   - **anon/public key** (shorter, safe for frontend)
   - **service_role key** (longer, full admin access - keep secret!)

The upsert script needs the **service_role key** because it bypasses RLS policies.

### Step 4: Test the Keys

Create a simple test script:
```python
from supabase import create_client

url = "https://your-project-id.supabase.co"
key = "your_service_role_key_here"

try:
    client = create_client(url, key)
    print("âœ“ Connection successful!")
    
    # Test a simple query
    result = client.table('songs').select("count").execute()
    print(f"âœ“ Query successful! Song count: {result}")
except Exception as e:
    print(f"âœ— Error: {e}")
```

### Step 5: Run the Upsert Script

Once the diagnostic shows all variables are loaded correctly:
```bash
cd "d:\Projects\Research Projects\MashHub"
python src\assets\upsert.py
```

## Quick Fix Checklist

- [ ] .env file exists in project root (`d:\Projects\Research Projects\MashHub\.env`)
- [ ] .env file contains `VITE_SUPABASE_URL` with your Supabase project URL
- [ ] .env file contains `SUPABASE_SERVICE_ROLE_KEY` with your service role key (not anon key)
- [ ] No extra spaces around `=` in .env file
- [ ] No quotes around values in .env file
- [ ] Service role key is copied correctly from Supabase dashboard
- [ ] Running script from project root directory

## Still Having Issues?

The updated script now shows debug output including:
- The path where it's looking for .env
- Whether the URL was loaded
- Whether the service key was loaded
- The length of the key (to verify it was read completely)

This will help identify exactly where the problem is!

