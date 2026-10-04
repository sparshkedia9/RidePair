"""
Seed RidePair with realistic demo data.

    python seed.py

Wipes the database and rebuilds it with students, rides and a few existing
groups, so every screen looks alive during judging. Every seeded account
uses the password:  ridepair123
"""
from datetime import date, timedelta

from backend import config
from backend.auth import hash_password
from backend.database import Base, SessionLocal, engine, init_db
from backend.matching import category_for, duration_for, to_minutes
from backend.models import OFFER, SEEK, Ride, RideJoin, User

PASSWORD = "ridepair123"
TODAY = date.today()
TOMORROW = TODAY + timedelta(days=1)
LAST_WEEK = TODAY - timedelta(days=6)

#        name,            key,      phone,        gender,   year,  major,                  hostel,                     rating, hosted, reviews
STUDENTS = [
    ("Priya Sharma",    "priya",   "9876500011", "female", "2026", "Computer Science",     "Block 11, Girls Hostel",     4.9, 8,  8),
    ("Rahul Verma",     "rahul",   "9876500022", "male",   "2025", "Mechanical Eng",       "Block 34, Boys Hostel",      4.8, 3,  3),
    ("Aman Singh",      "aman",    "9876500033", "male",   "2027", "Electronics",          "Block 38, Boys Hostel",      5.0, 1,  1),
    ("Simran Kaur",     "simran",  "9876500044", "female", "2026", "Biotechnology",        "Block 11, Girls Hostel",     4.9, 5,  5),
    ("Karan Gupta",     "karan",   "9876500055", "male",   "2025", "Civil Eng",            "Green Valley Apartments",    4.7, 2,  2),
    ("Neha Bansal",     "neha",    "9876500066", "female", "2027", "Design",               "Block 9, Girls Hostel",      4.9, 6,  6),
    ("Arjun Mehta",     "arjun",   "9876500077", "male",   "2026", "Computer Science",     "Deep Complex",               5.0, 14, 12),
    ("Ishita Rao",      "ishita",  "9876500088", "female", "2028", "Management",           "Block 7, Girls Hostel",      4.8, 0,  0),
    ("Vikram Chauhan",  "vikram",  "9876500099", "male",   "2025", "Agriculture",          "Block 34, Boys Hostel",      4.6, 4,  4),
    ("Divya Nair",      "divya",   "9876500100", "female", "2026", "Journalism",           "Block 11, Girls Hostel",     5.0, 9,  9),
    ("Rohit Malhotra",  "rohit",   "9876500111", "male",   "2027", "Computer Science",     "Block 38, Boys Hostel",      4.7, 2,  2),
    ("Ananya Iyer",     "ananya",  "9876500122", "female", "2026", "Architecture",         "Block 9, Girls Hostel",      4.9, 3,  3),
]

# Hubs (names must match config.HUBS exactly)
RAIL_JAL = "Jalandhar City Railway Station"
RAIL_LDH = "Ludhiana Railway Station"
BUS_PHG = "Phagwara Bus Stand"
BUS_JAL = "Jalandhar Bus Stand"
BUS_CHD = "Chandigarh ISBT-43"
BUS_DEL = "Delhi — Kashmere Gate ISBT"
AIR_ATQ = "Sri Guru Ram Das Jee Airport (Amritsar)"
AIR_IXC = "Chandigarh Airport (IXC)"
AIR_DEL = "Delhi Airport (IGI Terminal 3)"

# Campus pickup points
GATE = "Uni Mall / Main Gate"
LAW = "Law Gate"
B34 = "Block 34 Hostel Gate"
G11 = "Girls Hostel Gate (Block 11)"
GREEN = "Green Valley Gate"
DEEP = "Deep Complex"

