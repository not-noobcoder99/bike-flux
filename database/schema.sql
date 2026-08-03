-- =========================================================
-- Bike Flux — MySQL Schema
-- Company-owned scooty rental system for NUST campus
-- =========================================================

CREATE DATABASE IF NOT EXISTS bike_flux;
USE bike_flux;

-- ---------------------------------------------------------
-- USERS
-- ---------------------------------------------------------
CREATE TABLE users (
    user_id         INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(120)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    phone           VARCHAR(20),
    student_id      VARCHAR(30),
    role            ENUM('rider', 'admin', 'maintenance') DEFAULT 'rider',
    status          ENUM('active', 'suspended', 'pending') DEFAULT 'pending',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- VIRTUAL_CARDS
-- ---------------------------------------------------------
CREATE TABLE virtual_cards (
    card_id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    card_number     VARCHAR(30) NOT NULL UNIQUE,
    provider_ref    VARCHAR(100),          -- reference id from card issuing provider
    balance         DECIMAL(10,2) DEFAULT 0.00,
    status          ENUM('active', 'blocked', 'expired') DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- PARKING_ZONES (geofenced areas)
-- ---------------------------------------------------------
CREATE TABLE parking_zones (
    zone_id         INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(255),
    geofence_geojson JSON NOT NULL,        -- polygon boundary of the zone
    capacity        INT DEFAULT 20,
    center_lat      DECIMAL(10,7),
    center_lng      DECIMAL(10,7),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- SCOOTIES
-- ---------------------------------------------------------
CREATE TABLE scooties (
    scooty_id       INT AUTO_INCREMENT PRIMARY KEY,
    plate_number    VARCHAR(30) NOT NULL UNIQUE,
    model           VARCHAR(60),
    current_zone_id INT,
    current_lat     DECIMAL(10,7),
    current_lng     DECIMAL(10,7),
    battery_level   TINYINT DEFAULT 100,
    status          ENUM('available', 'in_use', 'maintenance', 'offline') DEFAULT 'available',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_zone_id) REFERENCES parking_zones(zone_id) ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- IOT_UNITS (relay / kill-switch hardware per scooty)
-- ---------------------------------------------------------
CREATE TABLE iot_units (
    iot_unit_id     INT AUTO_INCREMENT PRIMARY KEY,
    scooty_id       INT NOT NULL UNIQUE,
    device_serial   VARCHAR(60) NOT NULL UNIQUE,
    relay_status    ENUM('locked', 'unlocked') DEFAULT 'locked',
    firmware_version VARCHAR(20),
    last_ping_at    TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scooty_id) REFERENCES scooties(scooty_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- PRICING_PLANS
-- ---------------------------------------------------------
CREATE TABLE pricing_plans (
    plan_id         INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(80) NOT NULL,
    base_fare       DECIMAL(8,2) NOT NULL DEFAULT 0,
    per_minute_rate DECIMAL(8,2) NOT NULL DEFAULT 0,
    per_km_rate     DECIMAL(8,2) NOT NULL DEFAULT 0,
    is_subscription BOOLEAN DEFAULT FALSE,
    monthly_price   DECIMAL(8,2),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- SUBSCRIPTIONS
-- ---------------------------------------------------------
CREATE TABLE subscriptions (
    subscription_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    plan_id         INT NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES pricing_plans(plan_id)
);

-- ---------------------------------------------------------
-- RIDES
-- ---------------------------------------------------------
CREATE TABLE rides (
    ride_id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    scooty_id       INT NOT NULL,
    plan_id         INT,
    start_zone_id   INT,
    end_zone_id     INT,
    start_time      TIMESTAMP NULL,
    end_time        TIMESTAMP NULL,
    start_lat       DECIMAL(10,7),
    start_lng       DECIMAL(10,7),
    end_lat         DECIMAL(10,7),
    end_lng         DECIMAL(10,7),
    distance_km     DECIMAL(8,3) DEFAULT 0,
    duration_minutes INT DEFAULT 0,
    fare_amount     DECIMAL(8,2) DEFAULT 0,
    status          ENUM('unlocking', 'active', 'completed', 'cancelled') DEFAULT 'unlocking',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (scooty_id) REFERENCES scooties(scooty_id),
    FOREIGN KEY (plan_id) REFERENCES pricing_plans(plan_id),
    FOREIGN KEY (start_zone_id) REFERENCES parking_zones(zone_id),
    FOREIGN KEY (end_zone_id) REFERENCES parking_zones(zone_id)
);

-- ---------------------------------------------------------
-- CONDITION_PHOTOS (pre-ride condition confirmation)
-- ---------------------------------------------------------
CREATE TABLE condition_photos (
    photo_id        INT AUTO_INCREMENT PRIMARY KEY,
    ride_id         INT NOT NULL,
    photo_url       VARCHAR(255) NOT NULL,
    photo_type      ENUM('start', 'end') DEFAULT 'start',
    taken_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(ride_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------
-- TRANSACTIONS
-- ---------------------------------------------------------
CREATE TABLE transactions (
    transaction_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    card_id         INT,
    ride_id         INT,
    amount          DECIMAL(10,2) NOT NULL,
    type            ENUM('ride_charge', 'topup', 'subscription', 'refund') NOT NULL,
    status          ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    provider_ref    VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (card_id) REFERENCES virtual_cards(card_id),
    FOREIGN KEY (ride_id) REFERENCES rides(ride_id)
);

-- ---------------------------------------------------------
-- MAINTENANCE_LOGS
-- ---------------------------------------------------------
CREATE TABLE maintenance_logs (
    log_id          INT AUTO_INCREMENT PRIMARY KEY,
    scooty_id       INT NOT NULL,
    reported_by     INT,
    issue_description TEXT NOT NULL,
    status          ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at     TIMESTAMP NULL,
    FOREIGN KEY (scooty_id) REFERENCES scooties(scooty_id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ---------------------------------------------------------
-- Seed: default pricing plan + a couple of parking zones
-- ---------------------------------------------------------
INSERT INTO pricing_plans (name, base_fare, per_minute_rate, per_km_rate, is_subscription)
VALUES ('Pay As You Go', 10.00, 2.00, 15.00, FALSE);

INSERT INTO parking_zones (name, description, geofence_geojson, capacity, center_lat, center_lng)
VALUES
('SEECS Zone', 'Parking near SEECS building', JSON_OBJECT('type','Polygon','coordinates', JSON_ARRAY()), 15, 33.6431, 72.9857),
('Main Gate Zone', 'Parking near NUST main gate', JSON_OBJECT('type','Polygon','coordinates', JSON_ARRAY()), 20, 33.6420, 72.9880);
