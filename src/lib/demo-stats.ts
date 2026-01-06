/**
 * Demo statistics data generator
 * Creates realistic-looking statistics for demo mode
 */

import type {
  ExtendedStatsResponse,
  BrewRecord,
  PowerSample,
  DailySummary,
  Statistics,
} from "./types";

// Generate timestamps
const now = Math.floor(Date.now() / 1000);
const day = 86400;
const hour = 3600;

/**
 * Generate realistic demo brew history
 */
function generateBrewHistory(): BrewRecord[] {
  const brews: BrewRecord[] = [];

  // Generate brews over last 21 days (3 weeks) for comprehensive history
  const brewTimes = [
    6.5,
    7,
    7.5,
    8,
    8.5,
    9, // Morning rush
    12,
    12.5,
    13, // Lunch
    14,
    14.5,
    15,
    15.5,
    16, // Afternoon
    17,
    17.5,
    18,
    18.5,
    19, // Evening
  ];

  for (let daysAgo = 0; daysAgo < 21; daysAgo++) {
    const date = new Date((now - daysAgo * day) * 1000);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFriday = dayOfWeek === 5;

    // Determine number of brews based on day type
    let numBrews: number;
    if (daysAgo === 0) {
      // Today: 3-5 brews
      numBrews = 3 + Math.floor(Math.random() * 3);
    } else if (isWeekend) {
      // Weekends: 4-7 brews (more relaxed, more time)
      numBrews = 4 + Math.floor(Math.random() * 4);
    } else if (isFriday) {
      // Friday: 3-5 brews
      numBrews = 3 + Math.floor(Math.random() * 3);
    } else {
      // Weekdays: 2-5 brews
      numBrews = 2 + Math.floor(Math.random() * 4);
    }

    // Some days have no brews (5% chance, but not today)
    if (daysAgo > 0 && Math.random() < 0.05) {
      continue;
    }

    for (let i = 0; i < numBrews; i++) {
      // Select brew time with weighted probability (more likely during peak hours)
      let brewHour: number;
      const hourRand = Math.random();
      if (hourRand < 0.4) {
        // 40% chance: morning (6:30-9:00)
        brewHour = 6.5 + Math.random() * 2.5;
      } else if (hourRand < 0.6) {
        // 20% chance: afternoon (14:00-16:00)
        brewHour = 14 + Math.random() * 2;
      } else if (hourRand < 0.85) {
        // 25% chance: evening (17:00-19:00)
        brewHour = 17 + Math.random() * 2;
      } else {
        // 15% chance: other times
        brewHour = brewTimes[Math.floor(Math.random() * brewTimes.length)];
      }

      // Add some variance to brew times within the day
      const timestamp =
        now -
        daysAgo * day -
        (24 - brewHour) * hour +
        Math.floor(Math.random() * 3600); // ±1 hour variance

      // Realistic brew parameters with some variation
      const durationMs = 25000 + Math.floor(Math.random() * 10000); // 25-35 seconds
      const doseWeight = 17 + Math.random() * 4; // 17-21g dose
      const ratio = 1.8 + Math.random() * 0.7; // 1.8-2.5 ratio
      const yieldWeight = doseWeight * ratio;

      // Pressure varies slightly (8-10 bar typical)
      const peakPressure = 8.2 + Math.random() * 1.8;

      // Temperature varies (92-96°C typical)
      const avgTemperature = 92.5 + Math.random() * 3.5;

      // Flow rate (1.5-3 g/s typical)
      const avgFlowRate = 1.8 + Math.random() * 1.2;

      // Rating: 25% chance of being rated, mostly 4-5 stars
      let rating = 0;
      if (Math.random() < 0.25) {
        rating = Math.random() > 0.2 ? 4 + Math.floor(Math.random() * 2) : 3;
      }

      brews.push({
        timestamp,
        durationMs,
        yieldWeight: Math.round(yieldWeight * 10) / 10,
        doseWeight: Math.round(doseWeight * 10) / 10,
        peakPressure: Math.round(peakPressure * 10) / 10,
        avgTemperature: Math.round(avgTemperature * 10) / 10,
        avgFlowRate: Math.round(avgFlowRate * 10) / 10,
        rating,
        ratio: Math.round(ratio * 10) / 10,
      });
    }
  }

  // Sort by timestamp descending (most recent first)
  return brews.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Generate power consumption history (24 hours at 5-minute intervals)
 */
function generatePowerHistory(): PowerSample[] {
  const samples: PowerSample[] = [];
  const intervalSeconds = 300; // 5 minutes
  const numSamples = 288; // 24 hours worth

  // Define usage sessions (start hour, duration in hours, intensity)
  const usageSessions: Array<{
    startHour: number;
    duration: number;
    intensity: number;
  }> = [
    { startHour: 6.5, duration: 2.5, intensity: 0.8 }, // Morning: 6:30-9:00
    { startHour: 14.0, duration: 2.0, intensity: 0.5 }, // Afternoon: 14:00-16:00
    { startHour: 18.0, duration: 2.0, intensity: 0.6 }, // Evening: 18:00-20:00
  ];

  for (let i = numSamples - 1; i >= 0; i--) {
    const timestamp = now - i * intervalSeconds;
    const date = new Date(timestamp * 1000);
    const hourOfDay = date.getHours() + date.getMinutes() / 60;

    // Check if we're in an active session
    let inSession = false;
    let sessionIntensity = 0;
    let minutesIntoSession = 0;

    for (const session of usageSessions) {
      if (
        hourOfDay >= session.startHour &&
        hourOfDay < session.startHour + session.duration
      ) {
        inSession = true;
        sessionIntensity = session.intensity;
        minutesIntoSession = (hourOfDay - session.startHour) * 60;
        break;
      }
    }

    let avgWatts = 2; // Standby/off
    let maxWatts = 5;
    let kwhConsumed = 0.0001;

    if (inSession) {
      // Warmup phase: first 20 minutes of session
      if (minutesIntoSession < 20) {
        const warmupProgress = minutesIntoSession / 20;
        // High power during warmup, tapering off
        avgWatts = 1400 - warmupProgress * 400 + Math.random() * 300;
        maxWatts = 2000 - warmupProgress * 300 + Math.random() * 200;
        kwhConsumed = (avgWatts * 300) / 3600000;
      }
      // Active brewing phase
      else {
        const random = Math.random();
        if (random < sessionIntensity) {
          // Brewing activity
          if (random < sessionIntensity * 0.6) {
            // Active brewing - high power
            avgWatts = 1200 + Math.random() * 500;
            maxWatts = 1800 + Math.random() * 400;
            kwhConsumed = (avgWatts * 300) / 3600000;
          } else {
            // Idle but hot - maintaining temperature
            avgWatts = 250 + Math.random() * 200;
            maxWatts = 500 + Math.random() * 250;
            kwhConsumed = (avgWatts * 300) / 3600000;
          }
        } else {
          // Low activity - machine cooling down but still on
          avgWatts = 100 + Math.random() * 100;
          maxWatts = 250 + Math.random() * 150;
          kwhConsumed = (avgWatts * 300) / 3600000;
        }
      }
    }
    // Late night/early morning (22:00-05:00) - machine definitely off
    else if (hourOfDay >= 22 || hourOfDay < 5) {
      avgWatts = 1 + Math.random() * 2;
      maxWatts = 3 + Math.random() * 3;
      kwhConsumed = 0.00005;
    }
    // Other hours - very occasional activity
    else {
      const random = Math.random();
      if (random > 0.92) {
        // Rare activity
        avgWatts = 150 + Math.random() * 150;
        maxWatts = 300 + Math.random() * 200;
        kwhConsumed = (avgWatts * 300) / 3600000;
      }
    }

    samples.push({
      timestamp,
      avgWatts: Math.round(avgWatts),
      maxWatts: Math.round(maxWatts),
      kwhConsumed: Math.round(kwhConsumed * 10000) / 10000,
    });
  }

  return samples;
}

/**
 * Generate daily summaries for last 30 days
 */
function generateDailyHistory(): DailySummary[] {
  const summaries: DailySummary[] = [];

  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const date = now - daysAgo * day;
    const midnight = Math.floor(date / day) * day;

    // Weekend vs weekday patterns
    const dayOfWeek = new Date(midnight * 1000).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFriday = dayOfWeek === 5;

    // More realistic shot patterns
    let baseShots: number;
    if (isWeekend) {
      // Weekends: more relaxed, sometimes more shots
      baseShots = 4 + Math.floor(Math.random() * 3); // 4-6 shots
    } else if (isFriday) {
      // Friday: slightly more active
      baseShots = 3 + Math.floor(Math.random() * 2); // 3-4 shots
    } else {
      // Weekdays: consistent but varied
      baseShots = 2 + Math.floor(Math.random() * 3); // 2-4 shots
    }

    // Add some days with no usage (10% chance, but not today)
    const noUsage = daysAgo > 0 && Math.random() < 0.1;

    // Today gets more activity
    const shotCount = noUsage
      ? 0
      : baseShots + (daysAgo === 0 ? 2 : 0) + Math.floor(Math.random() * 2);

    // If no shots, minimal energy
    if (shotCount === 0) {
      summaries.push({
        date: midnight,
        shotCount: 0,
        totalBrewTimeMs: 0,
        totalKwh: 0.05 + Math.random() * 0.05, // Minimal standby
        onTimeMinutes: Math.floor(Math.random() * 20), // Brief accidental on
        steamCycles: 0,
        avgBrewTimeMs: 0,
      });
      continue;
    }

    const avgBrewTimeMs = 27000 + Math.floor(Math.random() * 6000); // 27-33 seconds
    const totalBrewTimeMs = shotCount * avgBrewTimeMs;

    // Energy calculation: more realistic
    // Base energy for warmup and idle time
    const baseKwh = 0.25 + Math.random() * 0.15; // 0.25-0.4 kWh base
    // Energy per shot (heating, brewing, steam)
    const perShotKwh = 0.06 + Math.random() * 0.04; // 0.06-0.1 kWh per shot
    // Additional variance for longer sessions
    const sessionBonus = shotCount > 4 ? (shotCount - 4) * 0.02 : 0;
    const totalKwh =
      baseKwh + shotCount * perShotKwh + sessionBonus + Math.random() * 0.15;

    // On time: warmup + brew time + idle between shots
    const warmupMinutes = 15 + Math.floor(Math.random() * 10); // 15-25 min warmup
    const brewTimeMinutes = Math.ceil(totalBrewTimeMs / 60000);
    const idleMinutes =
      shotCount > 1
        ? (shotCount - 1) * (10 + Math.floor(Math.random() * 10))
        : 0;
    const onTimeMinutes =
      warmupMinutes +
      brewTimeMinutes +
      idleMinutes +
      Math.floor(Math.random() * 20);

    // Steam cycles: more likely on weekends or with more shots
    const steamProbability = isWeekend ? 0.6 : 0.3;
    const steamCycles =
      Math.random() < steamProbability
        ? Math.floor(Math.random() * (shotCount > 3 ? 4 : 2)) + 1
        : Math.floor(Math.random() * 2);

    summaries.push({
      date: midnight,
      shotCount,
      totalBrewTimeMs,
      totalKwh: Math.round(totalKwh * 100) / 100,
      onTimeMinutes,
      steamCycles,
      avgBrewTimeMs,
    });
  }

  // Sort oldest first
  return summaries.reverse();
}

