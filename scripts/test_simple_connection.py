"""
Test with updated Supabase library - simpler approach
"""
import os
from dotenv import load_dotenv

# Load environment
load_dotenv()

url = os.getenv("VITE_SUPABASE_URL")
anon_key = os.getenv("VITE_SUPABASE_ANON_KEY")
service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print("=" * 70)
print("Supabase Library Version Check and Connection Test")
print("=" * 70)

# Check supabase version
try:
    import supabase
    print(f"\n✓ Supabase library installed")
    print(f"  Version: {supabase.__version__ if hasattr(supabase, '__version__') else 'Unknown'}")
except ImportError as e:
    print(f"\n✗ Supabase library not found: {e}")
    print("\nPlease run: pip install --upgrade supabase")
    exit(1)

print(f"\nURL: {url}")
print(f"Anon key length: {len(anon_key) if anon_key else 'NOT SET'}")
print(f"Service key length: {len(service_key) if service_key else 'NOT SET'}")

# Try importing with updated syntax
print("\n" + "=" * 70)
print("Testing connection with anon key")
print("=" * 70)

try:
    from supabase import create_client, Client
    
    # Create client with just required parameters
    client = create_client(url, anon_key)
    print("✓ Client created successfully with anon key")
    
    # Try a simple query
    result = client.table('songs').select("id, title").limit(1).execute()
    print(f"✓ Query successful!")
    
    if result.data:
        print(f"  Sample record: {result.data[0]}")
    else:
        print("  Table is empty or query returned no results")
    
    # Try an upsert test
    print("\n" + "=" * 70)
    print("Testing UPSERT permission with anon key")
    print("=" * 70)
    
    test_data = {
        'id': 99999,  # Use a high ID unlikely to exist
        'title': 'TEST SONG - DELETE ME',
        'artist': 'Test Artist',
        'type': 'Test',
        'origin': 'Test Origin'
    }
    
    try:
        result = client.table('songs').upsert(test_data).execute()
        print("✓ UPSERT successful with anon key!")
        print("  You can use the anon key for the upsert script")
        
        # Clean up test record
        client.table('songs').delete().eq('id', 99999).execute()
        print("✓ Test record cleaned up")
        
    except Exception as e:
        print(f"✗ UPSERT failed: {e}")
        print("\nThis is likely due to Row Level Security (RLS) policies.")
        print("\nSolutions:")
        print("1. Disable RLS on 'songs' and 'song_sections' tables temporarily")
        print("2. Or create RLS policies that allow INSERT/UPDATE operations")
        print("3. Or contact Supabase support about the service_role key format")
        
except Exception as e:
    print(f"✗ Connection failed: {e}")
    print(f"  Error type: {type(e).__name__}")
    print("\nTry updating supabase library:")
    print("  pip install --upgrade supabase")

print("\n" + "=" * 70)
