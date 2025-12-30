import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class SpeedLines {
  constructor(scene, config) {
    this.config = config;
    this.particles = [];
    this.spawnAccumulator = 0;

    const geometry = new THREE.PlaneGeometry(
      config.particleSize.width,
      config.particleSize.length
    );
    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
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

  emit(speedRatio) {
    if (!this.config.enabled || speedRatio <= 0) return;

    const spawnCount = this.config.particlesPerSecondAtMaxSpeed * speedRatio;
    this.spawnAccumulator += spawnCount;

    while (this.spawnAccumulator >= 1) {
      this.spawnAccumulator -= 1;
      this.particles.push({
        t: 0,
        angle: Math.random() * Math.PI * 2,
        scale: 0.8 + Math.random() * 0.4,
      });
    }
  }

  update(dt, speedRatio) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.t += dt;

      if (p.t >= this.config.lifespan) {
        this.particles.splice(i, 1);
        continue;
      }
    }

    if (this.particles.length === 0) {
      this.mesh.count = 0;
      this.mesh.visible = false;
      return;
    }

    this.mesh.visible = true;
    this.mesh.count = Math.min(this.particles.length, 200);

    const fovAngle = THREE.MathUtils.degToRad(75);
    const maxRadius = Math.tan(fovAngle * 0.5) * 8;
    const lifeRatioInv = 1 / this.config.lifespan;

    for (let i = 0; i < this.mesh.count; i++) {
      const p = this.particles[i];
      const lifeRatio = p.t * lifeRatioInv;
      const radius = lifeRatio * maxRadius;
      const x = Math.cos(p.angle) * radius;
      const y = Math.sin(p.angle) * radius;

      this._dummy.position.set(x, y, -4 - radius * 0.3);
      this._dummy.scale.set(p.scale * (1 + lifeRatio * 2), p.scale, 1);
      this._dummy.rotation.z = p.angle;
      this._dummy.updateMatrix();

      this.mesh.setMatrixAt(i, this._dummy.matrix);

      const alpha = (1 - lifeRatio) * 0.4 * speedRatio;
      this._color.setHex(this.config.color);
      this._color.a = alpha;
      this.mesh.setColorAt(i, this._color);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  reset() {
    this.particles = [];
    this.spawnAccumulator = 0;
    this.mesh.count = 0;
    this.mesh.visible = false;
  }
}
