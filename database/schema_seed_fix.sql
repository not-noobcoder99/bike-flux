-- Run this AFTER schema.sql if your parking_zones seed rows have empty
-- polygons (JSON_ARRAY() with no points) -- an empty polygon means
-- find_zone_for_point()/resolve-zone will never match, so geofencing
-- silently does nothing. This replaces them with real small square zones.

UPDATE parking_zones
SET geofence_geojson = JSON_OBJECT(
  'type', 'Polygon',
  'coordinates', JSON_ARRAY(JSON_ARRAY(
    JSON_ARRAY(72.9847, 33.6421),
    JSON_ARRAY(72.9867, 33.6421),
    JSON_ARRAY(72.9867, 33.6441),
    JSON_ARRAY(72.9847, 33.6441),
    JSON_ARRAY(72.9847, 33.6421)
  ))
)
WHERE name = 'SEECS Zone';

UPDATE parking_zones
SET geofence_geojson = JSON_OBJECT(
  'type', 'Polygon',
  'coordinates', JSON_ARRAY(JSON_ARRAY(
    JSON_ARRAY(72.9870, 33.6410),
    JSON_ARRAY(72.9890, 33.6410),
    JSON_ARRAY(72.9890, 33.6430),
    JSON_ARRAY(72.9870, 33.6430),
    JSON_ARRAY(72.9870, 33.6410)
  ))
)
WHERE name = 'Main Gate Zone';

-- A couple of sample scooties to test against those zones (adjust as needed)
INSERT INTO scooties (plate_number, model, current_zone_id, current_lat, current_lng, battery_level, status)
SELECT 'BF-001', 'Xiaomi M365', zone_id, 33.6431, 72.9857, 90, 'available'
FROM parking_zones WHERE name = 'SEECS Zone'
ON DUPLICATE KEY UPDATE plate_number = plate_number;

INSERT INTO scooties (plate_number, model, current_zone_id, current_lat, current_lng, battery_level, status)
SELECT 'BF-002', 'Xiaomi M365', zone_id, 33.6420, 72.9880, 75, 'available'
FROM parking_zones WHERE name = 'Main Gate Zone'
ON DUPLICATE KEY UPDATE plate_number = plate_number;

-- A dedicated IoT relay unit per scooty (required before /rides/unlock works cleanly)
INSERT INTO iot_units (scooty_id, device_serial, relay_status, firmware_version)
SELECT scooty_id, CONCAT('DEV-', scooty_id), 'locked', '1.0.0'
FROM scooties
WHERE scooty_id NOT IN (SELECT scooty_id FROM iot_units);
