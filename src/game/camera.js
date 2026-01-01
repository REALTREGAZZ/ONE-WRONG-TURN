// Using global THREE from CDN - no import needed
import { lerp } from './helpers.js';

export class FollowCamera {
  constructor(camera, { height, distance, lookAhead, smoothness, crashShakeSeconds, crashShakeStrength, fov, shakeFrequency, shakeAmplitude }) {
    this.camera = camera;
    this.params = { height, distance, lookAhead, smoothness, crashShakeSeconds, crashShakeStrength, fov, shakeFrequency, shakeAmplitude };

    this._shakeT = 0;
    this._shakeTotal = 0;
    this._shakeAmplitude0 = 0;
    this._shakeSampleT = 0;

    this._shakeOffset = new THREE.Vector3();
    this._lastShake = new THREE.Vector3();
    this._lastVelocityShake = new THREE.Vector3();

    this._tmp = new THREE.Vector3();
    this._desired = new THREE.Vector3();

    // Third person camera parameters
    this._thirdPersonOffset = new THREE.Vector3(0, 1.5, -2.5); // Behind and above car
    this._thirdPersonSmoothness = 10; // Higher = faster follow
    this._currentCameraOffset = new THREE.Vector3();
  }

  startCrashShake() {
    this._shakeTotal = 0.6;
    this._shakeT = this._shakeTotal;
    this._shakeAmplitude0 = 0.8 + Math.random() * 0.4;
    this._shakeSampleT = 0;
    this._shakeOffset.set(0, 0, 0);
    this._lastShake.set(0, 0, 0);
  }

  updateVelocityShake(dt, speed, maxSpeed) {
    this.camera.position.sub(this._lastVelocityShake);
    this._lastVelocityShake.set(0, 0, 0);

    const velocityRatio = speed / maxSpeed;
    if (velocityRatio > 0.6) {
      const amplitude = velocityRatio * (this.params.shakeAmplitude || 0.04);
      const frequency = this.params.shakeFrequency || 10;
      const noise = Math.sin(Date.now() * 0.01 * frequency) * amplitude;

      this._lastVelocityShake.set(noise, noise * 0.3, 0);
      this.camera.position.add(this._lastVelocityShake);
    }
  }

  update(dt, target, speedRatio = 0) {
    this.camera.position.sub(this._lastShake);
    this._lastShake.set(0, 0, 0);

    // Third person camera follow - professional implementation
    // Calculate desired camera position behind and above the car
    const carRotation = target.rotation.y;
    const forwardDir = new THREE.Vector3(Math.sin(carRotation), 0, Math.cos(carRotation));

    // Third person offset is relative to car's forward direction
    // Offset is behind (-Z) and up (+Y)
    const behindDir = forwardDir.clone().multiplyScalar(-1);
    const offsetPosition = behindDir.multiplyScalar(this._thirdPersonOffset.z);

    // Add height offset
    offsetPosition.y = this._thirdPersonOffset.y;

    // Smooth lerp for camera position (no vibration)
    const desiredPosition = target.position.clone().add(offsetPosition);
    const alpha = 1 - Math.exp(-this._thirdPersonSmoothness * dt);
    this.camera.position.lerp(desiredPosition, alpha);

    // Camera look-at point: slightly ahead of the car
    const lookAtOffset = forwardDir.multiplyScalar(this.params.lookAhead);
    const lookAtPoint = target.position.clone().add(lookAtOffset);
    lookAtPoint.y = 0.8; // Slightly above car center

    this._tmp.copy(lookAtPoint);
    this.camera.lookAt(this._tmp);

    // Dynamic FOV based on speed
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
