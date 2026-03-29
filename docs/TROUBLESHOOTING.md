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
1. ❌ Extra spaces around the `=` sign
   - Wrong: `SUPABASE_SERVICE_ROLE_KEY = your_key`
   - Right: `SUPABASE_SERVICE_ROLE_KEY=your_key`

2. ❌ Quotes around values (usually not needed)
   - Wrong: `SUPABASE_SERVICE_ROLE_KEY="your_key"`
   - Right: `SUPABASE_SERVICE_ROLE_KEY=your_key`

3. ❌ Missing or incorrect variable name
   - Must be exactly: `SUPABASE_SERVICE_ROLE_KEY`
   - Not: `SUPABASE_SERVICE_KEY` or `SERVICE_ROLE_KEY`

4. ❌ Wrong key type being used
   - The script needs the **Service Role Key** (not the anon key)
   - Find it in Supabase Dashboard → Settings → API → service_role key

### Step 3: Verify Your Supabase Keys

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
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
    print("✓ Connection successful!")
    
    # Test a simple query
    result = client.table('songs').select("count").execute()
    print(f"✓ Query successful! Song count: {result}")
except Exception as e:
    print(f"✗ Error: {e}")
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
