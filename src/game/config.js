export const CONFIG = {
  difficulty: {
    // 0..1 mapping based on distance. Calibrated so most runs die in <30s.
    maxDistance: 650,
  },
  car: {
    width: 0.85,
    length: 1.35,
    height: 0.55,

    baseSpeed: 18,
    maxSpeed: 52,

    steeringRate: 3.1,
    maxYaw: Math.PI * 0.38,
    autoCenterRate: 7.5,
  },
  road: {
    baseWidth: 4.8,
    minWidth: 2.3,

    wallThickness: 0.35,
    wallHeight: 1.25,

    segmentLength: 2,
    visibleSegments: 170,

    groundWidth: 70,
    groundColor: 0x0b0d17,
    roadColor: 0x19ffd1,
    wallColor: 0xffffff,
  },
  turns: {
    baseInterval: 44,
    minInterval: 14,

    baseDeltaX: 4.5,
    maxDeltaX: 11,

    maxOffset: 16,
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
    smoothness: 10,
    crashShakeSeconds: 0.25,
    crashShakeStrength: 0.35,
  },
  crash: {
    freezeSeconds: 0.2,
  },
};

export const DEATH_MESSAGES = [
  'You turned too late.',
  'Too greedy.',
  'You hesitated.',
  'Almost.',
  'That was on you.',
];
