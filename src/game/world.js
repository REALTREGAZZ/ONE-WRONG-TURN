import { CONFIG } from './config.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.roadSegments = [];
        this.wallSegments = [];
        this.buildingSegments = [];
        this.currentZPosition = 0;
        this.maxSegments = CONFIG.WORLD.MAX_SEGMENTS;
        
        this.createSky();
        this.createInitialWorld();
    }
    
    createSky() {
        // Create gradient sky
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        
        // Create vertical gradient texture
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        const gradient = context.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, `#${CONFIG.SYNTHWAVE.SKY_TOP.toString(16).padStart(6, '0')}`);
        gradient.addColorStop(1, `#${CONFIG.SYNTHWAVE.SKY_BOTTOM.toString(16).padStart(6, '0')}`);
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 1, 256);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        const skyMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide
        });
        
        this.sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.sky);
        
        // Add fog for atmosphere
        this.scene.fog = new THREE.Fog(
            CONFIG.SYNTHWAVE.FOG,
            50,
            CONFIG.WORLD.FOG_DISTANCE
        );
    }
    
    createInitialWorld() {
        // Create initial road segments
        for (let i = 0; i < CONFIG.WORLD.INITIAL_SEGMENTS; i++) {
            this.createRoadSegment(this.currentZPosition - i * CONFIG.WORLD.SEGMENT_LENGTH);
        }
        
        // Create walls for initial segments
        for (let i = 0; i < CONFIG.WORLD.INITIAL_SEGMENTS; i++) {
            this.createWallSegment(this.currentZPosition - i * CONFIG.WORLD.SEGMENT_LENGTH);
        }
        
        // Create buildings for initial segments
        for (let i = 0; i < CONFIG.WORLD.INITIAL_SEGMENTS; i++) {
            this.createBuildingSegment(this.currentZPosition - i * CONFIG.WORLD.SEGMENT_LENGTH);
        }
        
        this.currentZPosition = -CONFIG.WORLD.INITIAL_SEGMENTS * CONFIG.WORLD.SEGMENT_LENGTH;
    }
    
    createRoadSegment(zPosition) {
        // Main road
        const roadGeometry = new THREE.PlaneGeometry(
            CONFIG.WORLD.ROAD_WIDTH,
            CONFIG.WORLD.SEGMENT_LENGTH
        );
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.SYNTHWAVE.ROAD,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.set(0, 0, zPosition);
        
        // Road grid lines
        const gridLines = this.createGridLines(zPosition);
        
        // Lane divider
        const dividerGeometry = new THREE.PlaneGeometry(0.2, CONFIG.WORLD.SEGMENT_LENGTH);
        const dividerMaterial = new THREE.MeshBasicMaterial({
            color: CONFIG.SYNTHWAVE.ROAD_LINES,
            transparent: true,
            opacity: 0.8
        });
        
        const divider = new THREE.Mesh(dividerGeometry, dividerMaterial);
        divider.rotation.x = -Math.PI / 2;
        divider.position.set(0, 0.01, zPosition);
        
        this.scene.add(road);
        this.scene.add(divider);
        
        if (gridLines) {
            this.scene.add(gridLines);
        }
        
        this.roadSegments.push({
            mesh: road,
            divider: divider,
            gridLines: gridLines,
            z: zPosition
        });
    }
    
    createGridLines(zPosition) {
        const gridGroup = new THREE.Group();
        const lineCount = 10;
        const lineSpacing = CONFIG.WORLD.ROAD_WIDTH / lineCount;
        
        for (let i = 0; i <= lineCount; i++) {
            const x = -CONFIG.WORLD.ROAD_WIDTH / 2 + i * lineSpacing;
            
            const lineGeometry = new THREE.PlaneGeometry(0.1, CONFIG.WORLD.SEGMENT_LENGTH);
            const lineMaterial = new THREE.MeshBasicMaterial({
                color: CONFIG.SYNTHWAVE.ROAD_LINES,
                transparent: true,
                opacity: 0.4
            });
            
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.02, zPosition);
            
            gridGroup.add(line);
        }
        
        return gridGroup;
    }
    
    createWallSegment(zPosition) {
        const wallHeight = CONFIG.WORLD.WALL_HEIGHT;
        const wallThickness = CONFIG.WORLD.WALL_THICKNESS;
        const roadWidth = CONFIG.WORLD.ROAD_WIDTH;
        
        // Left wall (cyan)
        const leftWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, CONFIG.WORLD.SEGMENT_LENGTH);
        const leftWallMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.SYNTHWAVE.WALLS_CYAN,
            emissive: CONFIG.SYNTHWAVE.WALLS_CYAN,
            emissiveIntensity: 0.2,
            roughness: 0.3,
            metalness: 0.7
        });
        
        const leftWall = new THREE.Mesh(leftWallGeometry, leftWallMaterial);
        leftWall.position.set(-roadWidth / 2 - wallThickness / 2, wallHeight / 2, zPosition);
        
        // Right wall (magenta)
        const rightWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, CONFIG.WORLD.SEGMENT_LENGTH);
        const rightWallMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.SYNTHWAVE.WALLS_MAGENTA,
            emissive: CONFIG.SYNTHWAVE.WALLS_MAGENTA,
            emissiveIntensity: 0.2,
            roughness: 0.3,
            metalness: 0.7
        });
        
        const rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
        rightWall.position.set(roadWidth / 2 + wallThickness / 2, wallHeight / 2, zPosition);
        
        // Add neon strip effect on walls
        this.addNeonStrips(leftWall, 'cyan');
        this.addNeonStrips(rightWall, 'magenta');
        
        this.scene.add(leftWall);
        this.scene.add(rightWall);
        
        this.wallSegments.push({
            left: leftWall,
            right: rightWall,
            z: zPosition
        });
    }
    
    addNeonStrips(wall, color) {
        const stripCount = 3;
        const stripHeight = wall.geometry.parameters.height;
        const stripSpacing = stripHeight / stripCount;
        
        for (let i = 0; i < stripCount; i++) {
            const stripGeometry = new THREE.PlaneGeometry(wall.geometry.parameters.depth, 0.1);
            const stripColor = color === 'cyan' ? CONFIG.SYNTHWAVE.WALLS_CYAN : CONFIG.SYNTHWAVE.WALLS_MAGENTA;
            const stripMaterial = new THREE.MeshBasicMaterial({
                color: stripColor,
                transparent: true,
                opacity: 0.8
            });
            
            const strip = new THREE.Mesh(stripGeometry, stripMaterial);
            strip.position.set(0, -stripHeight / 2 + stripSpacing * (i + 1), wall.geometry.parameters.depth / 2 + 0.01);
            
            wall.add(strip);
        }
    }
    
    createBuildingSegment(zPosition) {
        const buildingGroup = new THREE.Group();
        const buildingCount = 6;
        const spacing = CONFIG.WORLD.BUILDING_SPACING;
        
        for (let i = 0; i < buildingCount; i++) {
            const x = (i - buildingCount / 2) * spacing;
            const height = Math.random() * CONFIG.WORLD.BUILDING_HEIGHT + 5;
            const width = Math.random() * 8 + 4;
            const depth = Math.random() * 8 + 4;
            
            const building = this.createBuilding(x, height, width, depth);
            buildingGroup.add(building);
        }
        
        buildingGroup.position.z = zPosition;
        this.scene.add(buildingGroup);
        
        this.buildingSegments.push({
            group: buildingGroup,
            z: zPosition
        });
    }
    
    createBuilding(x, height, width, depth) {
        // Main building
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.SYNTHWAVE.BUILDINGS,
            roughness: 0.7,
            metalness: 0.1
        });
        
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(x, height / 2, 0);
        
        // Add windows
        this.addBuildingWindows(building, width, height, depth);
        
        // Add neon accent
        const accentGeometry = new THREE.BoxGeometry(width * 0.9, 0.2, depth * 0.9);
        const accentColor = Math.random() > 0.5 ? CONFIG.SYNTHWAVE.WALLS_CYAN : CONFIG.SYNTHWAVE.WALLS_MAGENTA;
        const accentMaterial = new THREE.MeshBasicMaterial({
            color: accentColor,
            transparent: true,
            opacity: 0.6
        });
        
        const accent = new THREE.Mesh(accentGeometry, accentMaterial);
        accent.position.set(0, height * 0.7, 0);
        building.add(accent);
        
        return building;
    }
    
    addBuildingWindows(building, width, height, depth) {
        const windowCount = Math.floor(width * height / 10);
        
        for (let i = 0; i < windowCount; i++) {
            const windowGeometry = new THREE.PlaneGeometry(0.3, 0.5);
            const windowMaterial = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.8 ? CONFIG.SYNTHWAVE.ROAD_LINES : 0x222222,
                transparent: true,
                opacity: Math.random() > 0.5 ? 0.8 : 0.3
            });
            
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            
            // Position windows randomly on building surface
            const side = Math.floor(Math.random() * 4);
            const windowX = (Math.random() - 0.5) * width * 0.8;
            const windowY = Math.random() * height * 0.8;
            const windowZ = (Math.random() - 0.5) * depth * 0.8;
            
            if (side === 0) { // Front
                window.position.set(windowX, windowY, depth / 2 + 0.01);
            } else if (side === 1) { // Back
                window.position.set(windowX, windowY, -depth / 2 - 0.01);
                window.rotation.y = Math.PI;
            } else if (side === 2) { // Left
                window.position.set(-width / 2 - 0.01, windowY, windowZ);
                window.rotation.y = Math.PI / 2;
            } else { // Right
                window.position.set(width / 2 + 0.01, windowY, windowZ);
                window.rotation.y = -Math.PI / 2;
            }
            
            building.add(window);
        }
    }
    
    update(carPositionZ) {
        // Remove segments that are too far behind
        this.cleanupSegments(carPositionZ);
        
        // Add new segments ahead
        while (this.currentZPosition > carPositionZ - CONFIG.WORLD.FOG_DISTANCE) {
            this.currentZPosition -= CONFIG.WORLD.SEGMENT_LENGTH;
            this.createRoadSegment(this.currentZPosition);
            this.createWallSegment(this.currentZPosition);
            this.createBuildingSegment(this.currentZPosition);
        }
    }
    
    cleanupSegments(carPositionZ) {
        // Remove road segments
        this.roadSegments = this.roadSegments.filter(segment => {
            if (segment.z > carPositionZ + 100) {
                this.scene.remove(segment.mesh);
                this.scene.remove(segment.divider);
                if (segment.gridLines) {
                    this.scene.remove(segment.gridLines);
                }
                return false;
            }
            return true;
        });
        
        // Remove wall segments
        this.wallSegments = this.wallSegments.filter(segment => {
            if (segment.z > carPositionZ + 100) {
                this.scene.remove(segment.left);
                this.scene.remove(segment.right);
                return false;
            }
            return true;
        });
        
        // Remove building segments
        this.buildingSegments = this.buildingSegments.filter(segment => {
            if (segment.z > carPositionZ + 100) {
                this.scene.remove(segment.group);
                return false;
            }
            return true;
        });
    }
    
    checkCollision(carPosition, carSize) {
        const roadHalfWidth = CONFIG.WORLD.ROAD_WIDTH / 2;
        const wallThickness = CONFIG.WORLD.WALL_THICKNESS;
        
        // Check collision with left wall
        if (carPosition.x - carSize.x / 2 < -roadHalfWidth - wallThickness) {
            return true;
        }
        
        // Check collision with right wall
        if (carPosition.x + carSize.x / 2 > roadHalfWidth + wallThickness) {
            return true;
        }
        
        return false;
    }
    
    getRoadBounds() {
        const roadHalfWidth = CONFIG.WORLD.ROAD_WIDTH / 2;
        const wallThickness = CONFIG.WORLD.WALL_THICKNESS;
        
        return {
            left: -roadHalfWidth - wallThickness,
            right: roadHalfWidth + wallThickness
        };
    }
    
    dispose() {
        // Clean up all meshes
        this.roadSegments.forEach(segment => {
            this.scene.remove(segment.mesh);
            this.scene.remove(segment.divider);
            if (segment.gridLines) {
                this.scene.remove(segment.gridLines);
            }
        });
        
        this.wallSegments.forEach(segment => {
            this.scene.remove(segment.left);
            this.scene.remove(segment.right);
        });
        
        this.buildingSegments.forEach(segment => {
            this.scene.remove(segment.group);
        });
        
        if (this.sky) {
            this.scene.remove(this.sky);
        }
        
        // Clear arrays
        this.roadSegments = [];
        this.wallSegments = [];
        this.buildingSegments = [];
    }
}