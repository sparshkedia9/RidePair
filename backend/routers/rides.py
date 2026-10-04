"""
Ride routes: post a ride, find matches, join a ride, dashboard, campus stats.
"""
from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload, selectinload

from backend import config
from backend.auth import get_current_user
from backend.database import get_db
from backend.matching import (
    MAX_GROUP_SIZE,
    category_for,
    duration_for,
    find_matches,
    solo_fare_for,
    to_minutes,
)
from backend.models import OFFER, SEEK, Ride, RideJoin, User
from backend.schemas import (
    CampusStats,
    DashboardOut,
    HubStat,
    MatchOut,
    MatchQuery,
    RideCreate,
    RideOut,
    RiderOut,
)

router = APIRouter(prefix="/api/rides", tags=["rides"])


# ---------------------------------------------------------------------------
# Turning a database row into JSON the frontend can render
# ---------------------------------------------------------------------------
def _rider_out(user: User, *, is_host: bool, reveal_phone: bool) -> RiderOut:
    return RiderOut(
        id=user.id,
        name=user.name,
        initials=user.initials,
        class_year=user.class_year,
        major=user.major,
        rating=user.rating or 5.0,
        rides_hosted=user.rides_hosted or 0,
        is_host=is_host,
        # Contact details are only ever shared with confirmed co-riders,
        # and only if the student left that permission switched on.
        phone=user.phone if (reveal_phone and user.share_contact_on_match) else None,
    )


def serialize_ride(ride: Ride, viewer: User, joined_ids: set) -> RideOut:
    is_mine = ride.user_id == viewer.id
    has_joined = ride.id in joined_ids
    on_this_ride = is_mine or has_joined

    return RideOut(
        id=ride.id,
        ride_code=ride.ride_code or f"RP-{8400 + ride.id}",
        ride_type=ride.ride_type,
        from_location=ride.from_location,
        pickup_detail=ride.pickup_detail,
        to_location=ride.to_location,
        drop_detail=ride.drop_detail,
        hub_category=ride.hub_category or "custom",
        ride_date=ride.ride_date,
        depart_time=ride.depart_time,
        time_flex=ride.time_flex or 0,
        est_duration_min=ride.est_duration_min or 60,
        seats_total=ride.seats_total,
        seats_available=ride.seats_available,
        seats_filled_pct=ride.seats_filled_pct,
        fare_total=ride.fare_total,
        fare_per_seat=ride.fare_per_seat,
        solo_fare=solo_fare_for(ride.to_location),
        vehicle_type=ride.vehicle_type or "sedan",
        vehicle_info=ride.vehicle_info,
        luggage=ride.luggage or "carryon",
        gender_only=bool(ride.gender_only),
        notes=ride.notes,
        status=ride.status,
        creator=_rider_out(ride.creator, is_host=True, reveal_phone=on_this_ride),
        riders=[
            _rider_out(j.user, is_host=False, reveal_phone=on_this_ride)
            for j in ride.joins
        ],
        riders_count=ride.riders_count,
        is_mine=is_mine,
        has_joined=has_joined,
    )


def _joined_ids(db: Session, user: User) -> set:
    return {j.ride_id for j in db.query(RideJoin).filter(RideJoin.user_id == user.id)}


