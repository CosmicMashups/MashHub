# 🚨 Supabase Offline? Quick Fix Guide

## 🔍 Diagnose the Problem
```bash
npm run diagnose
```

## 🛠️ Common Quick Fixes

### 1️⃣ **Restart Dev Server**
Most common issue! Vite only loads .env at startup.
```bash
# Stop server (Ctrl+C), then:
npm run dev
```

### 2️⃣ **Check .env File**
Make sure `.env` exists in project root with:
```env
VITE_SUPABASE_URL=https://xyjfofiztvzpblskuoan.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Get keys from: https://supabase.com/dashboard/project/xyjfofiztvzpblskuoan/settings/api

### 3️⃣ **Supabase Project Paused?**
Free tier pauses after 7 days of inactivity.
- Go to: https://supabase.com/dashboard
- Click "Resume" or "Restore" if paused
- Wait 1-2 minutes for it to wake up

### 4️⃣ **Clear Cache**
In Browser DevTools (F12):
- Application tab → Clear Storage → Clear all
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### 5️⃣ **RLS Policies Blocking?**
If queries fail with "policy violation":
```sql
-- Run in Supabase SQL Editor:
CREATE POLICY "Allow anonymous read access"
ON songs FOR SELECT
TO anon
USING (true);
```

## 📚 Full Documentation
- `SUPABASE_CONNECTION_GUIDE.md` - Complete troubleshooting
- `FIX_RLS_GUIDE.md` - Row Level Security setup
- `SUPABASE_KEYS_EXPLAINED.md` - Understanding API keys

## 🔄 Retry Connection
If you fixed the issue:
1. Click "Show details" on the yellow banner
2. Click "Retry Connection" button
3. Or just reload the page

## ✅ Working Offline?
No problem! The app works fully offline with IndexedDB.
- All features work locally
- Just can't sync across devices
- Click "Dismiss" to hide the banner

## 🆘 Still Stuck?
Run diagnostics and check the output:
```bash
npm run diagnose
```

Share the output (without exposing your keys) for help debugging.
