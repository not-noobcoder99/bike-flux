"""
Fare calculation logic. Kept in Python so pricing rules (surge, zone-based
discounts, promo codes) can evolve independently of the Node API and be
reused by data/analytics scripts.
"""


def calculate_fare(distance_km, duration_minutes, base_fare, per_minute_rate, per_km_rate, surge_multiplier=1.0):
    fare = base_fare + (duration_minutes * per_minute_rate) + (distance_km * per_km_rate)
    fare *= surge_multiplier
    return round(fare, 2)
