import * as THREE from 'three';

export class Camera {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.Object3D | null = null;
  private offset = new THREE.Vector3(0, 8, 12);
  private lookAtOffset = new THREE.Vector3(0, 0, -10);
  private currentPosition = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();
  private smoothness = 0.1;
  private shakeAmount = 0;
  private shakeDecay = 0.95;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.currentPosition.copy(this.offset);
    this.camera.position.copy(this.currentPosition);
  }

  public setTarget(target: THREE.Object3D): void {
    this.target = target;
  }

  public update(deltaTime: number, shake: boolean, shakeIntensity: number): void {
    try {
      if (!this.target) return;

      if (shake && shakeIntensity > 0) {
        this.shakeAmount = shakeIntensity;
      }

      const targetWorldPosition = new THREE.Vector3();
      this.target.getWorldPosition(targetWorldPosition);

      const desiredPosition = targetWorldPosition.clone().add(this.offset);
      this.currentPosition.lerp(desiredPosition, this.smoothness);

      if (this.shakeAmount > 0.01) {
        const shakeX = (Math.random() - 0.5) * this.shakeAmount;
        const shakeY = (Math.random() - 0.5) * this.shakeAmount;
        const shakeZ = (Math.random() - 0.5) * this.shakeAmount;

        this.camera.position.set(
          this.currentPosition.x + shakeX,
          this.currentPosition.y + shakeY,
          this.currentPosition.z + shakeZ
        );

        this.shakeAmount *= this.shakeDecay;
      } else {
        this.shakeAmount = 0;
        this.camera.position.copy(this.currentPosition);
      }

      const desiredLookAt = targetWorldPosition.clone().add(this.lookAtOffset);
      this.currentLookAt.lerp(desiredLookAt, this.smoothness);

      this.camera.lookAt(this.currentLookAt);
    } catch (error) {
      console.error('[ONE WRONG TURN] Error updating camera:', error);
    }
  }

  public reset(): void {
    this.currentPosition.copy(this.offset);
    this.currentLookAt.set(0, 0, -10);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
    this.shakeAmount = 0;
  }

  public handleResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
