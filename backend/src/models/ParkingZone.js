const db = require('../config/db');

const ParkingZone = {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM parking_zones');
    return rows;
  },
  async findById(zone_id) {
    const [rows] = await db.query('SELECT * FROM parking_zones WHERE zone_id = ?', [zone_id]);
    return rows[0];
  },

  async create({ name, description, geofence_geojson, capacity, center_lat, center_lng }) {
    const [result] = await db.query(
      `INSERT INTO parking_zones (name, description, geofence_geojson, capacity, center_lat, center_lng)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description || null, JSON.stringify(geofence_geojson), capacity || 20, center_lat, center_lng]
    );
    return result.insertId;
  },

  async update(zone_id, { name, description, geofence_geojson, capacity, center_lat, center_lng }) {
    await db.query(
      `UPDATE parking_zones
       SET name = ?, description = ?, geofence_geojson = ?, capacity = ?, center_lat = ?, center_lng = ?
       WHERE zone_id = ?`,
      [name, description || null, JSON.stringify(geofence_geojson), capacity, center_lat, center_lng, zone_id]
    );
  },

  async delete(zone_id) {
    await db.query('DELETE FROM parking_zones WHERE zone_id = ?', [zone_id]);
  },
};

module.exports = ParkingZone;
