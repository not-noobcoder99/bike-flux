
ALTER TABLE scooties ADD COLUMN qr_code VARCHAR(100) UNIQUE NULL AFTER scooty_id;
UPDATE scooties SET qr_code = CONCAT('QR-', plate_number) WHERE qr_code IS NULL;

ALTER TABLE iot_units
  ADD COLUMN last_gps_lat DECIMAL(10,7) NULL,
  ADD COLUMN last_gps_long DECIMAL(10,7) NULL,
  ADD COLUMN connectivity_status ENUM('online', 'offline') NOT NULL DEFAULT 'offline';

UPDATE iot_units iu
JOIN scooties s ON iu.scooty_id = s.scooty_id
SET iu.last_gps_lat = s.current_lat, iu.last_gps_long = s.current_lng, iu.connectivity_status = 'online';

ALTER TABLE condition_photos
  ADD COLUMN flagged_damage BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN flag_notes VARCHAR(255) NULL;

ALTER TABLE pricing_plans
  ADD COLUMN plan_type VARCHAR(30) NULL,
  ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE pricing_plans SET plan_type = IF(is_subscription, 'subscription', 'pay_per_use') WHERE plan_type IS NULL;

ALTER TABLE parking_zones ADD COLUMN campus_area VARCHAR(100) NULL;
UPDATE parking_zones SET campus_area = name WHERE campus_area IS NULL;

INSERT INTO pricing_plans (name, base_fare, per_minute_rate, per_km_rate, is_subscription, monthly_price, plan_type, active)
SELECT 'Monthly Unlimited', 0, 0, 0, TRUE, 1500.00, 'subscription', TRUE
WHERE NOT EXISTS (SELECT 1 FROM pricing_plans WHERE is_subscription = TRUE);
