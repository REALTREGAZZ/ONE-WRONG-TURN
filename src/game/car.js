// Using global THREE from CDN - no import needed
import { clamp, lerp } from './helpers.js';

export class Car {
  constructor(config) {
    this.rootConfig = config;
    this.config = config.car;

    this.group = new THREE.Group();

    // The car model group (for visual parts)
    this.model = new THREE.Group();
    this.group.add(this.model);

    // Property for active accessories
    this.activeAccessories = [];
    
    // Initialize wheels array as empty (will be populated by vehicle system)
    this.wheels = [];

    // NO procedural vehicle - wait for GLB model to be loaded
    // this.createProceduralVehicle();

    this.yaw = 0;
    this.speed = this.config.baseSpeed;
    this.distance = 0;

    // Physics properties - professional vehicle physics
    this.velocity = new THREE.Vector3();
    this.angularVelocity = 0;
    this.acceleration = 0;
    this.steering = 0;
    this.verticalVelocity = 0;
    this.isInAir = false;

    // Real vehicle physics: torque-based movement
    this.engineTorque = 0;
    this.brakeTorque = 0;
    this.wheelAngularVelocity = 0;

    // Suspension system
    this.suspensionRestLength = 0.3;
    this.suspensionStiffness = 40.0; // Stiffer for better control
    this.suspensionDamping = 3.0; // More damping to prevent bouncing
    this.wheelRadius = 0.15;

    // Realistic steering physics
    this.wheelBase = 1.2; // Distance between front and rear axles
    this.steeringAngle = 0;
    this.maxSteeringAngle = Math.PI / 6; // 30 degrees

    // Collision box (calculated from model)
    this.collider = null;

    // Third person camera state
    this.isDriving = true; // Always in driving mode for this game

    // Adjusted Y position so wheels touch the ground
    // Wheel center at -0.4, radius 0.15 => bottom at -0.55.
    this.group.position.set(0, 0.55, 0);

    // Used for wall collision margin (radius should be slightly less than half of car width X = 1.2)
    this.radius = (this.config.length || 1.2) * 0.45;

    // GLB model support
    this.currentModel = null;
    this.modelType = 'procedural';
  }