/**
 * Generate weekly chart data
 */
function generateWeeklyData(): { day: string; shots: number }[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date().getDay();

  return days.map((day, index) => {
    const dayIndex = (index + 1) % 7; // Monday = 0 in our array, but getDay() returns 0 for Sunday
    const isWeekend = dayIndex === 6 || dayIndex === 0;

    // Today gets actual value, other days get estimates
    if (dayIndex === today) {
      return { day, shots: 3 };
    }

    const baseShots = isWeekend ? 5 : 3;
    const variance = Math.floor(Math.random() * 3) - 1;
    return { day, shots: Math.max(1, baseShots + variance) };
  });
}

/**
 * Generate hourly distribution (when user typically brews)
 */
function generateHourlyDistribution(): { hour: number; count: number }[] {
  const distribution: { hour: number; count: number }[] = [];

  // Typical coffee drinking patterns
  const hourPatterns: Record<number, number> = {
    6: 3,
    7: 12,
    8: 15,
    9: 8,
    10: 4,
    11: 2,
    12: 3,
    13: 2,
    14: 5,
    15: 7,
    16: 4,
    17: 3,
    18: 4,
    19: 2,
    20: 1,
  };

  for (let hour = 0; hour < 24; hour++) {
    const baseCount = hourPatterns[hour] || 0;
    const variance = Math.floor(Math.random() * 3) - 1;
    distribution.push({
      hour,
      count: Math.max(0, baseCount + variance),
    });
  }

  return distribution;
}

