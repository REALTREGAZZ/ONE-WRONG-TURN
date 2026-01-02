# ONE WRONG TURN

A hyper-fast arcade reflex driving game built with Three.js, optimized for Poki distribution.

## Game Overview

ONE WRONG TURN is a minimalist 3D driving game where you navigate a constantly moving car through procedurally generated roads. One collision with the walls means instant death. How long can you survive?

## Features

- **Constant Speed Gameplay**: Car moves automatically at fixed speed
- **Simple Controls**: A/D or Arrow Keys to turn left/right
- **Touch Support**: Tap left/right sides of screen on mobile devices
- **Procedural Road Generation**: Hand-crafted segments that shuffle for fair, playable layouts
- **Persistent Stats**: Track your best run, total crashes, attempts, and coins
- **Low-poly 3D Aesthetic**: Clean, bold, saturated color palette with exaggerated lighting
- **Audio System**: Engine sound, crash effects, and UI feedback
- **Responsive Design**: Works on desktop, tablet, and mobile browsers

## Controls

- **A / Left Arrow**: Turn left
- **D / Right Arrow**: Turn right
- **Space / Click**: Start game from home screen
- **Any Key**: Restart after crash
- **Touch**: Tap left/right sides of screen (mobile)

## Game Mechanics

1. Car moves forward at constant speed (never accelerates or decelerates)
2. Navigate through winding roads by turning left or right
3. Collision with walls = instant death
4. Earn coins based on distance and survival time

## Development

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Opens the game at http://localhost:3000

### Build for Production

```bash
npm run build
```

Outputs optimized bundle to `dist/` directory, ready for deployment.

### Preview Production Build

```bash
npm run preview
```

## Technology Stack

- **Engine**: Three.js (3D rendering)
- **Build Tool**: Vite (fast bundling)
- **Language**: TypeScript (type safety)
- **Audio**: Web Audio API (procedural sounds)
- **Storage**: localStorage (persistent data)

## File Structure

```
src/
├── main.ts                 # Entry point
├── game/
│   ├── GameEngine.ts       # Main game loop and state management
│   ├── Car.ts              # Car mesh and physics
│   ├── Road.ts             # Procedural road generation
│   ├── Camera.ts           # Follow camera with shake effects
│   └── Collision.ts        # AABB collision detection
├── ui/
│   └── UIManager.ts        # Screen management and HUD updates
└── audio/
    └── AudioManager.ts     # Web Audio API sound effects
```

## Performance

- Target: 60 FPS on mid-range devices
- Optimized draw calls with low-poly assets
- Efficient collision detection
- Clean object disposal to prevent memory leaks
- Single HTML bundle for easy deployment

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Built for Poki distribution.
