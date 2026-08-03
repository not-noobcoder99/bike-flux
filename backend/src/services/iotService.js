// Talks to the IoT relay/kill-switch hardware for a given scooty.
// In production this would call the device's cloud gateway (MQTT/HTTP).
// This starter implementation simulates the call and updates iot_units.relay_status.

const IotUnit = require('../models/IotUnit');

async function unlockScooty(scooty_id) {
  // TODO: replace with real call to IoT gateway, e.g.:
  // await mqttClient.publish(`bikeflux/${scooty_id}/relay`, 'unlock');
  await IotUnit.setRelayStatus(scooty_id, 'unlocked');
  return { scooty_id, relay_status: 'unlocked' };
}

async function lockScooty(scooty_id) {
  await IotUnit.setRelayStatus(scooty_id, 'locked');
  return { scooty_id, relay_status: 'locked' };
}

module.exports = { unlockScooty, lockScooty };
