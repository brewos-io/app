# Power Metering Guide

## Overview

BrewOS supports monitoring your espresso machine's power consumption through **MQTT smart plugs** (Shelly, Tasmota, generic). You configure the source via the webapp at Settings -> Machine -> Power Metering.

> **Note:** Hardware power meter modules (PZEM, JSY, Eastron connected via Pico UART) were removed in v2.32. Power monitoring is now MQTT-only.

---

## Supported MQTT Smart Plugs

These plugs monitor your machine's power and publish data over MQTT. BrewOS subscribes to their topics.

### Shelly Plug / Plug S

**Best for home automation enthusiasts**

**Configuration:**
1. Set up Shelly Plug with MQTT enabled
2. Note the status topic: `shellies/shelly-plug-XXXXXX/status`
3. In BrewOS: Settings -> Machine -> Power Metering
4. Select "MQTT Topic" -> Enter topic -> Format: "Shelly Plug"

**MQTT Topic Example:**
```
shellies/shelly-plug-ABC123/status
```

### Tasmota-Flashed Smart Plugs

Any smart plug running Tasmota firmware

**Configuration:**
1. Flash plug with Tasmota firmware
2. Enable MQTT in Tasmota console: `SetOption3 1`
3. Note the SENSOR topic: `tele/tasmota_XXXXXX/SENSOR`
4. In BrewOS: Enter topic -> Format: "Tasmota"

**MQTT Topic Example:**
```
tele/tasmota_ABC123/SENSOR
```

### Generic MQTT

For custom setups or other smart plug brands

**Requirements:**
- Must publish JSON payload
- Must include at least `power` field
- Optional: `voltage`, `current`, `energy`, `frequency`, `power_factor`

**Example topic:**
```
home/espresso_machine/power
```

**Example payload:**
```json
{
  "power": 1200,
  "voltage": 230,
  "current": 5.2
}
```

---

## Configuration Guide

### MQTT Smart Plug Setup

1. **Prerequisites**
   - MQTT broker running (e.g., Mosquitto)
   - Smart plug configured to publish to broker
   - BrewOS MQTT configured (Settings -> Network -> MQTT)

2. **Webapp Configuration**
   - Navigate to Settings -> Machine -> Power Metering
   - Click "Configure Power Metering"
   - Select "MQTT Topic (Smart Plug)"
   - Enter the plug's MQTT topic
   - Select format (Shelly, Tasmota, or auto-detect)
   - Click "Save Configuration"

3. **Verification**
   - Status should show "Connected" within 10 seconds
   - Readings should match those from the smart plug

---

## Troubleshooting

### MQTT Source Not Connecting

**Check MQTT:**
- Verify MQTT is enabled (Settings -> Network -> MQTT)
- Verify broker is reachable
- Check topic spelling (case-sensitive)
- Use MQTT Explorer to verify plug is publishing

**Check topic:**
- Shelly: `shellies/{device-id}/status`
- Tasmota: `tele/{device-id}/SENSOR`
- Verify JSON contains expected fields

### Connection Drops

- Check WiFi signal strength
- Verify broker is stable
- Check smart plug hasn't gone to sleep
- 10-second timeout triggers disconnection

---

## Data Published to MQTT

When MQTT is enabled, power meter data is published to:

**Topic:** `brewos/{device-id}/power`

**Payload:**
```json
{
  "voltage": 230.5,
  "current": 5.2,
  "power": 1198,
  "energy_import": 45.3,
  "energy_export": 0.0,
  "frequency": 50.0,
  "power_factor": 0.98
}
```

**Publish Interval:** 5 seconds
**Retained:** Yes
**QoS:** 0

---

## Home Assistant Integration

When Home Assistant auto-discovery is enabled, the following sensors are created:

| Sensor | Entity ID | Unit | Device Class |
|--------|-----------|------|--------------|
| Voltage | `sensor.brewos_voltage` | V | voltage |
| Current | `sensor.brewos_current` | A | current |
| Power | `sensor.brewos_power` | W | power |
| Energy Import | `sensor.brewos_energy_import` | kWh | energy |
| Energy Export | `sensor.brewos_energy_export` | kWh | energy |
| Frequency | `sensor.brewos_frequency` | Hz | frequency |
| Power Factor | `sensor.brewos_power_factor` | - | power_factor |

---

## Communication Architecture

```
MQTT Smart Plugs (Shelly, Tasmota)
    | WiFi -> MQTT Broker
ESP32-S3 (subscribes to topic)
    | WebSocket
Webapp
```

---

## See Also

- [MQTT Integration](../../firmware/docs/esp32/integrations/MQTT.md) - MQTT setup guide