/**
 * Generate complete demo statistics
 */
export function generateDemoStats(): Statistics {
  return {
    // New structured fields
    lifetime: {
      totalShots: 1247,
      totalSteamCycles: 234,
      totalKwh: 89.3,
      totalOnTimeMinutes: 15420,
      totalBrewTimeMs: 35539500,
      avgBrewTimeMs: 28500,
      minBrewTimeMs: 18000,
      maxBrewTimeMs: 42000,
      firstShotTimestamp: now - 180 * day, // Started 6 months ago
    },
    daily: {
      shotCount: 3,
      totalBrewTimeMs: 85500,
      avgBrewTimeMs: 28500,
      minBrewTimeMs: 26000,
      maxBrewTimeMs: 31000,
      totalKwh: 0.95,
    },
    weekly: {
      shotCount: 28,
      totalBrewTimeMs: 798000,
      avgBrewTimeMs: 28500,
      minBrewTimeMs: 22000,
      maxBrewTimeMs: 35000,
      totalKwh: 7.2,
    },
    monthly: {
      shotCount: 124,
      totalBrewTimeMs: 3534000,
      avgBrewTimeMs: 28500,
      minBrewTimeMs: 21000,
      maxBrewTimeMs: 38000,
      totalKwh: 28.5,
    },
    maintenance: {
      shotsSinceBackflush: 45,
      shotsSinceGroupClean: 12,
      shotsSinceDescale: 145,
      lastBackflushTimestamp: now - 7 * day,
      lastGroupCleanTimestamp: now - 2 * day,
      lastDescaleTimestamp: now - 30 * day,
    },
    sessionShots: 3,
    sessionStartTimestamp: now - 2700, // 45 min ago

    // Legacy compatibility fields
    totalShots: 1247,
    totalSteamCycles: 234,
    totalKwh: 89.3,
    totalOnTimeMinutes: 15420,
    shotsToday: 3,
    kwhToday: 0.95,
    onTimeToday: 45,
    shotsSinceDescale: 145,
    shotsSinceGroupClean: 12,
    shotsSinceBackflush: 45,
    lastDescaleTimestamp: now - 30 * day,
    lastGroupCleanTimestamp: now - 2 * day,
    lastBackflushTimestamp: now - 7 * day,
    avgBrewTimeMs: 28500,
    minBrewTimeMs: 22000,
    maxBrewTimeMs: 35000,
    dailyCount: 3,
    weeklyCount: 28,
    monthlyCount: 124,
  };
}

/**
 * Get complete extended stats response for demo mode
 */
export function getDemoExtendedStats(): ExtendedStatsResponse {
  return {
    stats: generateDemoStats(),
    weekly: generateWeeklyData(),
    hourlyDistribution: generateHourlyDistribution(),
    brewHistory: generateBrewHistory(),
    powerHistory: generatePowerHistory(),
    dailyHistory: generateDailyHistory(),
  };
}
