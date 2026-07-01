import os
from dotenv import load_dotenv

load_dotenv()

USE_MOCK_DB = os.getenv("MOCK_DB", "").lower() in ("1", "true", "yes")

if USE_MOCK_DB:
    from db.mock_supabase import MockSupabaseClient

    supabase = MockSupabaseClient()
else:
    from supabase import create_client, Client

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables")

    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    except Exception as e:
        raise ConnectionError(f"Failed to connect to Supabase: {e}")
