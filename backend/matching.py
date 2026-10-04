"""
THE MATCHING ENGINE.

This is the heart of RidePair and the part that makes it more than a
CRUD app. We do not simply FILTER rides - we SCORE and RANK every
candidate out of 100, and we can explain every point we awarded.

    score = 45 x time_proximity
          + 20 x destination_match
          + 15 x pickup_proximity
          + 12 x seat_fit
          +  8 x luggage_fit

Three kinds of match come out of one algorithm:

    join_car   a student who needs a ride  ->  a classmate offering seats
    group_up   a student who needs a ride  ->  ANOTHER student who needs a
               ride, so the two of them split one cab together
    give_seat  a student offering seats    ->  students looking for one

"group_up" is the interesting one: most ride-share apps can only connect a
rider to a driver. RidePair also connects riders to each other, so four
students who between them own no car still leave campus in a single cab.
"""
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload, selectinload

from backend import config
from backend.models import OFFER, SEEK, Ride, RideJoin, User

MAX_GROUP_SIZE = config.MAX_GROUP_SIZE

# Luggage is ordered: a ride that allows checked suitcases also allows
# anything smaller, so we compare ranks rather than exact values.
LUGGAGE_RANK = {"backpack": 0, "carryon": 1, "checked": 2}


# ---------------------------------------------------------------------------
# Time helpers - we store minutes-since-midnight so "within 45 minutes" is
# simple integer maths instead of fragile string or datetime parsing.
# ---------------------------------------------------------------------------
def to_minutes(hhmm: str) -> int:
    hours, minutes = hhmm.split(":")
    return int(hours) * 60 + int(minutes)


def to_hhmm(minutes: int) -> str:
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def pretty_time(hhmm: str) -> str:
    """17:05 -> 5:05 PM"""
    total = to_minutes(hhmm)
    hour, minute = total // 60, total % 60
    suffix = "AM" if hour < 12 else "PM"
    return f"{hour % 12 or 12}:{minute:02d} {suffix}"


def _normalise(text: str) -> str:
    return " ".join((text or "").lower().replace("-", " ").split())


def hub_info(destination: str) -> dict:
    return config.HUB_BY_NAME.get(destination, {})


def solo_fare_for(destination: str) -> int:
    """What this trip costs if you travel completely alone."""
    return hub_info(destination).get("fare", config.DEFAULT_FARE)


def duration_for(destination: str) -> int:
    return hub_info(destination).get("minutes", config.DEFAULT_MINUTES)


def category_for(destination: str) -> str:
    return hub_info(destination).get("category", "custom")


# ---------------------------------------------------------------------------
# The five scoring components. Each returns 0.0 - 1.0.
# ---------------------------------------------------------------------------
def _time_component(query_minutes: int, ride: Ride, query_flex: int) -> float:
    """The window is however flexible the MORE flexible side is willing to be,
    so a rider who says '±1 hour' genuinely sees more matches."""
    window = max(query_flex or 0, ride.time_flex or 0) or config.TIME_WINDOW_MINUTES
    gap = abs(query_minutes - ride.depart_minutes)
    if gap > window:
        return 0.0
    return 1.0 - (gap / window)


def _destination_component(a: str, b: str) -> float:
    a_norm, b_norm = _normalise(a), _normalise(b)
    if a_norm == b_norm:
        return 1.0
    # Loose match for free-typed destinations: how much vocabulary is shared?
    words_a, words_b = set(a_norm.split()), set(b_norm.split())
    if not words_a or not words_b:
        return 0.0
    overlap = len(words_a & words_b) / max(len(words_a), len(words_b))
    return overlap if overlap >= 0.5 else 0.0


def _pickup_component(a: str, b: str) -> float:
    if _normalise(a) == _normalise(b):
        return 1.0
    # Different pickup points, but both on campus - still workable.
    return 0.5


def _seat_component(match_kind: str, ride: Ride, group_size: int) -> float:
    if match_kind == "join_car":
        return 1.0 if ride.seats_available >= group_size else 0.0
    if match_kind == "give_seat":
        return 1.0 if ride.seats_available >= 1 else 0.5
    # group_up: can we all fit in one cab?
    combined = ride.riders_count + group_size
    if combined <= MAX_GROUP_SIZE:
        return 1.0
    if combined <= MAX_GROUP_SIZE + 1:
        return 0.4  # tight, might need a bigger vehicle
    return 0.0


def _luggage_component(ride: Ride, needed: Optional[str]) -> float:
    """Does this ride have room for the bags you're bringing?"""
    if not needed:
        return 1.0
    need = LUGGAGE_RANK.get(needed, 1)
    allowed = LUGGAGE_RANK.get(ride.luggage or "carryon", 1)
    if allowed >= need:
        return 1.0
    # One size too small is a maybe; two is a no.
    return 0.35 if allowed == need - 1 else 0.0


def classify(query_type: str, ride_type: str) -> Optional[str]:
    """What sort of match is this - and is it a match at all?"""
    if query_type == SEEK and ride_type == OFFER:
        return "join_car"
    if query_type == SEEK and ride_type == SEEK:
        return "group_up"
    if query_type == OFFER and ride_type == SEEK:
        return "give_seat"
    return None  # two drivers have no reason to be matched


