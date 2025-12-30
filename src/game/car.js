import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { clamp, lerp } from './helpers.js';

export class Car {
  constructor(config) {
    this.rootConfig = config;
    this.config = config.car;

    this.group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(this.config.length, this.config.height, this.config.width);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: config.synthwave.car.color,
      emissive: config.synthwave.car.emissive,
      emissiveIntensity: config.synthwave.car.emissiveIntensity,
      roughness: 0.3,
      metalness: 0.7,
    });

    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.castShadow = false;
    this.body.receiveShadow = false;
    this.group.add(this.body);

    this.yaw = 0;
    this.speed = this.config.baseSpeed;

    this.group.position.set(0, this.config.height * 0.5 + 0.05, 0);

    // Used for wall collision margin.
    this.radius = this.config.width * 0.45;
  }

  reset() {
    this.yaw = 0;
    this.speed = this.config.baseSpeed;
    this.group.position.set(0, this.config.height * 0.5 + 0.05, 0);
    this.group.rotation.set(0, 0, 0);
  }

  update(dt, steer, speed) {
    this.speed = speed;

    if (steer !== 0) {
      this.yaw += steer * this.config.steeringRate * dt;
    } else {
      this.yaw += (0 - this.yaw) * Math.min(1, this.config.autoCenterRate * dt);
    }

    this.yaw = clamp(this.yaw, -this.config.maxYaw, this.config.maxYaw);

    const dx = Math.sin(this.yaw) * this.speed * dt;
    const dz = Math.cos(this.yaw) * this.speed * dt;

    this.group.position.x += dx;
    this.group.position.z += dz;

    this.group.rotation.y = this.yaw;

    // Z-Axis tilt based on steering input
    const targetTiltZ = steer * THREE.MathUtils.degToRad(this.config.tiltAngle || 18);
    this.group.rotation.z = lerp(this.group.rotation.z, targetTiltZ, 0.15);
  }
}
