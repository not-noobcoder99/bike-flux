"""
Standalone script to simulate IoT unit heartbeats / GPS pings for local dev,
since real hardware isn't available yet. Periodically updates a scooty's
lat/lng in the database to mimic a moving vehicle (or a still one, for
scooties parked and idle).

Usage:
    python iot_simulator.py --scooty-id 1 --lat 33.6431 --lng 72.9857
"""
import argparse
import time
import random
import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "bike_flux"),
    )


def simulate(scooty_id, lat, lng, interval_seconds=5):
    conn = get_connection()
    cursor = conn.cursor()
    print(f"Simulating IoT pings for scooty {scooty_id}. Ctrl+C to stop.")
    try:
        while True:
            # Small random jitter to mimic GPS drift / short movement
            jitter_lat = lat + random.uniform(-0.0003, 0.0003)
            jitter_lng = lng + random.uniform(-0.0003, 0.0003)
            cursor.execute(
                "UPDATE scooties SET current_lat = %s, current_lng = %s WHERE scooty_id = %s",
                (jitter_lat, jitter_lng, scooty_id),
            )
            conn.commit()
            print(f"scooty {scooty_id} -> ({jitter_lat:.6f}, {jitter_lng:.6f})")
            time.sleep(interval_seconds)
    except KeyboardInterrupt:
        print("Stopped.")
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--scooty-id", type=int, required=True)
    parser.add_argument("--lat", type=float, required=True)
    parser.add_argument("--lng", type=float, required=True)
    parser.add_argument("--interval", type=int, default=5)
    args = parser.parse_args()
    simulate(args.scooty_id, args.lat, args.lng, args.interval)
