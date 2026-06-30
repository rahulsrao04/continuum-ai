import os
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
import httpx

from db.supabase import supabase
from routers import projects, checkpoints, handoff, test

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Rate limiting (in-memory, will upgrade to Redis later)
rate_limit_store = {}
RATE_LIMIT_REQUESTS = 100
RATE_LIMIT_WINDOW = 60  # seconds

oauth2_scheme = HTTPBearer()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Verify connections
    logger.info("Starting Continuum AI API...")
    
    try:
        supabase.table("users").select("id").limit(1).execute()
        logger.info("✓ Supabase connection verified")
    except Exception as e:
        logger.error(f"✗ Supabase connection failed: {e}")
        raise
    
    logger.info("API startup complete")
    yield
    # Shutdown: Cleanup if needed
    logger.info("API shutting down...")


app = FastAPI(
    title="Continuum AI API",
    description="Persistent memory layer across AI tools",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
allowed_origins = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

# Remove duplicates and filter empty strings
allowed_origins = list(set([origin for origin in allowed_origins if origin]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    # Clean up old entries
    rate_limit_store[client_ip] = [
        timestamp for timestamp in rate_limit_store.get(client_ip, [])
        if current_time - timestamp < RATE_LIMIT_WINDOW
    ]
    
    # Check rate limit
    if len(rate_limit_store.get(client_ip, [])) >= RATE_LIMIT_REQUESTS:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    # Add current request
    rate_limit_store.setdefault(client_ip, []).append(current_time)
    
    # Log request
    start_time = time.time()
    logger.info(f"{request.method} {request.url.path} - IP: {client_ip}")
    
    response = await call_next(request)
    
    # Log response
    process_time = (time.time() - start_time) * 1000
    logger.info(f"{request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.2f}ms")
    
    return response


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)):
    """
    Validate Supabase JWT token and return user_id
    """
    token = credentials.credentials
    
    try:
        # Verify token with Supabase
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_ANON_KEY
                }
            )
            
            if response.status_code == 200:
                user_data = response.json()
                return user_data.get("id")
            else:
                logger.warning(f"Invalid token attempt")
                raise HTTPException(status_code=401, detail="Invalid authentication token")
    except Exception as e:
        logger.error(f"Auth verification error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


# Health check endpoints
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@app.get("/health/db")
async def health_db():
    """Test Supabase connection"""
    start_time = time.time()
    try:
        supabase.table("users").select("id").limit(1).execute()
        latency = (time.time() - start_time) * 1000
        return {
            "status": "ok",
            "latency_ms": round(latency, 2)
        }
    except Exception as e:
        latency = (time.time() - start_time) * 1000
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "error",
            "latency_ms": round(latency, 2),
            "error": str(e)
        }


@app.get("/health/groq")
async def health_groq():
    """Test Groq API connection"""
    if not GROQ_API_KEY:
        return {
            "status": "error",
            "error": "GROQ_API_KEY not configured"
        }
    
    start_time = time.time()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama3-8b-8192",
                    "messages": [{"role": "user", "content": "test"}],
                    "max_tokens": 1
                },
                timeout=10.0
            )
            
            latency = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                return {
                    "status": "ok",
                    "latency_ms": round(latency, 2)
                }
            else:
                return {
                    "status": "error",
                    "latency_ms": round(latency, 2),
                    "error": f"HTTP {response.status_code}"
                }
    except Exception as e:
        latency = (time.time() - start_time) * 1000
        logger.error(f"Groq health check failed: {e}")
        return {
            "status": "error",
            "latency_ms": round(latency, 2),
            "error": str(e)
        }


# Mount routers
app.include_router(projects.router, prefix="/api", tags=["projects"])
app.include_router(checkpoints.router, prefix="/api", tags=["checkpoints"])
app.include_router(handoff.router, prefix="/api", tags=["handoff"])
app.include_router(test.router, prefix="/api", tags=["test"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