  /**
   * Create the procedural vehicle (separated for reuse)
   */
  createProceduralVehicle() {
    // Clear existing model
    while (this.model.children.length > 0) {
      this.model.remove(this.model.children[0]);
    }

    // 1. Chassis (Main Body)
    // length (X) = 1.2, height (Y) = 0.8, width (Z) = 2.0
    const chassisGeo = new THREE.BoxGeometry(this.config.length, this.config.height, this.config.width);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: this.rootConfig.synthwave.car.color,
      emissive: this.rootConfig.synthwave.car.emissive,
      emissiveIntensity: this.rootConfig.synthwave.car.emissiveIntensity,
      roughness: 0.3,
      metalness: 0.7,
    });
    this.chassis = new THREE.Mesh(chassisGeo, chassisMat);
    this.model.add(this.chassis);

    // 2. Techo/Cabin (Top)
    const cabinGeo = new THREE.BoxGeometry(0.6, 0.6, 1.4);
    this.cabin = new THREE.Mesh(cabinGeo, chassisMat);
    // Positioned on top of chassis (chassis is 0.8 high, centered at 0, so top is 0.4)
    // Cabin is 0.6 high, centered at 0.4 + 0.3 = 0.7
    // Slightly back (Z = -0.2)
    this.cabin.position.set(0, 0.7, -0.2);
    this.model.add(this.cabin);

    // 3. Parabrisas Frontal (Cian)
    const windshieldFrontGeo = new THREE.PlaneGeometry(0.6, 0.65);
    const windshieldFrontMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.3,
      metalness: 0.7,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });
    this.windshieldFront = new THREE.Mesh(windshieldFrontGeo, windshieldFrontMat);
    // Positioned at front of cabin (cabin ends at -0.2 + 0.7 = 0.5)
    this.windshieldFront.position.set(0, 0.7, 0.51);
    this.windshieldFront.rotation.x = -Math.PI * 0.15; // Incline
    this.model.add(this.windshieldFront);

    // 4. Parabrisas Trasero (Magenta)
    const windshieldBackGeo = new THREE.PlaneGeometry(0.6, 0.65);
    const windshieldBackMat = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.2,
      metalness: 0.7,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });
    this.windshieldBack = new THREE.Mesh(windshieldBackGeo, windshieldBackMat);
    // Positioned at back of cabin (cabin starts at -0.2 - 0.7 = -0.9)
    this.windshieldBack.position.set(0, 0.7, -0.91);
    this.windshieldBack.rotation.x = Math.PI * 0.15;
    this.model.add(this.windshieldBack);

    // 5. Ruedas (4 cylinders)
    this.wheels = [];
    const wheelRadius = 0.15;
    const wheelWidth = 0.25;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
    wheelGeo.rotateZ(Math.PI / 2); // Align with X axis
    
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.3,
      metalness: 0.9,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.3,
      metalness: 0.9,
    });
    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.6, wheelRadius * 0.6, wheelWidth + 0.01, 16);
    rimGeo.rotateZ(Math.PI / 2);

    const wheelPos = [
      { x: -0.4, z: 0.7 },  // FL
      { x: 0.4, z: 0.7 },   // FR
      { x: -0.4, z: -0.7 }, // BL
      { x: 0.4, z: -0.7 },  // BR
    ];

    wheelPos.forEach(p => {
      const wheel = new THREE.Group();
      wheel.position.set(p.x, -0.4, p.z);
      
      const tire = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.add(tire);
      
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheel.add(rim);
      
      this.model.add(wheel);
      this.wheels.push(wheel);
    });

    // Details: Headlights
    const headlightGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 12);
    headlightGeo.rotateX(Math.PI / 2);
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1.5,
    });
    
    const hlLeft = new THREE.Mesh(headlightGeo, headlightMat);
    hlLeft.position.set(-0.4, -0.1, 1.0);
    this.model.add(hlLeft);

    const hlRight = new THREE.Mesh(headlightGeo, headlightMat);
    hlRight.position.set(0.4, -0.1, 1.0);
    this.model.add(hlRight);
  }

  reset() {
    this.yaw = 0;
    this.speed = this.config.baseSpeed;
    this.distance = 0;

    // Reset to safe spawn height
    const spawnY = this.collider ? this.calculateSpawnY() : 0.55;
    this.group.position.set(0, spawnY, 0);
    this.group.rotation.set(0, 0, 0);

    // Reset physics
    this.velocity.set(0, 0, 0);
    this.angularVelocity = 0;
    this.engineTorque = 0;
    this.brakeTorque = 0;
    this.wheelAngularVelocity = 0;
    this.steeringAngle = 0;

    // Reset wheels if they exist
    if (this.wheels && this.wheels.length > 0) {
      this.wheels.forEach(w => w.rotation.x = 0);
    }
  }

  /**
   * Calculate safe spawn Y position based on collider
   */
  calculateSpawnY() {
    if (!this.collider || !this.collider.halfExtents) return 0.55;

    const groundLevel = -0.5;
    const modelBottom = this.collider.center.y - this.collider.halfExtents.y;

    // Spawn with 0.15 units clearance
    return groundLevel - modelBottom + 0.15;
  }

  jump(velocity) {
    this.isInAir = true;
    this.verticalVelocity = velocity;
  }

  update(dt, steer, speed) {
    this.speed = speed;
    this.distance += this.speed * dt;

    // SIMPLIFIED PHYSICS - No complex suspension, just basic steering
    // 1. Smooth steering
    const targetSteering = steer * (this.config.steeringRate || 2.0);
    this.steering = lerp(this.steering, targetSteering, dt * 8);

    // Calculate steering angle
    this.steeringAngle = this.steering * this.maxSteeringAngle;

    // Vehicle yaw based on steering
    const steerSpeedFactor = clamp(1.0 - (this.speed / this.config.maxSpeed) * 0.4, 0.6, 1.0);
    const turnRate = this.steering * this.speed / this.wheelBase * steerSpeedFactor;
    this.yaw += turnRate * dt;

    // Limit yaw angle
    const maxYaw = this.config.maxYaw || Math.PI * 0.25;
    this.yaw = clamp(this.yaw, -maxYaw, maxYaw);

    // 2. Velocity calculation
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    this.velocity.copy(forward).multiplyScalar(this.speed);

    this.group.position.addScaledVector(this.velocity, dt);
    this.group.rotation.y = this.yaw;

    // 3. SIMPLE GROUND COLLISION - Keep car at ground level
    const groundLevel = 2.0; // Car spawns at 2.0
    if (this.group.position.y < groundLevel) {
      this.group.position.y = groundLevel;
      this.verticalVelocity = 0;
      this.isInAir = false;
    }

    // NO complex suspension for now - just keep car still
    this.model.position.y = 0;
  }

  applySkin(skinId) {
    // Usar CONFIG.SHOP_ITEMS en lugar de parámetro shopSystem
    const skins = this.rootConfig.SHOP_ITEMS?.skins || [];
    const skin = skins.find(s => s.id === skinId);
    if (!skin) return;
    
    const color = skin.color;
    
    // Cambiar color del chasis
    if (this.chassis) {
      this.chassis.material.color.setHex(color);
      this.chassis.material.emissive.setHex(color);
    }
    
    // Cambiar color del techo/cabin
    if (this.cabin) {
      this.cabin.material.color.setHex(color);
      this.cabin.material.emissive.setHex(color);
    }
    
    // Cambiar windshields a colores complementarios
    const windshieldColors = {
      'yellow-neon': { front: 0x00ffff, back: 0xff00ff },
      'cyan-ghost': { front: 0xff00ff, back: 0xffff00 },
      'magenta-phantom': { front: 0xffff00, back: 0x00ffff },
      'orange-blaze': { front: 0x00ffff, back: 0xff1493 }
    };
    
    const windColors = windshieldColors[skinId] || windshieldColors['yellow-neon'];
    if (this.windshieldFront) this.windshieldFront.material.color.setHex(windColors.front);
    if (this.windshieldBack) this.windshieldBack.material.color.setHex(windColors.back);
    
    this.currentSkin = skinId;
  }

  applyAccessories(accessories) {
    // Limpiar accesorios anteriores
    if (this.spoiler) {
      this.group.remove(this.spoiler);
      this.spoiler = null;
    }
    if (this.underglow) {
      this.group.remove(this.underglow);
      this.underglow = null;
    }
    if (this.stripes) {
      this.group.remove(this.stripes);
      this.stripes = null;
    }
    
    // Restaurar ruedas originales
    this.upgradeWheels(0x333333, 0.3, 0.9);

    const allAccessories = this.rootConfig.SHOP_ITEMS?.accessories || [];
    
    for (const accessoryId of accessories) {
      const acc = allAccessories.find(a => a.id === accessoryId);
      if (!acc) continue;
      
      if (acc.type === 'spoiler') {
        this.addSpoiler();
      } else if (acc.type === 'wheels') {
        this.upgradeWheels(0xff6b35, 0.1, 1.0); // Chrome orange
      } else if (acc.type === 'underglow') {
        this.addUnderglow(0x00ffff);
      } else if (acc.type === 'stripe') {
        this.addRacingStripes();
      }
    }
  }

  addSpoiler() {
    if (!this.spoiler) {
      const spoilerGeo = new THREE.BoxGeometry(1.6, 0.1, 0.2);
      const spoilerMat = new THREE.MeshStandardMaterial({
        color: 0xff6b35,
        emissive: 0xff6b35,
        metalness: 0.8,
        roughness: 0.2
      });
      this.spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
      this.spoiler.position.set(0, 0.5, -0.8);
      this.group.add(this.spoiler);
    }
  }

  upgradeWheels(color, roughness = 0.3, metalness = 0.9) {
    // Cambiar color de todas las ruedas
    for (const wheel of this.wheels || []) {
      const tire = wheel.children[0];
      const rim = wheel.children[1];
      if (tire) {
        tire.material.color.setHex(color);
        tire.material.metalness = metalness;
        tire.material.roughness = roughness;
      }
      if (rim) {
        rim.material.color.setHex(roughness === 0.3 ? 0x1a1a1a : 0xffffff);
        rim.material.metalness = metalness;
        rim.material.roughness = roughness;
      }
    }
  }

  addUnderglow(color) {
    if (!this.underglow) {
      const underglowGeo = new THREE.BoxGeometry(1.8, 0.05, 0.8);
      const underglowMat = new THREE.MeshBasicMaterial({
        color: color,
        emissive: color
      });
      this.underglow = new THREE.Mesh(underglowGeo, underglowMat);
      this.underglow.position.set(0, -0.4, 0);
      this.group.add(this.underglow);
    }
  }

  addRacingStripes() {
    if (!this.stripes) {
      const stripesGeo = new THREE.BoxGeometry(0.15, 0.4, 1.0);
      const stripesMat = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        metalness: 0.6
      });
      this.stripes = new THREE.Mesh(stripesGeo, stripesMat);
      this.stripes.position.set(0, 0.45, 0);
      this.group.add(this.stripes);
    }
  }
}