RIDES = [
    # ═══ The 5 PM run to Jalandhar station — the demo scenario ═══
    dict(owner="priya", type=OFFER, frm=GATE, pickup="Main vehicle loading bay",
         to=RAIL_JAL, drop="Platform 1 entry, main porch", day=TODAY, at="17:00",
         flex=30, seats=3, fare=700, per_seat=150, vehicle="xl",
         vinfo="Innova Crysta — PB10 AB 1234", luggage="checked",
         notes="Heading home for the break. Boot fits two big suitcases easily, "
               "leaving sharp at 5 so we make the 6:40 Shatabdi."),
    dict(owner="aman", type=SEEK, frm=GATE, pickup="Main vehicle loading bay",
         to=RAIL_JAL, drop="Platform 1 entry", day=TODAY, at="17:15",
         flex=30, seats=1, luggage="carryon",
         notes="Catching the Shatabdi, happy to split an auto or cab."),
    dict(owner="simran", type=SEEK, frm=G11, pickup="Girls hostel pickup point",
         to=RAIL_JAL, drop="Main porch", day=TODAY, at="17:30",
         flex=30, seats=1, luggage="carryon", gender_only=True,
         notes="Would prefer co-riders from the girls hostel."),
    dict(owner="karan", type=SEEK, frm=B34, pickup="Boys hostel pickup point",
         to=RAIL_JAL, drop="Platform 1 entry", day=TODAY, at="16:50",
         flex=15, seats=2, luggage="backpack",
         notes="Two of us with light bags only."),
    dict(owner="neha", type=OFFER, frm=DEEP, pickup="Near the shopping complex",
         to=RAIL_JAL, drop="Main porch", day=TODAY, at="18:30",
         flex=15, seats=2, fare=700, per_seat=160, vehicle="sedan",
         vinfo="Swift Dzire — PB10 CX 7788", luggage="carryon"),

    # ═══ Airport runs ═══
    dict(owner="arjun", type=OFFER, frm=GATE, pickup="Main vehicle loading bay",
         to=AIR_DEL, drop="T3 departures kerbside", day=TOMORROW, at="04:30",
         flex=30, seats=3, fare=7000, per_seat=1750, vehicle="xl",
         vinfo="Innova — PB10 DE 4455", luggage="checked",
         notes="Early morning flight run to IGI. Leaving 4:30 sharp, tea stop at Murthal."),
    dict(owner="ishita", type=SEEK, frm=G11, pickup="Girls hostel pickup point",
         to=AIR_DEL, drop="Terminal 3, departures", day=TOMORROW, at="04:50",
         flex=60, seats=1, luggage="checked",
         notes="Flight at 10am, need to reach by 7."),
    dict(owner="ananya", type=SEEK, frm=GATE, pickup="Main vehicle loading bay",
         to=AIR_IXC, drop="Departures forecourt", day=TOMORROW, at="09:00",
         flex=30, seats=1, luggage="carryon"),

    # ═══ Chandigarh / weekend home runs ═══
    dict(owner="vikram", type=SEEK, frm=B34, pickup="Boys hostel pickup point",
         to=BUS_CHD, drop="Sector 43 interstate terminal", day=TOMORROW, at="07:00",
         flex=30, seats=1, luggage="carryon", notes="Going home for the weekend."),
    dict(owner="divya", type=SEEK, frm=G11, pickup="Girls hostel pickup point",
         to=BUS_CHD, drop="Sector 43 terminal", day=TOMORROW, at="07:20",
         flex=30, seats=2, luggage="carryon", notes="Two of us splitting a cab."),
    dict(owner="rohit", type=OFFER, frm=GREEN, pickup="Back gate, quieter pickup",
         to=BUS_CHD, drop="ISBT-43 drop point", day=TOMORROW, at="07:10",
         flex=15, seats=3, fare=2800, per_seat=700, vehicle="sedan",
         vinfo="Honda City — PB10 GH 9090", luggage="carryon"),

    # ═══ Short Phagwara / Jalandhar bus stand hops ═══
    dict(owner="rahul", type=SEEK, frm=LAW, pickup="Auto stand outside Law Gate",
         to=BUS_PHG, drop="Main terminal gate", day=TODAY, at="14:00",
         flex=30, seats=1, luggage="backpack"),
    dict(owner="neha", type=SEEK, frm=LAW, pickup="Auto stand outside Law Gate",
         to=BUS_PHG, drop="Main terminal gate", day=TODAY, at="14:15",
         flex=30, seats=1, luggage="backpack", notes="Anyone heading to Phagwara?"),
    dict(owner="karan", type=SEEK, frm=GATE, pickup="Main vehicle loading bay",
         to=RAIL_LDH, drop="Main entrance, Shatabdi side", day=TOMORROW, at="09:00",
         flex=60, seats=1, luggage="carryon"),
    dict(owner="rohit", type=SEEK, frm=B34, pickup="Boys hostel pickup point",
         to=RAIL_LDH, drop="Main entrance", day=TOMORROW, at="09:25",
         flex=30, seats=1, luggage="carryon", notes="Flexible by about 30 minutes."),
    dict(owner="arjun", type=SEEK, frm=GATE, pickup="Main vehicle loading bay",
         to=RAIL_JAL, drop="Platform 1 entry", day=TOMORROW, at="11:00",
         flex=60, seats=1, luggage="carryon"),

    # ═══ Past trips, so the dashboard History tab has content ═══
    dict(owner="priya", type=OFFER, frm=GATE, pickup="Main vehicle loading bay",
         to=AIR_ATQ, drop="Domestic departures, Terminal 1", day=LAST_WEEK, at="06:00",
         flex=30, seats=3, fare=2800, per_seat=700, vehicle="xl",
         vinfo="Innova Crysta — PB10 AB 1234", luggage="checked"),
]

