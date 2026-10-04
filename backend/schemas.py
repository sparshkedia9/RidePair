"""
Schemas = the shape of the JSON going in and out of the API.

FastAPI validates every incoming request against these automatically.
If a field is missing or the wrong type, the client gets a clear 422 error
and your route code never even runs.
"""
from datetime import date
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ----------------------------- auth ----------------------------------------
class SignupIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str
    password: str = Field(min_length=6, max_length=128)
    phone: str = Field(min_length=6, max_length=20)
    gender: Optional[str] = None
    class_year: Optional[str] = None
    major: Optional[str] = None
    dorm: Optional[str] = None
    share_contact_on_match: bool = True


class LoginIn(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    college: str
    phone: str
    gender: Optional[str] = None
    class_year: Optional[str] = None
    major: Optional[str] = None
    dorm: Optional[str] = None
    rating: float = 5.0
    rides_hosted: int = 0
    reviews_count: int = 0
    initials: str = ""


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ----------------------------- rides ---------------------------------------
class RideCreate(BaseModel):
    ride_type: str                      # "offer" or "seek"
    from_location: str
    pickup_detail: Optional[str] = None
    to_location: str
    drop_detail: Optional[str] = None
    ride_date: date
    depart_time: str = Field(pattern=r"^\d{2}:\d{2}$")   # "17:00"
    time_flex: int = Field(default=30, ge=0, le=120)
    seats: int = Field(ge=1, le=7)
    fare_total: Optional[int] = Field(default=None, ge=0)
    fare_per_seat: Optional[int] = Field(default=None, ge=0)
    vehicle_type: str = "sedan"
    vehicle_info: Optional[str] = None
    luggage: str = "carryon"
    gender_only: bool = False
    notes: Optional[str] = Field(default=None, max_length=400)


class RiderOut(BaseModel):
    """A co-traveller. Contact details only appear once you share a ride."""
    id: int
    name: str
    initials: str = ""
    class_year: Optional[str] = None
    major: Optional[str] = None
    rating: float = 5.0
    rides_hosted: int = 0
    is_host: bool = False
    phone: Optional[str] = None


class RideOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ride_code: Optional[str] = None
    ride_type: str
    from_location: str
    pickup_detail: Optional[str] = None
    to_location: str
    drop_detail: Optional[str] = None
    hub_category: str = "custom"
    ride_date: date
    depart_time: str
    time_flex: int = 30
    est_duration_min: int = 60
    seats_total: int
    seats_available: int
    seats_filled_pct: int = 0
    fare_total: int
    fare_per_seat: int
    solo_fare: int = 0
    vehicle_type: str = "sedan"
    vehicle_info: Optional[str] = None
    luggage: str = "carryon"
    gender_only: bool = False
    notes: Optional[str] = None
    status: str
    creator: RiderOut
    riders: List[RiderOut] = []
    riders_count: int = 1
    is_mine: bool = False
    has_joined: bool = False


class MatchQuery(BaseModel):
    """What a student is looking for."""
    ride_type: str                      # what THEY are doing: "offer" or "seek"
    from_location: str
    to_location: str
    ride_date: date
    depart_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    time_flex: int = Field(default=30, ge=0, le=120)
    group_size: int = Field(default=1, ge=1, le=7)
    luggage: Optional[str] = None
    # Quick filters from the results toolbar
    min_score: Optional[int] = Field(default=None, ge=0, le=100)
    hub_category: Optional[str] = None
    gender_only: bool = False


class MatchOut(BaseModel):
    """A ride plus WHY it matched - the breakdown is what we show on stage."""
    ride: RideOut
    score: int
    match_kind: str          # "join_car" | "group_up" | "give_seat"
    headline: str
    time_gap_minutes: int
    your_share: int
    you_save: int
    save_pct: int = 0
    reasons: List[str]
    breakdown: dict


class DashboardOut(BaseModel):
    upcoming: List[RideOut]
    past: List[RideOut]
    posted: List[RideOut]
    joined: List[RideOut]
    total_saved: int
    trips_shared: int
    co2_kg: int
    co2_goal_kg: int
    rating: float
    upcoming_count: int


class HubStat(BaseModel):
    name: str
    category: str
    detail: Optional[str] = None
    fare: int
    minutes: int
    active_rides: int = 0
    avg_share: int = 0


class CampusStats(BaseModel):
    """Numbers for the landing page."""
    college: str
    total_saved: int
    completed_runs: int
    students_travelling: int
    verified_students: int
    hubs: List[HubStat]