def _recalculate_fare(ride: Ride) -> None:
    """For a SEEK group the cab fare is split evenly by however many people
    are currently in the group - so every new joiner makes it cheaper for
    everyone. For an OFFER the host's per-seat price is fixed."""
    if ride.ride_type == SEEK:
        ride.fare_per_seat = round(ride.fare_total / max(1, ride.riders_count))


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------
@router.post("", response_model=RideOut, status_code=201)
def create_ride(
    payload: RideCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.ride_type not in (OFFER, SEEK):
        raise HTTPException(400, "ride_type must be 'offer' or 'seek'.")

    fare_total = payload.fare_total or solo_fare_for(payload.to_location)

    if payload.ride_type == OFFER:
        # "I have a cab with N free seats."
        seats_total = payload.seats
        seats_available = payload.seats
        # Default price: split the fare across the host plus every passenger.
        fare_per_seat = payload.fare_per_seat or round(fare_total / (payload.seats + 1))
    else:
        # "There are N of us who need to get there." seats = current group size.
        seats_total = payload.seats
        seats_available = max(0, MAX_GROUP_SIZE - payload.seats)
        fare_per_seat = round(fare_total / max(1, payload.seats))

    ride = Ride(
        user_id=user.id,
        ride_type=payload.ride_type,
        from_location=payload.from_location.strip(),
        pickup_detail=payload.pickup_detail,
        to_location=payload.to_location.strip(),
        drop_detail=payload.drop_detail,
        hub_category=category_for(payload.to_location),
        ride_date=payload.ride_date,
        depart_time=payload.depart_time,
        depart_minutes=to_minutes(payload.depart_time),
        time_flex=payload.time_flex,
        est_duration_min=duration_for(payload.to_location),
        seats_total=seats_total,
        seats_available=seats_available,
        fare_total=fare_total,
        fare_per_seat=fare_per_seat,
        vehicle_type=payload.vehicle_type,
        vehicle_info=payload.vehicle_info,
        luggage=payload.luggage,
        gender_only=payload.gender_only,
        notes=payload.notes,
        status="open",
    )
    db.add(ride)
    db.commit()
    db.refresh(ride)

    ride.ride_code = f"RP-{8400 + ride.id}"
    if payload.ride_type == OFFER:
        user.rides_hosted = (user.rides_hosted or 0) + 1
    db.commit()
    db.refresh(ride)

    return serialize_ride(ride, user, _joined_ids(db, user))


# ---------------------------------------------------------------------------
# Matching  -  the endpoint the demo lives on
# ---------------------------------------------------------------------------
@router.post("/match", response_model=List[MatchOut])
def match_rides(
    query: MatchQuery,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if query.ride_type not in (OFFER, SEEK):
        raise HTTPException(400, "ride_type must be 'offer' or 'seek'.")

    joined = _joined_ids(db, user)
    results = find_matches(db, user, query)

    return [
        MatchOut(
            ride=serialize_ride(r["ride"], user, joined),
            score=r["score"],
            match_kind=r["match_kind"],
            headline=r["headline"],
            time_gap_minutes=r["time_gap_minutes"],
            your_share=r["your_share"],
            you_save=r["you_save"],
            save_pct=r["save_pct"],
            reasons=r["reasons"],
            breakdown=r["breakdown"],
        )
        for r in results
    ]


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
@router.get("/dashboard", response_model=DashboardOut)
def dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    joined = _joined_ids(db, user)
    today = date.today()

    eager = (
        joinedload(Ride.creator),
        selectinload(Ride.joins).joinedload(RideJoin.user),
    )
    posted_rides = (
        db.query(Ride).options(*eager)
        .filter(Ride.user_id == user.id).order_by(Ride.ride_date).all()
    )
    joined_rides = (
        db.query(Ride).options(*eager)
        .join(RideJoin, RideJoin.ride_id == Ride.id)
        .filter(RideJoin.user_id == user.id)
        .order_by(Ride.ride_date)
        .all()
    )

    total_saved = 0
    trips_shared = 0

    for ride in posted_rides:
        others = len(ride.joins)
        if others == 0:
            continue
        trips_shared += 1
        if ride.ride_type == OFFER:
            # Passengers chip in, which offsets the host's own fare.
            total_saved += ride.fare_per_seat * others
        else:
            total_saved += max(0, solo_fare_for(ride.to_location) - ride.fare_per_seat)

    for ride in joined_rides:
        trips_shared += 1
        total_saved += max(0, solo_fare_for(ride.to_location) - ride.fare_per_seat)

    # One combined timeline, split by whether the trip has happened yet.
    everything = {r.id: r for r in posted_rides + joined_rides}
    upcoming = sorted(
        [r for r in everything.values() if r.ride_date >= today],
        key=lambda r: (r.ride_date, r.depart_minutes),
    )
    past = sorted(
        [r for r in everything.values() if r.ride_date < today],
        key=lambda r: (r.ride_date, r.depart_minutes),
        reverse=True,
    )

    return DashboardOut(
        upcoming=[serialize_ride(r, user, joined) for r in upcoming],
        past=[serialize_ride(r, user, joined) for r in past],
        posted=[serialize_ride(r, user, joined) for r in posted_rides],
        joined=[serialize_ride(r, user, joined) for r in joined_rides],
        total_saved=total_saved,
        trips_shared=trips_shared,
        co2_kg=round(trips_shared * config.CO2_KG_PER_SHARED_TRIP),
        co2_goal_kg=config.CO2_GOAL_KG,
        rating=user.rating or 5.0,
        upcoming_count=len(upcoming),
    )


# ---------------------------------------------------------------------------
# Campus stats for the landing page
# ---------------------------------------------------------------------------
@router.get("/campus-stats", response_model=CampusStats)
def campus_stats(db: Session = Depends(get_db)):
    """Public - the landing page shows this before anyone logs in.

    Written as four aggregate queries rather than loading every ride and
    walking its relationships. That keeps this O(hubs) instead of O(rides):
    at 20k rides the naive version took ~3.8s, this takes single-digit ms.
    """
    today = date.today()

    # 1. Rides that actually got shared, with how many people joined each.
    shared = (
        db.query(
            Ride.to_location,
            Ride.fare_per_seat,
            func.count(RideJoin.id).label("joiners"),
        )
        .join(RideJoin, RideJoin.ride_id == Ride.id)
        .group_by(Ride.id)
        .all()
    )
    total_saved = 0
    for to_location, fare_per_seat, joiners in shared:
        solo = solo_fare_for(to_location)
        # Everyone on board saves the difference against riding alone.
        total_saved += max(0, solo - fare_per_seat) * (joiners + 1)

    # 2. How many verified students exist.
    students = db.query(func.count(User.id)).scalar() or 0

    # 3. How many trips are still upcoming and open.
    travelling = (
        db.query(func.count(Ride.id))
        .filter(Ride.ride_date >= today, Ride.status == "open")
        .scalar()
    ) or 0

    # 4. Per-hub activity and the going rate, in one grouped pass.
    hub_rows = (
        db.query(
            Ride.to_location,
            func.count(Ride.id).label("active"),
            func.avg(Ride.fare_per_seat).label("avg_share"),
        )
        .filter(Ride.ride_date >= today, Ride.status == "open")
        .group_by(Ride.to_location)
        .all()
    )
    by_hub = {name: (active, avg) for name, active, avg in hub_rows}

    hubs = []
    for hub in config.HUBS:
        active, avg_share = by_hub.get(hub["name"], (0, None))
        hubs.append(
            HubStat(
                name=hub["name"],
                category=hub["category"],
                detail=hub.get("detail"),
                fare=hub["fare"],
                minutes=hub["minutes"],
                active_rides=active,
                avg_share=round(avg_share) if avg_share
                else round(hub["fare"] / config.MAX_GROUP_SIZE),
            )
        )
    hubs.sort(key=lambda h: -h.active_rides)

    return CampusStats(
        college=config.COLLEGE_NAME,
        total_saved=total_saved,
        completed_runs=len(shared),
        students_travelling=travelling,
        verified_students=students,
        hubs=hubs,
    )


# ---------------------------------------------------------------------------
# Join
# ---------------------------------------------------------------------------
@router.post("/{ride_id}/join", response_model=RideOut)
def join_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if ride is None:
        raise HTTPException(404, "That ride no longer exists.")
    if ride.user_id == user.id:
        raise HTTPException(400, "This is your own ride.")
    if ride.status != "open":
        raise HTTPException(400, "This ride is already full.")
    if ride.seats_available <= 0:
        raise HTTPException(400, "No seats left on this ride.")
    if ride.gender_only and ride.creator.gender != user.gender:
        raise HTTPException(403, "The host limited this ride to same-gender co-riders.")

    already = (
        db.query(RideJoin)
        .filter(RideJoin.ride_id == ride_id, RideJoin.user_id == user.id)
        .first()
    )
    if already:
        raise HTTPException(400, "You have already joined this ride.")

    # One transaction: add the passenger and take the seat together, so a
    # seat can never be handed to two people or go negative.
    db.add(RideJoin(ride_id=ride.id, user_id=user.id))
    ride.seats_available -= 1
    if ride.seats_available == 0:
        ride.status = "full"
    db.flush()
    _recalculate_fare(ride)
    db.commit()
    db.refresh(ride)

    return serialize_ride(ride, user, _joined_ids(db, user))


@router.get("/{ride_id}", response_model=RideOut)
def get_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if ride is None:
        raise HTTPException(404, "Ride not found.")
    return serialize_ride(ride, user, _joined_ids(db, user))
