import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Sparks {
  constructor(scene, config, performanceTier = 'HIGH') {
    this.config = config;
    this.performanceTier = performanceTier;
    this.particles = [];
    this._narrowRoadAccumulator = 0; // For particle emission rate control

    // Particle pooling configuration
    this.maxParticles = performanceTier === 'LOW' ? 15 : (performanceTier === 'MEDIUM' ? 30 : 50);
    
    // Object pool for particle objects to avoid creating new objects every frame
    this._particlePool = [];
    this._activeParticles = 0;

    const geometry = new THREE.PlaneGeometry(config.size, config.size);
    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, this.maxParticles);
    this.mesh.count = 0;
    this.mesh.visible = false;
    scene.add(this.mesh);

    this._dummy = new THREE.Object3D();
    this._color = new THREE.Color();
  }

  // Object pool helper methods
  _getPooledParticle() {
    if (this._particlePool.length > 0) {
      return this._particlePool.pop();
    }
    // Create new particle object if pool is empty
    return {};
  }

  _releaseParticle(particle) {
    // Reset particle properties before returning to pool
    particle.position = null;
    particle.velocity = null;
    this._particlePool.push(particle);
  }

  emit(position, normal) {
    if (!this.config.enabled) return;

    // Cap particle count to avoid overloading low-end devices
    if (this._activeParticles >= this.maxParticles) return;

    const count = this.config.particlesPerGraze;
    for (let i = 0; i < count && this._activeParticles < this.maxParticles; i++) {
      const spreadAngle = Math.random() * Math.PI * 2;
      const spreadSpeed = Math.random() * this.config.speed;
      const upwardSpeed = Math.random() * this.config.speed * 0.5;

      const particle = this._getPooledParticle();
      particle.position = position.clone();
      particle.velocity = new THREE.Vector3(
        Math.cos(spreadAngle) * spreadSpeed + normal.x * 2,
        upwardSpeed,
        Math.sin(spreadAngle) * spreadSpeed + normal.z * 2
      );
      particle.life = 0;
      particle.scale = 0.5 + Math.random() * 0.5;

      this.particles.push(particle);
      this._activeParticles++;
    }
  }

  // New method for narrow road sparks - emits particles outward from car sides
  emitNarrowRoadSparks(carPosition, carWidth) {
    if (!this.config.enabled) return;

    const leftSide = new THREE.Vector3(carPosition.x - carWidth * 0.6, carPosition.y, carPosition.z);
    const rightSide = new THREE.Vector3(carPosition.x + carWidth * 0.6, carPosition.y, carPosition.z);

      // Emit from left side - particles shoot to the left (negative X)
    for (let i = 0; i < 3 && this._activeParticles < this.maxParticles; i++) {
      const particle = this._getPooledParticle();
      particle.position = leftSide.clone().add(new THREE.Vector3(-0.1, Math.random() * 0.2, 0));
      particle.velocity = new THREE.Vector3(
        -3 - Math.random() * 2, // Shoot left
        Math.random() * 2,
          (Math.random() - 0.5) * 2
        );
        particle.life = 0;
      particle.scale = 0.4 + Math.random() * 0.3;
      
      this.particles.push(particle);
      this._activeParticles++;
    }

    // Emit from right side - particles shoot to the right (positive X)
    for (let i = 0; i < 3 && this._activeParticles < this.maxParticles; i++) {
      const particle = this._getPooledParticle();
      particle.position = rightSide.clone().add(new THREE.Vector3(0.1, Math.random() * 0.2, 0));
      particle.velocity = new THREE.Vector3(
        3 + Math.random() * 2, // Shoot right
        Math.random() * 2,
        (Math.random() - 0.5) * 2
      );
      particle.life = 0;
      particle.scale = 0.4 + Math.random() * 0.3;
      
      this.particles.push(particle);
      this._activeParticles++;
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
