// Using global THREE from CDN - no import needed

export class WheelTrails {
  constructor(scene, config) {
    this.config = config;
    this.particles = [];

    // Plane geometry for the trail segment
    const geometry = new THREE.PlaneGeometry(config.width, 1);
    geometry.rotateX(-Math.PI / 2); // Lay flat
    geometry.translate(0, 0, -0.5); // Align so position is at the front of the segment (pointing backwards)

    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, 400);
    this.mesh.count = 0;
    this.mesh.visible = false;
    scene.add(this.mesh);

    this._dummy = new THREE.Object3D();
    this._color = new THREE.Color();
  }

  update(dt, car, currentSpeed, maxSpeed) {
    if (!this.config.enabled) return;

    // Spawn new segments
    const speedRatio = currentSpeed / maxSpeed;
    const trailDensity = speedRatio * this.config.maxDensity;
    // Density is roughly lines per frame at 60fps
    if (Math.random() < (trailDensity / 60) * (dt / 0.0166)) {
      this.spawn(car);
    }

    // Update existing segments
    const lifeRatioInv = 1 / this.config.lifespan;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.t += dt;
      if (p.t >= this.config.lifespan) {
        this.particles.splice(i, 1);
      }
    }

    // Update instanced mesh
    const count = Math.min(this.particles.length, 400);
    this.mesh.count = count;
    
    if (count === 0) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;

    for (let i = 0; i < count; i++) {
      const p = this.particles[i];
      const lifeRatio = p.t * lifeRatioInv;
      const alpha = 1 - lifeRatio;

      this._dummy.position.copy(p.pos);
      this._dummy.rotation.y = p.yaw;
      this._dummy.scale.set(1, 1, p.length);
      this._dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this._dummy.matrix);

      this._color.setHex(p.color);
      // Fade to black as a proxy for alpha transparency
      this._color.multiplyScalar(alpha);
      this.mesh.setColorAt(i, this._color);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  spawn(car) {
    const yaw = car.yaw;
    const speed = car.speed;
    const segmentLength = speed * 0.12; // Length proportional to speed

    // Rear wheel offsets relative to car center
    const offsetX = 0.4;
    const offsetZ = -0.7;

    // Left wheel
    this.addParticle(car, -offsetX, offsetZ, this.config.leftColor, segmentLength);
    // Right wheel
    this.addParticle(car, offsetX, offsetZ, this.config.rightColor, segmentLength);
  }

  addParticle(car, offsetX, offsetZ, color, length) {
    const yaw = car.yaw;
    const pos = car.group.position.clone();
    
    // Rotate offset by car's yaw to find world position of the wheel
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const rx = offsetX * cos + offsetZ * sin;
    const rz = -offsetX * sin + offsetZ * cos;

    pos.x += rx;
    pos.z += rz;
    pos.y = 0.02; // Close to ground

    this.particles.push({
      pos,
      yaw,
      color,
      length,
      t: 0
    });
  }

  reset() {
    this.particles = [];
    this.mesh.count = 0;
    this.mesh.visible = false;
  }
}
