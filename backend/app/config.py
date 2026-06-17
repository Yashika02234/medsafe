import os

# Comma-separated list of allowed origins for CORS — the Vercel frontend domain(s).
# Local dev: http://localhost:3000. Production: set ALLOWED_ORIGINS in Render env vars.
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