# ---------------------------------------------------------------------------
# Scoring one candidate ride
# ---------------------------------------------------------------------------
def score_ride(query, ride: Ride, match_kind: str) -> dict:
    query_minutes = to_minutes(query.depart_time)
    query_flex = getattr(query, "time_flex", None) or 0
    luggage_need = getattr(query, "luggage", None)

    time_c = _time_component(query_minutes, ride, query_flex)
    dest_c = _destination_component(query.to_location, ride.to_location)
    pick_c = _pickup_component(query.from_location, ride.from_location)
    seat_c = _seat_component(match_kind, ride, query.group_size)
    lugg_c = _luggage_component(ride, luggage_need)

    score = (
        config.WEIGHT_TIME * time_c
        + config.WEIGHT_DESTINATION * dest_c
        + config.WEIGHT_PICKUP * pick_c
        + config.WEIGHT_SEATS * seat_c
        + config.WEIGHT_LUGGAGE * lugg_c
    )

    gap = abs(query_minutes - ride.depart_minutes)
    direction = "after" if ride.depart_minutes >= query_minutes else "before"

    # ----- money -----
    solo = solo_fare_for(ride.to_location)
    if match_kind == "group_up":
        combined = max(1, ride.riders_count + query.group_size)
        your_share = round(ride.fare_total / combined)
    else:
        # join_car / give_seat - the rate the host set per seat
        your_share = ride.fare_per_seat
    you_save = max(0, solo - your_share)
    save_pct = round(you_save / solo * 100) if solo else 0

    first_name = ride.creator.name.split()[0]

    # ----- human-readable reasons (these render on the match card) -----
    reasons = []
    if gap == 0:
        reasons.append("Leaves at exactly your time")
    else:
        reasons.append(f"{gap} min {direction} your time")
    if dest_c == 1.0:
        reasons.append("Same hub and terminal")
    if pick_c == 1.0:
        reasons.append(f"Same pickup point ({ride.from_location})")
    if match_kind == "join_car":
        reasons.append(f"{ride.seats_available} seat(s) free")
    elif match_kind == "group_up":
        reasons.append(f"Group of {ride.riders_count + query.group_size} sharing one cab")
    if lugg_c == 1.0 and luggage_need:
        reasons.append("Luggage space confirmed")
    if you_save > 0:
        reasons.append(f"Saves {config.CURRENCY}{you_save} ({save_pct}%)")

    headlines = {
        "join_car": f"Join {first_name}'s cab",
        "group_up": f"Group up with {first_name}",
        "give_seat": f"{first_name} needs a seat",
    }

    return {
        "score": int(round(score)),
        "match_kind": match_kind,
        "headline": headlines[match_kind],
        "time_gap_minutes": gap,
        "your_share": your_share,
        "you_save": you_save,
        "save_pct": save_pct,
        "reasons": reasons,
        "breakdown": {
            "time": round(config.WEIGHT_TIME * time_c, 1),
            "destination": round(config.WEIGHT_DESTINATION * dest_c, 1),
            "pickup": round(config.WEIGHT_PICKUP * pick_c, 1),
            "seats": round(config.WEIGHT_SEATS * seat_c, 1),
            "luggage": round(config.WEIGHT_LUGGAGE * lugg_c, 1),
        },
    }


# ---------------------------------------------------------------------------
# Finding and ranking every candidate
# ---------------------------------------------------------------------------
def find_matches(db: Session, user: User, query) -> List[dict]:
    """Returns scored matches, best first."""
    query_minutes = to_minutes(query.depart_time)
    # Widen the SQL pre-filter to the largest window any ride could ask for,
    # then let the scorer apply each ride's own flexibility precisely.
    widest = max(getattr(query, "time_flex", 0) or 0, 60, config.TIME_WINDOW_MINUTES)
    low, high = query_minutes - widest, query_minutes + widest

    joined_ids = {
        j.ride_id for j in db.query(RideJoin).filter(RideJoin.user_id == user.id).all()
    }

    # The database does the cheap filtering (date, status, time window);
    # Python does the expensive scoring on the handful that survive.
    candidates = (
        db.query(Ride)
        # Load the host and the passenger list up front. Without this, scoring
        # and serialising N rides fires 2N extra lazy-load queries (N+1).
        .options(
            joinedload(Ride.creator),
            selectinload(Ride.joins).joinedload(RideJoin.user),
        )
        .filter(
            Ride.ride_date == query.ride_date,
            Ride.status == "open",
            Ride.user_id != user.id,            # never match you with yourself
            Ride.depart_minutes >= low,
            Ride.depart_minutes <= high,
        )
        .all()
    )

    hub_filter = getattr(query, "hub_category", None)
    only_gender_safe = bool(getattr(query, "gender_only", False))
    min_score = getattr(query, "min_score", None) or config.MIN_SCORE_TO_SHOW

    results = []
    for ride in candidates:
        if ride.id in joined_ids:
            continue
        if ride.ride_type == OFFER and ride.seats_available <= 0:
            continue

        match_kind = classify(query.ride_type, ride.ride_type)
        if match_kind is None:
            continue

        # Safety rule: a same-gender-only ride is invisible to everyone else.
        if ride.gender_only and ride.creator.gender != user.gender:
            continue
        # The rider asked to see only same-gender rides.
        if only_gender_safe and ride.creator.gender != user.gender:
            continue
        if hub_filter and ride.hub_category != hub_filter:
            continue

        scored = score_ride(query, ride, match_kind)
        if scored["score"] < min_score:
            continue
        scored["ride"] = ride
        results.append(scored)

    # Best score first; ties broken by whoever leaves closest to your time.
    results.sort(key=lambda r: (-r["score"], r["time_gap_minutes"]))
    return results
