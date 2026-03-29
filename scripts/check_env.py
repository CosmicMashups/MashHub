"""
Quick diagnostic script to check .env loading
"""
import os
from dotenv import load_dotenv

# Try different approaches to load .env
print("=" * 60)
print("Environment Variable Diagnostic")
print("=" * 60)

# Method 1: Default load_dotenv (looks in current directory)
print("\n1. Loading .env from current directory...")
load_dotenv()

# Method 2: Explicit path
print("\n2. Loading .env with explicit path...")
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, ".env")
print(f"   Trying: {env_path}")
load_dotenv(env_path)

# Check what was loaded
print("\n3. Checking environment variables:")
print(f"   VITE_SUPABASE_URL: {os.getenv('VITE_SUPABASE_URL')}")
print(f"   VITE_SUPABASE_ANON_KEY: {'[SET]' if os.getenv('VITE_SUPABASE_ANON_KEY') else '[NOT SET]'}")
print(f"   SUPABASE_SERVICE_ROLE_KEY: {'[SET]' if os.getenv('SUPABASE_SERVICE_ROLE_KEY') else '[NOT SET]'}")

# Show length if set
service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
if service_key:
    print(f"\n4. SUPABASE_SERVICE_ROLE_KEY details:")
    print(f"   Length: {len(service_key)} characters")
    print(f"   Starts with: {service_key[:20]}...")
    print(f"   Contains spaces: {' ' in service_key}")
    print(f"   Stripped length: {len(service_key.strip())}")
else:
    print("\n4. SUPABASE_SERVICE_ROLE_KEY is NOT loaded!")
    print("   Please check your .env file.")

print("\n" + "=" * 60)
