# Supabase API Keys Explained

## Two Main Keys in Supabase

When you go to: **Project Settings → API**, you'll see:

### 1. 🟢 **anon/public key** (Publishable Key)
- ✅ Safe to use in frontend code (React, Vue, etc.)
- ✅ Already in your .env as `VITE_SUPABASE_ANON_KEY`
- ⚠️ Limited permissions - respects Row Level Security (RLS) policies
- Starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` and contains `"role":"anon"`

**Example use:** User authentication, reading public data, frontend operations

### 2. 🔴 **service_role key** (Secret Key)
- ❌ NEVER expose in frontend code
- ❌ Has full admin access - bypasses ALL RLS policies
- ✅ Use ONLY in backend/server-side scripts
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

┌─────────────────────────────────────────────────────────┐
│ anon public                                              │
│ This key is safe to use in a browser if you have        │
│ enabled Row Level Security for your tables and          │
│ configured policies.                                     │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...       │ [Copy]
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ service_role secret                                      │
│ This key has the ability to bypass Row Level Security.  │
│ Never share it publicly.                                 │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...       │ [Copy]
└─────────────────────────────────────────────────────────┘
```

You need the **second one** - the "service_role secret" key.

## Still Can't Find It?

Some possible reasons:

### Option 1: You might have it hidden
Look for a button that says "Reveal" or an eye icon 👁️ next to the service_role key section.

### Option 2: Check your account permissions
You need to be an **Owner** or **Admin** of the Supabase project to see the service_role key.

### Option 3: Generate a new one
If you're the owner and still can't see it:
1. Go to Project Settings → API
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