# Existing groups so the demo shows rides already filling up.
# (index into RIDES, joiner key)
JOINS = [
    (5, "ishita"),    # Ishita took a seat in Arjun's Delhi airport run
    (9, "vikram"),    # Vikram + Divya grouped up for Chandigarh
    (16, "rahul"),    # last week's airport run (past trip)
    (16, "aman"),
]


def run():
    print("Rebuilding database...")
    Base.metadata.drop_all(bind=engine)
    init_db()

    db = SessionLocal()
    domain = config.ALLOWED_EMAIL_DOMAINS[0]

    users = {}
    for name, key, phone, gender, year, major, dorm, rating, hosted, reviews in STUDENTS:
        user = User(
            name=name,
            email=f"{key}@{domain}",
            password_hash=hash_password(PASSWORD),
            college=config.COLLEGE_NAME,
            phone=phone,
            gender=gender,
            class_year=year,
            major=major,
            dorm=dorm,
            rating=rating,
            rides_hosted=hosted,
            reviews_count=reviews,
            share_contact_on_match=True,
        )
        db.add(user)
        users[key] = user
    db.commit()
    print(f"  {len(users)} students created")

    created = []
    for spec in RIDES:
        to = spec["to"]
        fare_total = spec.get("fare") or config.DESTINATIONS.get(to, config.DEFAULT_FARE)
        seats = spec["seats"]

        if spec["type"] == OFFER:
            seats_available = seats
            fare_per_seat = spec.get("per_seat") or round(fare_total / (seats + 1))
        else:
            seats_available = max(0, config.MAX_GROUP_SIZE - seats)
            fare_per_seat = round(fare_total / max(1, seats))

        ride = Ride(
            user_id=users[spec["owner"]].id,
            ride_type=spec["type"],
            from_location=spec["frm"],
            pickup_detail=spec.get("pickup"),
            to_location=to,
            drop_detail=spec.get("drop"),
            hub_category=category_for(to),
            ride_date=spec["day"],
            depart_time=spec["at"],
            depart_minutes=to_minutes(spec["at"]),
            time_flex=spec.get("flex", 30),
            est_duration_min=duration_for(to),
            seats_total=seats,
            seats_available=seats_available,
            fare_total=fare_total,
            fare_per_seat=fare_per_seat,
            vehicle_type=spec.get("vehicle", "sedan"),
            vehicle_info=spec.get("vinfo"),
            luggage=spec.get("luggage", "carryon"),
            gender_only=spec.get("gender_only", False),
            notes=spec.get("notes"),
            status="open",
        )
        db.add(ride)
        created.append(ride)
    db.commit()

    for ride in created:
        ride.ride_code = f"RP-{8400 + ride.id}"
    db.commit()
    print(f"  {len(created)} rides created")

    for index, joiner in JOINS:
        ride = created[index]
        db.add(RideJoin(ride_id=ride.id, user_id=users[joiner].id))
        ride.seats_available = max(0, ride.seats_available - 1)
        if ride.seats_available == 0:
            ride.status = "full"
        db.flush()
        if ride.ride_type == SEEK:
            ride.fare_per_seat = round(ride.fare_total / max(1, ride.riders_count))
    db.commit()
    print(f"  {len(JOINS)} existing joins created")

    db.close()
    print(f"\nDone. Demo logins (password: {PASSWORD})")
    for name, key, *_ in STUDENTS[:5]:
        print(f"  {key}@{domain:<10} - {name}")


if __name__ == "__main__":
    run()
