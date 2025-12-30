export const CONFIG = {
  difficulty: {
    // Refined curve for viral frustration and engagement
    maxDistance: 800,
    speed: {
      baseSpeed: 50, // Base 50 units/sec
      incrementPerSecond: 0.4, // +2 units/sec every 5 seconds (0.4 per second)
      maxSpeed: 98, // Peak around 60-80 seconds
    }
  },
  car: {
    width: 0.85,
    length: 1.35,
    height: 0.55,
    baseSpeed: 50,
    maxSpeed: 98,

    steeringRate: 3.5, // Slightly faster for better control
    maxYaw: Math.PI * 0.38,
    autoCenterRate: 7.5,
  },
  road: {
    baseWidth: 5.2,
    minWidth: 2.6, // Narrower final width for difficulty spike

    wallThickness: 0.35,
    wallHeight: 1.25,

    segmentLength: 2,
    visibleSegments: 150, // Reduced for performance

    groundWidth: 70,
    groundColor: 0x0b0d17,
    roadColor: 0x19ffd1,
    wallColor: 0xffffff,
  },
  turns: {
    baseInterval: 44,
    minInterval: 12, // Turns become more frequent

    baseDeltaX: 4.2, // Smaller initial turns for smoother progression
    maxDeltaX: 8.5, // Smaller max turns for control

    maxOffset: 18,
  },
  city: {
    spawnChancePerSegment: 0.55,
    nearOffset: 6.8,
    farOffset: 18,

    minHeight: 2.5,
    maxHeight: 14,

    minFootprint: 1.6,
    maxFootprint: 4.6,
  },
  camera: {
    height: 4.2,
    distance: 6.8,
    lookAhead: 9,
    smoothness: 12, // Smoother camera for polish
    crashShakeSeconds: 0.2, // Exact 0.2s as specified
    crashShakeStrength: 0.4, // Punchier shake
  },
  crash: {
    freezeSeconds: 0.2, // Exact 0.2s slow-motion freeze
  },
  curve: {
    // Road width decreases over time (5% every 15 seconds)
    widthDecrease: 0.00333, // 0.33% per second = 5% per 15 seconds

    // Turn radius decreases over time (10% every 10 seconds)
    sharpnessIncrease: 0.01, // 1% per second = 10% per 10 seconds
  },
};

export const DEATH_MESSAGES = [
  'You turned too late.', // Si fue frontal (default)
  'Too greedy.', // Si duró mucho tiempo
  'You hesitated.', // Si chocó rápido
  'Almost.', // Si fue por pared
  'That was on you.', // Fallback
];
