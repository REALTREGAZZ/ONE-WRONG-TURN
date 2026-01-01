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

    // Property for active accessories (disabled)
    // this.activeAccessories = [];

    // Initialize wheels array
    this.wheels = [];

    // Create procedural vehicle
    this.createProceduralVehicle();

    this.yaw = 0;
    this.speed = this.config.baseSpeed;
    this.distance = 0;

    // Physics properties
    this.velocity = new THREE.Vector3();
    this.steering = 0;

    // Steering physics
    this.wheelBase = 1.2; // Distance between front and rear axles
    this.steeringAngle = 0;
    this.maxSteeringAngle = Math.PI / 6; // 30 degrees

    // Collision margin (radius should be slightly less than half of car width X = 2.0)
    this.radius = (this.config.width || 2.0) * 0.45;
  }

  /**
   * Create the procedural vehicle (simple box)
   */
  createProceduralVehicle() {
    // Clear existing model
    while (this.model.children.length > 0) {
      this.model.remove(this.model.children[0]);
    }

    // Simple box car (red by default)
    const carGeo = new THREE.BoxGeometry(2.0, 0.8, 1.2);
    const carMat = new THREE.MeshStandardMaterial({
      color: 0xFF0000, // Red
      roughness: 0.3,
      metalness: 0.5,
    });
    this.chassis = new THREE.Mesh(carGeo, carMat);
    this.model.add(this.chassis);

    // Simple wheels (4 boxes for simplicity)
    this.wheels = [];
    const wheelGeo = new THREE.BoxGeometry(0.25, 0.3, 0.3);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.3,
    });

    const wheelPos = [
      { x: -0.8, y: -0.4, z: 0.5 },
      { x: 0.8, y: -0.4, z: 0.5 },
      { x: -0.8, y: -0.4, z: -0.5 },
      { x: 0.8, y: -0.4, z: -0.5 },
    ];

    wheelPos.forEach(p => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(p.x, p.y, p.z);
      this.model.add(wheel);
      this.wheels.push(wheel);
    });
  }

  reset() {
    this.yaw = 0;
    this.speed = this.config.baseSpeed;
    this.distance = 0;

    // Reset position
    this.group.position.set(0, 0.55, 0);
    this.group.rotation.set(0, 0, 0);
  }

  update(dt, steer, speed) {
    this.speed = speed;
    this.distance += this.speed * dt;

    // Smooth steering
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

    // Velocity calculation
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    this.velocity.copy(forward).multiplyScalar(this.speed);

    this.group.position.addScaledVector(this.velocity, dt);
    this.group.rotation.y = this.yaw;
  }

  applySkin(skinId) {
    const skins = this.rootConfig.SHOP_ITEMS?.skins || [];
    const skin = skins.find(s => s.id === skinId);
    if (!skin) return;

    const color = skin.color;

    // Change chassis color
    if (this.chassis) {
      this.chassis.material.color.setHex(color);
    }

    this.currentSkin = skinId;
  }

  applyAccessories(accessories) {
    // Accessories disabled - no-op
  }
}
