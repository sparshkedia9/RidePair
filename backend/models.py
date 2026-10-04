"""
The database tables.

Three tables carry the whole product:
  User      - a verified student, with the campus identity the UI shows
              (class year, major, hostel, trust rating)
  Ride      - ONE table for both "I'm offering seats in my cab" and
              "I need to get somewhere, find me people to split with".
              The ride_type column is what separates them.
  RideJoin  - who joined which ride (many-to-many). Keeping this separate
              is what lets one ride have many passengers AND one student
              join many rides.
"""
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, Date, DateTime, Float, ForeignKey, Index, Integer,
    String, UniqueConstraint,
)
from sqlalchemy.orm import relationship

from backend.database import Base

# ride_type values
OFFER = "offer"  # student has booked/owns a cab and is giving seats away
SEEK = "seek"    # student needs to travel and wants people to split with


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    college = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=False)
    gender = Column(String(20), nullable=True)

    # Campus identity — these render as the chips on every ride card.
    class_year = Column(String(10), nullable=True)     # "2026"
    major = Column(String(100), nullable=True)         # "Computer Science"
    dorm = Column(String(120), nullable=True)          # "Block 34, Boys Hostel"

    # Trust signals shown next to the avatar.
    rating = Column(Float, default=5.0)
    rides_hosted = Column(Integer, default=0)
    reviews_count = Column(Integer, default=0)

    # Privacy: contact details are only ever shared with confirmed co-riders.
    share_contact_on_match = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    rides = relationship("Ride", back_populates="creator", cascade="all, delete-orphan")
    joins = relationship("RideJoin", back_populates="user", cascade="all, delete-orphan")

    @property
    def initials(self):
        parts = (self.name or "?").split()
        return "".join(p[0] for p in parts[:2]).upper()


class Ride(Base):
    __tablename__ = "rides"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    ride_type = Column(String(10), nullable=False)  # OFFER or SEEK

    # Where from — campus pickup point plus the precise landmark.
    from_location = Column(String(200), nullable=False)
    pickup_detail = Column(String(200), nullable=True)

    # Where to — a transit hub plus the precise terminal/platform.
    to_location = Column(String(200), nullable=False, index=True)
    drop_detail = Column(String(200), nullable=True)
    hub_category = Column(String(20), default="custom")   # airport | rail | bus | custom

    ride_date = Column(Date, nullable=False, index=True)
    depart_time = Column(String(5), nullable=False)      # "17:00" - for display
    depart_minutes = Column(Integer, nullable=False)     # 1020 - for maths
    time_flex = Column(Integer, default=30)              # 0 / 15 / 30 / 60 minutes
    est_duration_min = Column(Integer, default=60)

    # For an OFFER: seats in the cab. For a SEEK: how many people are already
    # in this group (starts at 1 = just the poster).
    seats_total = Column(Integer, nullable=False)
    seats_available = Column(Integer, nullable=False)

    fare_total = Column(Integer, nullable=False)      # whole-vehicle estimate
    fare_per_seat = Column(Integer, nullable=False)   # what each person pays

    vehicle_type = Column(String(20), default="sedan")   # xl | sedan | auto
    vehicle_info = Column(String(120), nullable=True)    # "Innova - PB10 AB 1234"
    luggage = Column(String(20), default="carryon")      # backpack | carryon | checked

    # Safety: when on, only students of the same gender can join.
    gender_only = Column(Boolean, default=False)

    notes = Column(String(400), nullable=True)
    status = Column(String(20), default="open")        # open | full | cancelled
    ride_code = Column(String(12), nullable=True)      # "RP-8492" shown in the UI

    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", back_populates="rides")
    joins = relationship("RideJoin", back_populates="ride", cascade="all, delete-orphan")

    # The matching pre-filter narrows on date + status + departure window,
    # in that order - so the composite index is built in that exact order.
    # (A to_location-leading index is NOT used here: destination matching is
    # fuzzy and happens in the scorer, not in SQL.)
    __table_args__ = (
        Index("ix_rides_match", "ride_date", "status", "depart_minutes"),
        Index("ix_rides_hub", "to_location", "ride_date"),
    )

    @property
    def riders_count(self):
        """Total people travelling: the poster plus everyone who joined."""
        return 1 + len(self.joins)

    @property
    def seats_filled_pct(self):
        """Roster status bar on the ride detail page."""
        capacity = self.seats_total if self.ride_type == OFFER else MAX_CAPACITY
        capacity = max(1, capacity)
        return min(100, round(self.riders_count / (capacity + 1) * 100))


MAX_CAPACITY = 4


class RideJoin(Base):
    __tablename__ = "ride_joins"

    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    ride = relationship("Ride", back_populates="joins")
    user = relationship("User", back_populates="joins")

    # A student can never join the same ride twice.
    __table_args__ = (
        UniqueConstraint("ride_id", "user_id", name="uq_ride_user"),
    )
