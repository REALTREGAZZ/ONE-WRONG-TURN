import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { lerp } from './helpers.js';

export class FollowCamera {
  constructor(camera, { height, distance, lookAhead, smoothness, crashShakeSeconds, crashShakeStrength, fov }) {
    this.camera = camera;
    this.params = { height, distance, lookAhead, smoothness, crashShakeSeconds, crashShakeStrength, fov };

    this._shakeT = 0;
    this._shakeTotal = 0;
    this._shakeAmplitude0 = 0;
    this._shakeSampleT = 0;

    this._shakeOffset = new THREE.Vector3();
    this._lastShake = new THREE.Vector3();

    this._tmp = new THREE.Vector3();
    this._desired = new THREE.Vector3();
  }

  startCrashShake() {
    this._shakeTotal = 0.6;
    this._shakeT = this._shakeTotal;
    this._shakeAmplitude0 = 0.8 + Math.random() * 0.4;
    this._shakeSampleT = 0;
    this._shakeOffset.set(0, 0, 0);
    this._lastShake.set(0, 0, 0);
  }

  update(dt, target, speedRatio = 0) {
    this.camera.position.sub(this._lastShake);
    this._lastShake.set(0, 0, 0);

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

      const elapsed = this._shakeTotal - this._shakeT;
      const punchWindow = 0.15;

      let amp = this._shakeAmplitude0;
      if (elapsed > punchWindow) {
        const t = (elapsed - punchWindow) / Math.max(0.0001, this._shakeTotal - punchWindow);
        amp *= Math.exp(-4.6 * t);
      }

      let interval = 0.04;
      if (elapsed > punchWindow) {
        const t = (elapsed - punchWindow) / Math.max(0.0001, this._shakeTotal - punchWindow);
        interval = lerp(0.04, 0.085, t);
      }

      this._shakeSampleT -= dt;
      if (this._shakeSampleT <= 0) {
        this._shakeSampleT = interval;
        this._shakeOffset.set(
          (Math.random() * 2 - 1) * amp,
          (Math.random() * 2 - 1) * amp * 0.7,
          (Math.random() * 2 - 1) * amp * 0.3
        );
      }

      this.camera.position.add(this._shakeOffset);
      this._lastShake.copy(this._shakeOffset);
    } else {
      this._shakeOffset.set(0, 0, 0);
    }
  }
}
