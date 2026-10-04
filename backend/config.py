"""
RidePair configuration.

EDIT THIS FILE to match your college. Everything else reads from here,
so you never have to hunt through the codebase to change a hub or a fare.
"""

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
SECRET_KEY = "ridepair-hackathon-secret-change-in-production"
TOKEN_EXPIRY_HOURS = 72  # long enough that nobody gets logged out mid-demo

# Only students with a college email can register. This is the "closed,
# verified campus network" that separates RidePair from public ride-hailing.
#
# >>> If signup blocks you during the demo, set ENFORCE_COLLEGE_EMAIL = False <<<
ENFORCE_COLLEGE_EMAIL = True
ALLOWED_EMAIL_DOMAINS = ["lpu.in"]
COLLEGE_NAME = "Lovely Professional University"
COLLEGE_SHORT = "LPU"
CURRENCY = "₹"

# ---------------------------------------------------------------------------
# Campus pickup points
# ---------------------------------------------------------------------------
PICKUP_POINTS = [
    {"name": "Uni Mall / Main Gate", "detail": "Main vehicle loading bay"},
    {"name": "Law Gate", "detail": "Auto stand outside Law Gate"},
    {"name": "Block 34 Hostel Gate", "detail": "Boys hostel pickup point"},
    {"name": "Girls Hostel Gate (Block 11)", "detail": "Girls hostel pickup point"},
    {"name": "Green Valley Gate", "detail": "Back gate, quieter pickup"},
    {"name": "Deep Complex", "detail": "Near the shopping complex"},
]

# ---------------------------------------------------------------------------
# Transit hubs students actually travel to
#   category drives the coloured chip in the UI: airport | rail | bus
#   fare     = estimated TOTAL cab fare for the whole vehicle
#   minutes  = estimated travel time, shown as "est. ride time"
# ---------------------------------------------------------------------------
HUBS = [
    {"name": "Jalandhar City Railway Station", "category": "rail",
     "detail": "Platform 1 entry / main porch", "fare": 700, "minutes": 45},
    {"name": "Ludhiana Railway Station", "category": "rail",
     "detail": "Main entrance, Shatabdi side", "fare": 1200, "minutes": 60},
    {"name": "Phagwara Bus Stand", "category": "bus",
     "detail": "Main terminal gate", "fare": 200, "minutes": 15},
    {"name": "Jalandhar Bus Stand", "category": "bus",
     "detail": "Interstate departure bay", "fare": 600, "minutes": 40},
    {"name": "Chandigarh ISBT-43", "category": "bus",
     "detail": "Sector 43 interstate terminal", "fare": 2800, "minutes": 150},
    {"name": "Delhi — Kashmere Gate ISBT", "category": "bus",
     "detail": "Inter-state bus terminal", "fare": 6000, "minutes": 330},
    {"name": "Sri Guru Ram Das Jee Airport (Amritsar)", "category": "airport",
     "detail": "Domestic departures, Terminal 1", "fare": 2800, "minutes": 150},
    {"name": "Chandigarh Airport (IXC)", "category": "airport",
     "detail": "Departures forecourt", "fare": 3200, "minutes": 160},
    {"name": "Delhi Airport (IGI Terminal 3)", "category": "airport",
     "detail": "T3 departures kerbside", "fare": 7000, "minutes": 350},
]

# Quick lookups built once at import.
HUB_BY_NAME = {h["name"]: h for h in HUBS}
DESTINATIONS = {h["name"]: h["fare"] for h in HUBS}
DEFAULT_FARE = 500
DEFAULT_MINUTES = 60

# ---------------------------------------------------------------------------
# Ride options (these populate the Post a Ride form)
# ---------------------------------------------------------------------------
VEHICLE_TYPES = [
    {"id": "xl", "label": "Cab XL / Innova",
     "detail": "Seats 4-6 riders with plenty of luggage clearance", "max_seats": 6},
    {"id": "sedan", "label": "Standard Cab (Sedan)",
     "detail": "Best for 2-3 riders with lighter bags", "max_seats": 4},
    {"id": "auto", "label": "Shared Auto",
     "detail": "Cheapest option for short station runs", "max_seats": 3},
]

LUGGAGE_OPTIONS = [
    {"id": "backpack", "label": "Backpack / personal bag only", "icon": "backpack"},
    {"id": "carryon", "label": "1 cabin bag + backpack", "icon": "luggage"},
    {"id": "checked", "label": "Large checked suitcase", "icon": "cases"},
]

# How far either side of the stated time a ride is willing to flex.
TIME_FLEX_OPTIONS = [
    {"id": 0, "label": "Exact time"},
    {"id": 15, "label": "±15 mins"},
    {"id": 30, "label": "±30 mins", "recommended": True},
    {"id": 60, "label": "±1 hour"},
]

# A shared cab realistically seats this many students.
MAX_GROUP_SIZE = 4

# ---------------------------------------------------------------------------
# Matching engine tuning
# ---------------------------------------------------------------------------
# Fallback window when neither side states a flexibility preference.
TIME_WINDOW_MINUTES = 45

# Weights must add up to 100 so the score reads as a clean percentage.
WEIGHT_TIME = 45        # how close the departure times are
WEIGHT_DESTINATION = 20 # exact hub vs. loose text match
WEIGHT_PICKUP = 15      # same pickup point on campus
WEIGHT_SEATS = 12       # does the group actually fit
WEIGHT_LUGGAGE = 8      # is there room for everyone's bags

MIN_SCORE_TO_SHOW = 35  # hide near-useless matches

# ---------------------------------------------------------------------------
# Impact numbers
# ---------------------------------------------------------------------------
CO2_KG_PER_SHARED_TRIP = 2.5   # rough estimate: one car trip avoided
CO2_GOAL_KG = 50               # dashboard progress ring target
