"""
RidePair - shared student travel.

Run it with:      python -m uvicorn backend.main:app --reload
Then open:        http://127.0.0.1:8000
Interactive API:  http://127.0.0.1:8000/docs
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend import config
from backend.database import init_db
from backend.routers import rides, users

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# The built React app (npm run build inside frontend/) lands here.
STATIC_DIR = os.path.join(BASE_DIR, "static_react")

app = FastAPI(
    title="RidePair API",
    description="Shared travel for verified college students.",
    version="2.0.0",
)

# In development the React dev server runs on :5173 and proxies /api here,
# so this is mostly belt-and-braces.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok", "app": "RidePair"}


@app.get("/api/meta", tags=["meta"])
def meta():
    """Everything the frontend needs to build its forms and chips. Keeping
    this server-side means adding a hub is a one-line config change."""
    return {
        "college": config.COLLEGE_NAME,
        "college_short": config.COLLEGE_SHORT,
        "currency": config.CURRENCY,
        "email_domains": config.ALLOWED_EMAIL_DOMAINS,
        "pickup_points": config.PICKUP_POINTS,
        "hubs": config.HUBS,
        "vehicle_types": config.VEHICLE_TYPES,
        "luggage_options": config.LUGGAGE_OPTIONS,
        "time_flex_options": config.TIME_FLEX_OPTIONS,
        "max_group_size": config.MAX_GROUP_SIZE,
        "time_window_minutes": config.TIME_WINDOW_MINUTES,
        "weights": {
            "time": config.WEIGHT_TIME,
            "destination": config.WEIGHT_DESTINATION,
            "pickup": config.WEIGHT_PICKUP,
            "seats": config.WEIGHT_SEATS,
            "luggage": config.WEIGHT_LUGGAGE,
        },
    }


app.include_router(users.router)
app.include_router(rides.router)


# ---------------------------------------------------------------------------
# Serve the built React app (production). In development you use the Vite
# dev server on :5173 instead, and these routes simply never get hit.
# ---------------------------------------------------------------------------
if os.path.isdir(STATIC_DIR):
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    index_file = os.path.join(STATIC_DIR, "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        """React Router owns the URLs, so every non-API path returns
        index.html and the app renders the right screen client-side."""
        candidate = os.path.join(STATIC_DIR, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(index_file)
