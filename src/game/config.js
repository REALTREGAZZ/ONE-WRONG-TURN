// Game Configuration
export const CONFIG = {
    // Game Settings
    GAME: {
        START_SPEED: 50, // units per second
        MAX_SPEED: 50, // constant speed
        ACCELERATION: 0, // no acceleration
        CAR_HEIGHT: 2.0, // Y position of car
        GROUND_Y: 2.0, // ground level constraint
        CAMERA_FOLLOW_DISTANCE: 10,
        CAMERA_FOLLOW_HEIGHT: 8,
        CAMERA_FOLLOW_SPEED: 0.1
    },
    
    // Synthwave Color Palette
    SYNTHWAVE: {
        SKY_TOP: 0x1a0033,
        SKY_BOTTOM: 0x0a0a0a,
        ROAD: 0x222222,
        ROAD_LINES: 0xffff00,
        WALLS_CYAN: 0x00ffff,
        WALLS_MAGENTA: 0xff0080,
        BUILDINGS: 0x333333,
        CAR_RED: 0xff0000,
        CAR_BLUE: 0x0066ff,
        CAR_GREEN: 0x00ff00,
        CAR_YELLOW: 0xffff00,
        CAR_MAGENTA: 0xff00ff,
        CAR_CYAN: 0x00ffff,
        FOG: 0x1a0033
    },
    
    // Shop Items
    SHOP_ITEMS: {
        red: {
            name: 'RED',
            color: '#ff0000',
            price: 0,
            default: true
        },
        blue: {
            name: 'BLUE',
            color: '#0066ff',
            price: 1000,
            default: false
        },
        green: {
            name: 'GREEN',
            color: '#00ff00',
            price: 1000,
            default: false
        },
        yellow: {
            name: 'YELLOW',
            color: '#ffff00',
            price: 1000,
            default: false
        },
        magenta: {
            name: 'MAGENTA',
            color: '#ff00ff',
            price: 1000,
            default: false
        },
        cyan: {
            name: 'CYAN',
            color: '#00ffff',
            price: 1000,
            default: false
        }
    },
    
    // World Generation
    WORLD: {
        SEGMENT_LENGTH: 100,
        INITIAL_SEGMENTS: 10,
        ROAD_WIDTH: 20,
        WALL_HEIGHT: 8,
        WALL_THICKNESS: 1,
        BUILDING_HEIGHT: 15,
        BUILDING_SPACING: 50,
        FOG_DISTANCE: 200,
        MAX_SEGMENTS: 50
    },
    
    // Game Mechanics
    GAMEPLAY: {
        CAMERA_SLOWMO_DURATION: 0.5,
        CAMERA_SLOWMO_SCALE: 0.5,
        CRASH_DELAY: 300,
        COINS_PER_UNIT: 1,
        MAX_DISTANCE: 999999
    },
    
    // Audio Settings
    AUDIO: {
        MASTER_VOLUME: 0.5,
        MUSIC_VOLUME: 0.3,
        SFX_VOLUME: 0.7
    }
};