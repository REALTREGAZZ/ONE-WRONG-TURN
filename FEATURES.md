# ONE WRONG TURN - Feature Implementation Checklist

## ✅ Core Game Mechanics

- [x] **Constant Speed**: Car moves at fixed 50 units/second (never changes)
- [x] **Simple Controls**: A/D or Arrow Keys for left/right turning
- [x] **Touch Support**: Tap left/right sides of screen on mobile
- [x] **Instant Death**: Collision with walls = immediate game over
- [x] **Fair Collision**: AABB-based precise collision detection
- [x] **Procedural Roads**: Hand-crafted segments (13 variations) that shuffle

## ✅ Crash Mechanics

- [x] **Slow Motion Effect**: 0.3s at 30% speed during crash
- [x] **Screen Freeze**: 0.5s freeze after slow motion
- [x] **Camera Shake**: Violent shake on impact (intensity 10)
- [x] **Impact Sound**: Punchy 200ms crash sound
- [x] **Randomized Messages**: 6 different death messages
- [x] **Instant Restart**: 300ms delay, press any key to restart

## ✅ Stats & Progression

- [x] **Best Run Time**: Tracks and displays best survival time
- [x] **Total Crashes**: Lifetime crash counter
- [x] **Total Attempts**: Lifetime attempt counter
- [x] **Total Coins**: Persistent coin accumulation
- [x] **Coin Earning Formula**: distance/10 + time_in_seconds
- [x] **localStorage Persistence**: All stats saved locally

## ✅ Shop System

- [x] **8 Car Skins**: default, red, blue, yellow, green, cyan, orange, purple
- [x] **1000 Coins Each**: Fixed price for all skins
- [x] **Purely Cosmetic**: No gameplay advantages
- [x] **Persistence**: Selected skin persists across sessions
- [x] **Visual Preview**: Color preview for each skin
- [x] **Purchase System**: Buy with earned coins

## ✅ UI Screens

- [x] **Home Screen**: Title, start prompt, best time preview, navigation buttons
- [x] **Death Screen**: Random message, time survived, coins earned, restart prompt
- [x] **Stats Screen**: Best run, crashes, attempts, total coins
- [x] **Shop Screen**: Coin balance, skin grid, buy/select buttons
- [x] **Settings Screen**: Audio on/off toggle
- [x] **Game HUD**: Time and coins display during gameplay

## ✅ Audio System

- [x] **Engine Loop**: Continuous oscillator-based engine sound
- [x] **Crash Sound**: 200ms impact sound
- [x] **UI Click Sound**: Button feedback (50ms sine wave)
- [x] **Master Toggle**: Enable/disable all audio in settings
- [x] **Web Audio API**: Procedural sound generation

## ✅ Visual Style

- [x] **Low-Poly 3D**: Simple box geometries for car
- [x] **Bold Colors**: Saturated skin colors (magenta, cyan, etc.)
- [x] **Synthwave Aesthetic**: Neon glow effects, dark backgrounds
- [x] **Dynamic Lighting**: Directional, ambient, and point lights
- [x] **Shadows**: Real-time shadow mapping
- [x] **Follow Camera**: Smooth lerp follow from behind/above
- [x] **Road Design**: Dark asphalt with yellow center line
- [x] **Neon Walls**: Magenta glowing walls with emissive material

## ✅ Performance & Optimization

- [x] **60 FPS Target**: requestAnimationFrame loop
- [x] **Low-Poly Assets**: Minimal triangle count
- [x] **Efficient Collision**: AABB with early exit
- [x] **Object Disposal**: Proper cleanup to prevent memory leaks
- [x] **Spatial Culling**: Remove far-away road segments
- [x] **Single HTML Output**: Vite bundles everything (~475 KB)
- [x] **Gzip Size**: ~121 KB compressed

## ✅ Responsive Design

- [x] **Mobile-Friendly**: Touch controls for mobile devices
- [x] **Responsive UI**: Scales to all screen sizes
- [x] **Media Queries**: Mobile-optimized text sizes
- [x] **Full-Screen Support**: Works in any container size
- [x] **Browser Compatibility**: Chrome, Firefox, Safari, Edge

## ✅ Game Rules Compliance

- [x] **English Only**: All text in English
- [x] **Constant Speed**: Never accelerates or decelerates
- [x] **No Narrowing**: Road width stays constant (8 units)
- [x] **Layout Difficulty**: Challenge from turns, not width
- [x] **One Collision = Death**: No health system
- [x] **20-60 Second Runs**: Difficulty tuned for this range

## ✅ Technical Requirements

- [x] **Three.js**: 3D rendering engine
- [x] **TypeScript**: Type-safe development
- [x] **Vite**: Fast build and dev server
- [x] **No External Assets**: Self-contained bundle
- [x] **Poki-Ready**: Single HTML deployment
- [x] **WebGL Support**: Requires WebGL-capable browser

## Game Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Car Speed | 50 units/s | Constant forward speed |
| Turn Speed | 2.5 rad/s | Maximum turning rate |
| Road Width | 8 units | Constant throughout |
| Wall Height | 2 units | Barrier height |
| Camera Offset | (0, 8, 12) | Behind/above car |
| Skin Price | 1000 coins | All skins cost the same |
| Crash Slow-Mo | 0.3s at 30% | Dramatic crash effect |
| Freeze Duration | 0.5s | After crash |
| Restart Delay | 300ms | Before restart allowed |

## Road Segments

13 pre-defined segments with varying angles and lengths:
- Straight segments: 0° (30m, 35m, 40m)
- Gentle turns: ±0.3-0.4 rad (22-25m)
- Medium turns: ±0.5-0.6 rad (20-22m)
- Sharp turns: ±0.7 rad (18m)

Segments shuffle on each playthrough for variety while maintaining fairness.

## Success Criteria Met

✅ Game runs on load with home screen  
✅ Controls are responsive with 0-latency feel  
✅ Crashes are brutal, fair, and satisfying  
✅ Instant restart (300ms max delay)  
✅ Stats persist across sessions  
✅ Shop works, coins earned, skins apply  
✅ 60 FPS stable performance target  
✅ Single HTML file ready for Poki  
✅ Runs on modern browsers  
✅ No external dependencies at runtime  
