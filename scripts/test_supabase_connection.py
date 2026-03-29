"""
Test Supabase connection with actual keys
"""
import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment
load_dotenv()

url = os.getenv("VITE_SUPABASE_URL")
anon_key = os.getenv("VITE_SUPABASE_ANON_KEY")
service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print("=" * 70)
print("Supabase Connection Test")
print("=" * 70)

print(f"\nURL: {url}")
print(f"Anon key length: {len(anon_key) if anon_key else 'NOT SET'}")
print(f"Service key length: {len(service_key) if service_key else 'NOT SET'}")

# Test 1: Try with service role key
print("\n" + "=" * 70)
print("Test 1: Connecting with service_role key")
print("=" * 70)
try:
    client_service = create_client(url, service_key)
    print("✓ Client created successfully with service_role key")
    
    # Try a simple query
    result = client_service.table('songs').select("*").limit(1).execute()
    print(f"✓ Query successful! Retrieved {len(result.data)} record(s)")
    
except Exception as e:
    print(f"✗ Failed with service_role key: {e}")
    print(f"   Error type: {type(e).__name__}")

# Test 2: Try with anon key
print("\n" + "=" * 70)
print("Test 2: Connecting with anon key (as fallback)")
print("=" * 70)
try:
    client_anon = create_client(url, anon_key)
    print("✓ Client created successfully with anon key")
    
    # Try a simple query
    result = client_anon.table('songs').select("*").limit(1).execute()
    print(f"✓ Query successful! Retrieved {len(result.data)} record(s)")
    print("\n⚠️  Note: Anon key works, but may have RLS restrictions for upsert operations")
    
except Exception as e:
    print(f"✗ Failed with anon key: {e}")
    print(f"   Error type: {type(e).__name__}")

# Test 3: Check if tables exist
print("\n" + "=" * 70)
print("Test 3: Checking if tables exist")
print("=" * 70)
try:
    # Try with whichever key worked
    test_client = create_client(url, anon_key)
    
    # Check songs table
    try:
        result = test_client.table('songs').select("count").execute()
        print(f"✓ 'songs' table exists")
    except Exception as e:
        print(f"✗ 'songs' table check failed: {e}")
    
    # Check song_sections table
    try:
        result = test_client.table('song_sections').select("count").execute()
        print(f"✓ 'song_sections' table exists")
    except Exception as e:
        print(f"✗ 'song_sections' table check failed: {e}")
        
except Exception as e:
    print(f"✗ Could not check tables: {e}")

print("\n" + "=" * 70)
print("Recommendation:")
print("=" * 70)
print("If anon key works but service_role key doesn't:")
print("1. Try using the anon key for now (set SUPABASE_SERVICE_ROLE_KEY to same value as anon key)")
print("2. Make sure RLS policies allow insert/update operations")
print("3. Or disable RLS on songs and song_sections tables temporarily")
print("=" * 70)
