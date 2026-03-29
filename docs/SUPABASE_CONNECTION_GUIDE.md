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
- ✅ If your `.env` file exists and is loaded correctly
- ✅ If environment variables are set properly
- ✅ If Supabase connection works
- ✅ If the songs table is accessible

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
- ❌ Don't add spaces: `VITE_SUPABASE_URL = value` (wrong)
- ✅ No spaces: `VITE_SUPABASE_URL=value` (correct)
- ❌ Usually don't need quotes: `VITE_SUPABASE_URL="value"` (unnecessary)

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
   - ✅ Local Storage
   - ✅ Session Storage
   - ✅ IndexedDB
   - ✅ Cache Storage
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
3. API keys: [Settings → API](https://supabase.com/dashboard/project/xyjfofiztvzpblskuoan/settings/api)

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

✅ **All features work offline:**
- Add/edit/delete songs
- Create projects
- Search and filter
- Import/export

❌ **Limitations:**
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
