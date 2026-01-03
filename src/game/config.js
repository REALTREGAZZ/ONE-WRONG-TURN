export const CONFIG = {
  // Synthwave/Cyberpunk color palette
  synthwave: {
    // Colores del coche
    car: {
      color: 0xffff00, // Amarillo neón
      emissive: 0xffff00,
      emissiveIntensity: 0.6,
    },
    // Colores de muros
    walls: {
      left: {
        color: 0x00ffff, // Cyan
        emissive: 0x00ffff,
        emissiveIntensity: 0.8,
      },
      right: {
        color: 0xff00ff, // Magenta
        emissive: 0xff00ff,
        emissiveIntensity: 0.8,
      },
    },
    // Carretera y grid
    road: {
      color: 0x1a1a3e, // Azul oscuro
      gridColor: 0xffff00, // Amarillo neón
    },
    // Edificios/obstacles
    buildings: {
      color1: 0xff6b35, // Naranja
      color2: 0xff1493, // Magenta fuerte
      emissiveIntensity: 0.5,
    },
    // Cielo
    sky: {
      topColor: 0x2a0845, // Púrpura
      middleColor: 0xff6b35, // Naranja
      bottomColor: 0x0a0a0f, // Negro
    },
    // Fog
    fog: 0x1a1a2e, // Deep purple-blue
    // Luces
    lights: {
      ambient: { intensity: 0.8 },
      pointLights: {
        cyan: {
          color: 0x00ffff,
          intensity: 0.6,
          distance: 50,
        },
        magenta: {
          color: 0xff00ff,
          intensity: 0.6,
          distance: 50,
        },
      },
    },
  },
  // Game mode configurations
  gameModes: {
    normal: {
      name: 'NORMAL MODE',
      description: 'Constant speed, fixed road width. Pure skill test.',
      unlocked: true,
      difficulty: {
        maxDistance: 800,
        speed: {
          baseSpeed: 25,
          incrementPerSecond: 0,
          maxSpeed: 25,
        },
      },
      curve: {
        widthDecrease: 0, // NO narrowing in normal mode
        sharpnessIncrease: 0, // NO turn sharpness increase
      },
      road: {
        baseWidth: 5.2,
        minWidth: 5.2, // Fixed width
      },
      turns: {
        baseInterval: 44,
        minInterval: 44, // Consistent turn frequency
        baseDeltaX: 4.2,
        maxDeltaX: 8.5, // Moderate turns
      },
    },
    hard: {
      name: 'HARD MODE',
      description: 'Speed ramps, narrowing road, sharper turns. Pure chaos.',
      unlocked: false,
      difficulty: {
        maxDistance: 800,
        speed: {
          baseSpeed: 25,
          incrementPerSecond: 0.25, // Gradual speed increase
          maxSpeed: 45, // Higher max speed
        },
      },
      curve: {
        widthDecrease: 0.00333, // 5% per 15 seconds
        sharpnessIncrease: 0.01, // 10% per 10 seconds
      },
      road: {
        baseWidth: 5.2,
        minWidth: 4.0, // Narrows over time
      },
      turns: {
        baseInterval: 44,
        minInterval: 8, // Much more frequent turns
        baseDeltaX: 3.0, // Sharper initial turns
        maxDeltaX: 12, // Much sharper max turns
      },
    },
  },
  difficulty: {
    // Default difficulty (will be overridden by game mode)
    maxDistance: 800,
    speed: {
      baseSpeed: 25,
      incrementPerSecond: 0,
      maxSpeed: 25,
    }
  },
  car: {
    width: 2.0,
    length: 1.2,
    height: 0.8,
    baseSpeed: 25,
    maxSpeed: 25,

    steeringRate: 3.0, // Moderate steering increase (from 2.0 to 3.0)
    maxYaw: Math.PI * 0.25, // Bounded maximum turn
    autoCenterRate: 7.5,
    tiltAngle: 18, // Max tilt in degrees
  },
  wheelTrails: {
    enabled: true,
    lifespan: 0.25,
    width: 0.1,
    leftColor: 0x00ffff,
    rightColor: 0xff00ff,
    maxDensity: 20,
  },
  road: {
    baseWidth: 5.2,
    minWidth: 4.0,  // Minimum width where narrowing stops (leaves 1.0 margin per side for car width 2.0)

    wallThickness: 0.35,
    wallHeight: 1.25,

    segmentLength: 2,
    visibleSegments: 150, // Reduced for performance

    groundWidth: 70,
    groundColor: 0x0a0a0f,
    roadColor: 0x1a1a3e,
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
    smoothness: 8, // Adjusted for better "lag" and "escape" feel
    crashShakeSeconds: 0.2, // Exact 0.2s as specified
    crashShakeStrength: 0.4, // Punchier shake
    shakeFrequency: 10,
    shakeAmplitude: 0.04,
    fov: {
      base: 62,
      max: 77,
      lerpFactor: 0.1,
    },
  },
  speedLines: {
    enabled: true,
    particlesPerSecondAtMaxSpeed: 80,
    particleSize: { width: 0.08, length: 3 },
    lifespan: 0.4,
    color: 0xff00ff,  // Magenta speed lines
  },
  sparks: {
    enabled: true,
    particlesPerGraze: 10,
    lifespan: 0.2,
    size: 0.08,
    color: 0xffff00,  // Yellow neon sparks
    grazeThreshold: 0.22, // How close to wall before emitting sparks
    speed: 8, // Particle explosion speed
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
  SHOP_ITEMS: {}, // Se llenará desde main.js
};

export const DEATH_MESSAGES = [
  'TOO GREEDY',
  'OVERCONFIDENT',
  'OUCH!',
  'CRASHED!',
  'GAME OVER',
  'YOU SUCK',
  'UNLUCKY',
  'BETTER LUCK NEXT TIME',
];
