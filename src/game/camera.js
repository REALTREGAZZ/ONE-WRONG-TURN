import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { lerp } from './helpers.js';

export class FollowCamera {
  constructor(camera, { height, distance, lookAhead, smoothness, crashShakeSeconds, crashShakeStrength, fov }) {
    this.camera = camera;
    this.params = { height, distance, lookAhead, smoothness, crashShakeSeconds, crashShakeStrength, fov };

    this._shakeT = 0;
    this._shakeSeed = 0;

    this._tmp = new THREE.Vector3();
    this._desired = new THREE.Vector3();
  }

  startCrashShake() {
    this._shakeT = this.params.crashShakeSeconds;
    this._shakeSeed = Math.random() * 1000;
  }

  update(dt, target, speedRatio = 0) {
    this._desired.set(target.position.x, this.params.height, target.position.z - this.params.distance);

    const alpha = 1 - Math.exp(-this.params.smoothness * dt);
    this.camera.position.lerp(this._desired, alpha);

    this._tmp.set(target.position.x, 0.8, target.position.z + this.params.lookAhead);
    this.camera.lookAt(this._tmp);

    const targetFov = this.params.fov.base + (this.params.fov.max - this.params.fov.base) * speedRatio;
    this.camera.fov = lerp(this.camera.fov, targetFov, this.params.fov.lerpFactor);
    this.camera.updateProjectionMatrix();

    if (this._shakeT > 0) {
      this._shakeT = Math.max(0, this._shakeT - dt);
      const k = this._shakeT / this.params.crashShakeSeconds;
      const strength = this.params.crashShakeStrength * k;

      const t = (1 - k) * 60 + this._shakeSeed;
      this.camera.position.x += (Math.sin(t * 2.1) + Math.sin(t * 3.7)) * 0.5 * strength;
      this.camera.position.y += (Math.sin(t * 4.3) + Math.cos(t * 2.9)) * 0.5 * strength;
    }
  }
}
