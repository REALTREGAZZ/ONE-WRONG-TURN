// Using global THREE from CDN - no import needed

export class CrashDebris {
  constructor(scene, { colors = [0x00ffff, 0xff00ff, 0xffff00] } = {}) {
    this.colors = colors;
    this.pieces = [];

    this.group = new THREE.Group();
    scene.add(this.group);

    this._geom = new THREE.BoxGeometry(1, 1, 1);
    this._tmp = new THREE.Vector3();
    this._baseDir = new THREE.Vector3(0, 0, -1);
  }

  spawn(origin, cameraPosition) {
    const count = 10 + Math.floor(Math.random() * 6);

    if (cameraPosition) {
      this._baseDir.subVectors(cameraPosition, origin);
      if (this._baseDir.lengthSq() > 0.0001) this._baseDir.normalize();
      else this._baseDir.set(0, 0, -1);
    } else {
      this._baseDir.set(0, 0, -1);
    }

    for (let i = 0; i < count; i++) {
      const color = this.colors[(Math.random() * this.colors.length) | 0];

      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.1,
        metalness: 0.85,
        roughness: 0.22,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(this._geom, mat);

      const size = 0.2 + Math.random() * 0.3;
      mesh.scale.setScalar(size);

      mesh.position.copy(origin);
      mesh.position.x += (Math.random() - 0.5) * 0.9;
      mesh.position.y += 0.25 + Math.random() * 0.75;
      mesh.position.z += (Math.random() - 0.5) * 0.8;

      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      this.group.add(mesh);

      const speed = 5 + Math.random() * 10;
      const dir = this._tmp
        .set(
          (Math.random() - 0.5) * 1.2,
          (Math.random() - 0.5) * 0.9,
          (Math.random() - 0.5) * 0.6
        )
        .addScaledVector(this._baseDir, 1.25)
        .normalize();

      const velocity = dir.multiplyScalar(speed).clone();

      const spin = new THREE.Vector3(
        (Math.random() * 2 - 1) * 18,
        (Math.random() * 2 - 1) * 18,
        (Math.random() * 2 - 1) * 18
      );

      const lifespan = 0.5 + Math.random() * 0.2;

      this.pieces.push({ mesh, velocity, spin, t: 0, lifespan });
    }
  }

  update(dt) {
    if (this.pieces.length === 0) return;

    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const p = this.pieces[i];
      p.t += dt;

      const k = p.t / p.lifespan;
      if (k >= 1) {
        this.group.remove(p.mesh);
        p.mesh.material.dispose();
        this.pieces.splice(i, 1);
        continue;
      }

      p.mesh.position.addScaledVector(p.velocity, dt);

      const drag = 1 - dt * 2.2;
      p.velocity.multiplyScalar(drag);

      p.mesh.rotation.x += p.spin.x * dt;
      p.mesh.rotation.y += p.spin.y * dt;
      p.mesh.rotation.z += p.spin.z * dt;

      const fadeT = Math.max(0, (k - 0.55) / 0.45);
      p.mesh.material.opacity = 1 - fadeT;
    }
  }

  reset() {
    for (const p of this.pieces) {
      this.group.remove(p.mesh);
      p.mesh.material.dispose();
    }
    this.pieces = [];
  }
}
