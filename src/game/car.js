import { CONFIG } from './config.js';

// Procedural Car Creation using BoxGeometry
export class Car {
    constructor(scene) {
        this.scene = scene;
        this.carGroup = new THREE.Group();
        this.speed = CONFIG.GAME.START_SPEED;
        this.isCrashed = false;
        this.position = new THREE.Vector3(0, CONFIG.GAME.CAR_HEIGHT, 0);
        this.velocity = new THREE.Vector3(0, 0, -this.speed);
        this.currentSkin = 'red';
        
        this.createProceduralCar();
        this.addToScene();
    }
    
    createProceduralCar() {
        // Main car body
        const bodyGeometry = new THREE.BoxGeometry(2.0, 0.8, 1.2);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.SYNTHWAVE.CAR_RED,
            roughness: 0.3,
            metalness: 0.6
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.y = 0;
        
        // Car roof
        const roofGeometry = new THREE.BoxGeometry(1.4, 0.4, 0.8);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.5,
            metalness: 0.2
        });
        this.roof = new THREE.Mesh(roofGeometry, roofMaterial);
        this.roof.position.y = 0.6;
        
        // Front bumper
        const bumperGeometry = new THREE.BoxGeometry(2.0, 0.4, 0.1);
        const bumperMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.1
        });
        this.frontBumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
        this.frontBumper.position.z = -0.65;
        
        // Rear bumper
        this.rearBumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
        this.rearBumper.position.z = 0.65;
        
        // Side mirrors
        const mirrorGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.1);
        const mirrorMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.2,
            metalness: 0.8
        });
        
        this.leftMirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        this.leftMirror.position.set(-1.1, 0.3, 0);
        
        this.rightMirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        this.rightMirror.position.set(1.1, 0.3, 0);
        
        // Wheels (simple box geometry)
        const wheelGeometry = new THREE.BoxGeometry(0.25, 0.3, 0.3);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Front wheels
        this.frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.frontLeftWheel.position.set(-0.7, -0.5, -0.4);
        
        this.frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.frontRightWheel.position.set(0.7, -0.5, -0.4);
        
        // Rear wheels
        this.rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.rearLeftWheel.position.set(-0.7, -0.5, 0.4);
        
        this.rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.rearRightWheel.position.set(0.7, -0.5, 0.4);
        
        // Headlights
        const headlightGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.05);
        const headlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa
        });
        
        this.leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        this.leftHeadlight.position.set(-0.5, -0.1, -0.65);
        
        this.rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        this.rightHeadlight.position.set(0.5, -0.1, -0.65);
        
        // Tail lights
        const tailLightGeometry = new THREE.BoxGeometry(0.25, 0.1, 0.05);
        const tailLightMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000
        });
        
        this.leftTailLight = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
        this.leftTailLight.position.set(-0.6, -0.15, 0.65);
        
        this.rightTailLight = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
        this.rightTailLight.position.set(0.6, -0.15, 0.65);
        
        // Add all parts to car group
        this.carGroup.add(this.body);
        this.carGroup.add(this.roof);
        this.carGroup.add(this.frontBumper);
        this.carGroup.add(this.rearBumper);
        this.carGroup.add(this.leftMirror);
        this.carGroup.add(this.rightMirror);
        this.carGroup.add(this.frontLeftWheel);
        this.carGroup.add(this.frontRightWheel);
        this.carGroup.add(this.rearLeftWheel);
        this.carGroup.add(this.rearRightWheel);
        this.carGroup.add(this.leftHeadlight);
        this.carGroup.add(this.rightHeadlight);
        this.carGroup.add(this.leftTailLight);
        this.carGroup.add(this.rightTailLight);
        
        // Set initial position
        this.carGroup.position.copy(this.position);
        
        // Store materials for skin changes
        this.allMaterials = [
            this.body.material,
            this.roof.material,
            this.frontBumper.material,
            this.rearBumper.material,
            this.leftMirror.material,
            this.rightMirror.material
        ];
    }
    
    addToScene() {
        this.scene.add(this.carGroup);
    }
    
    update(deltaTime, steering, timeScale = 1.0) {
        if (this.isCrashed) return;
        
        // Apply steering to horizontal movement
        const steeringSpeed = 20; // units per second
        this.carGroup.position.x += steering * steeringSpeed * deltaTime * timeScale;
        
        // Apply slight car tilt based on steering
        this.carGroup.rotation.z = -steering * 0.1 * timeScale;
        
        // Constant forward speed
        const actualSpeed = this.speed * timeScale;
        
        // Move car forward (negative Z)
        this.carGroup.position.z -= actualSpeed * deltaTime;
        
        // Update position vector
        this.position.copy(this.carGroup.position);
        
        // Ground constraint - prevent falling through floor
        if (this.position.y < CONFIG.GAME.GROUND_Y) {
            this.position.y = CONFIG.GAME.GROUND_Y;
            this.carGroup.position.y = CONFIG.GAME.GROUND_Y;
        }
        
        // Add some bounce/suspension effect
        const bounceAmount = Math.sin(Date.now() * 0.01) * 0.05;
        this.carGroup.position.y = CONFIG.GAME.GROUND_Y + bounceAmount;
        this.position.y = this.carGroup.position.y;
        
        // Update wheel rotation (fake rotation)
        const wheelRotation = actualSpeed * deltaTime * 5;
        this.frontLeftWheel.rotation.x += wheelRotation;
        this.frontRightWheel.rotation.x += wheelRotation;
        this.rearLeftWheel.rotation.x += wheelRotation;
        this.rearRightWheel.rotation.x += wheelRotation;
    }
    
    applySkin(skinId) {
        const skin = CONFIG.SHOP_ITEMS[skinId];
        if (!skin) return;
        
        this.currentSkin = skinId;
        const color = new THREE.Color(skin.color);
        
        // Change all car body materials
        this.allMaterials.forEach(material => {
            material.color.copy(color);
        });
    }
    
    crash() {
        this.isCrashed = true;
        
        // Add some visual feedback for crash
        this.carGroup.rotation.x = 0.2; // Slight forward tilt
        
        // Change all lights to red
        const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.leftHeadlight.material = redMaterial;
        this.rightHeadlight.material = redMaterial;
    }
    
    reset() {
        this.isCrashed = false;
        
        // Reset position
        this.position.set(0, CONFIG.GAME.CAR_HEIGHT, 0);
        this.carGroup.position.copy(this.position);
        
        // Reset rotation
        this.carGroup.rotation.set(0, 0, 0);
        
        // Restore headlight colors
        const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        this.leftHeadlight.material = headlightMaterial;
        this.rightHeadlight.material = headlightMaterial;
    }
    
    getPosition() {
        return this.position;
    }
    
    getBoundingBox() {
        // Create bounding box for collision detection
        const box = new THREE.Box3();
        return box.setFromObject(this.carGroup);
    }
    
    dispose() {
        // Clean up geometry and materials
        this.scene.remove(this.carGroup);
        
        // Dispose of geometries
        const geometries = [this.body.geometry, this.roof.geometry, this.frontBumper.geometry, 
                           this.rearBumper.geometry, this.leftMirror.geometry, this.rightMirror.geometry,
                           this.frontLeftWheel.geometry, this.frontRightWheel.geometry,
                           this.rearLeftWheel.geometry, this.rearRightWheel.geometry];
        
        geometries.forEach(geometry => geometry.dispose());
        
        // Dispose of materials
        const materials = [...this.allMaterials, this.frontLeftWheel.material, 
                          this.frontRightWheel.material, this.rearLeftWheel.material, 
                          this.rearRightWheel.material, this.leftHeadlight.material,
                          this.rightHeadlight.material, this.leftTailLight.material,
                          this.rightTailLight.material];
        
        materials.forEach(material => material.dispose());
    }
}