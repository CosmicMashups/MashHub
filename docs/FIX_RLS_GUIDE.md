# Fixing Row Level Security (RLS) for UPSERT Operations

## The Problem
Your anon key can READ data but cannot INSERT/UPDATE because of Row Level Security policies.

## Solutions (Choose One)

### Option 1: Temporarily Disable RLS (Easiest - For Development Only)

⚠️ **Warning:** This makes your tables publicly writable. Only do this for development!

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
