"""
Geofencing helpers for Bike Flux.
Zones are stored as GeoJSON polygons in parking_zones.geofence_geojson.
"""
from shapely.geometry import Point, shape


def point_in_zone(lat, lng, geofence_geojson):
    """Return True if (lat, lng) falls inside the zone's polygon."""
    if not geofence_geojson or not geofence_geojson.get("coordinates"):
        return False
    polygon = shape(geofence_geojson)
    return polygon.contains(Point(lng, lat))


def find_zone_for_point(lat, lng, zones):
    """
    zones: list of dicts with keys 'zone_id', 'geofence_geojson'
    Returns the matching zone_id, or None if the point isn't inside any zone.
    """
    for zone in zones:
        if point_in_zone(lat, lng, zone.get("geofence_geojson")):
            return zone["zone_id"]
    return None
