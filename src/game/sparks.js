import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Sparks {
  constructor(scene, config) {
    this.config = config;
    this.particles = [];
    this._narrowRoadAccumulator = 0; // For particle emission rate control

    const geometry = new THREE.PlaneGeometry(config.size, config.size);
    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, 200);
    this.mesh.count = 0;
    this.mesh.visible = false;
    scene.add(this.mesh);

    this._dummy = new THREE.Object3D();
    this._color = new THREE.Color();
  }

  emit(position, normal) {
    if (!this.config.enabled) return;

    const count = this.config.particlesPerGraze;
    for (let i = 0; i < count; i++) {
      const spreadAngle = Math.random() * Math.PI * 2;
      const spreadSpeed = Math.random() * this.config.speed;
      const upwardSpeed = Math.random() * this.config.speed * 0.5;

      this.particles.push({
        position: position.clone(),
        velocity: new THREE.Vector3(
          Math.cos(spreadAngle) * spreadSpeed + normal.x * 2,
          upwardSpeed,
          Math.sin(spreadAngle) * spreadSpeed + normal.z * 2
        ),
        life: 0,
        scale: 0.5 + Math.random() * 0.5,
      });
    }
  }

  // New method for narrow road sparks - emits particles outward from car sides
  emitNarrowRoadSparks(carPosition, carWidth) {
    if (!this.config.enabled) return;

    const leftSide = new THREE.Vector3(carPosition.x - carWidth * 0.6, carPosition.y, carPosition.z);
    const rightSide = new THREE.Vector3(carPosition.x + carWidth * 0.6, carPosition.y, carPosition.z);

    // Emit from left side - particles shoot to the left (negative X)
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        position: leftSide.clone().add(new THREE.Vector3(-0.1, Math.random() * 0.2, 0)),
        velocity: new THREE.Vector3(
          -3 - Math.random() * 2, // Shoot left
          Math.random() * 2,
          (Math.random() - 0.5) * 2
        ),
        life: 0,
        scale: 0.4 + Math.random() * 0.3,
      });
    }

    // Emit from right side - particles shoot to the right (positive X)
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        position: rightSide.clone().add(new THREE.Vector3(0.1, Math.random() * 0.2, 0)),
        velocity: new THREE.Vector3(
          3 + Math.random() * 2, // Shoot right
          Math.random() * 2,
          (Math.random() - 0.5) * 2
        ),
        life: 0,
        scale: 0.4 + Math.random() * 0.3,
      });
    }
  }

  update(dt) {
    // Handle narrow road spark emission based on rate
    if (this._narrowRoadAccumulator > 0) {
      this._narrowRoadAccumulator -= dt;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= this.config.lifespan) {
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y -= 15 * dt;
      p.position.add(p.velocity.clone().multiplyScalar(dt));
    }

    if (this.particles.length === 0) {
      this.mesh.count = 0;
      this.mesh.visible = false;
      return;
    }

    this.mesh.visible = true;
    this.mesh.count = Math.min(this.particles.length, 200);

    const lifeRatioInv = 1 / this.config.lifespan;

    for (let i = 0; i < this.mesh.count; i++) {
      const p = this.particles[i];
      const lifeRatio = p.life * lifeRatioInv;

      this._dummy.position.copy(p.position);
      this._dummy.rotation.x = -Math.PI * 0.5;
      this._dummy.scale.set(p.scale, p.scale, p.scale);
      this._dummy.updateMatrix();

      this.mesh.setMatrixAt(i, this._dummy.matrix);

      const alpha = (1 - lifeRatio) * (1 - lifeRatio);
      this._color.setHex(this.config.color);
      this._color.a = alpha;
      this.mesh.setColorAt(i, this._color);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  // New method to check and emit narrow road sparks based on rate
  updateNarrowRoadSparks(dt, carPosition, carWidth, currentRoadWidth) {
    if (currentRoadWidth >= this.config.narrowRoadThreshold) {
      this._narrowRoadAccumulator = 0;
      return;
    }

    // Add to accumulator based on the configured rate
    this._narrowRoadAccumulator += dt * this.config.narrowRoadSparkRate;

    // Emit sparks when accumulator reaches 1.0 (meaning 1 second worth of particles)
    while (this._narrowRoadAccumulator >= 1.0) {
      this.emitNarrowRoadSparks(carPosition, carWidth);
      this._narrowRoadAccumulator -= 1.0;
    }
  }

  reset() {
    this.particles = [];
    this.mesh.count = 0;
    this.mesh.visible = false;
    this._narrowRoadAccumulator = 0; // Reset accumulator
  }
}
