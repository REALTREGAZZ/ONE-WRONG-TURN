import * as THREE from 'three';

const SKINS = {
  default: 0xff00ff,
  red: 0xff0000,
  blue: 0x0000ff,
  yellow: 0xffff00,
  green: 0x00ff00,
  cyan: 0x00ffff,
  orange: 0xff6600,
  purple: 0x9900ff,
};

export type SkinId = keyof typeof SKINS;

export interface CarBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export class Car {
  private mesh: THREE.Group;
  private position = new THREE.Vector3(0, 0, 0);
  private rotation = 0;
  private readonly speed = 50;
  private readonly turnSpeed = 2.5;
  private readonly width = 2;
  private readonly length = 4;

  constructor(skinId: string = 'default') {
    this.mesh = this.createCarMesh(skinId);
    this.mesh.position.copy(this.position);
  }

  private createCarMesh(skinId: string): THREE.Group {
    const group = new THREE.Group();
    const color = SKINS[skinId as SkinId] || SKINS.default;

    const bodyGeometry = new THREE.BoxGeometry(this.width, 0.8, this.length);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.6,
      roughness: 0.4,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const cabinGeometry = new THREE.BoxGeometry(this.width * 0.8, 0.6, this.length * 0.4);
    const cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
    cabin.position.y = 1;
    cabin.position.z = -0.3;
    cabin.castShadow = true;
    group.add(cabin);

    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3,
    });
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);

    const wheelPositions = [
      [-1, 0, 1.2],
      [1, 0, 1.2],
      [-1, 0, -1.2],
      [1, 0, -1.2],
    ];

    wheelPositions.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(x, y, z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      group.add(wheel);
    });

    return group;
  }

  public update(deltaTime: number, turnInput: number): void {
    try {
      this.rotation += turnInput * this.turnSpeed * deltaTime;

      const moveX = Math.sin(this.rotation) * this.speed * deltaTime;
      const moveZ = Math.cos(this.rotation) * this.speed * deltaTime;

      this.position.x += moveX;
      this.position.z -= moveZ;

      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = this.rotation;
    } catch (error) {
      console.error('[ONE WRONG TURN] Error updating car:', error);
    }
  }

  public reset(): void {
    this.position.set(0, 0, 0);
    this.rotation = 0;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public getRotation(): number {
    return this.rotation;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public getBounds(): CarBounds {
    const hw = this.width / 2;
    const hl = this.length / 2;

    const corners = [
      new THREE.Vector3(-hw, 0, -hl),
      new THREE.Vector3(hw, 0, -hl),
      new THREE.Vector3(-hw, 0, hl),
      new THREE.Vector3(hw, 0, hl),
    ];

    const rotatedCorners = corners.map((corner) => {
      const x = corner.x * Math.cos(this.rotation) - corner.z * Math.sin(this.rotation);
      const z = corner.x * Math.sin(this.rotation) + corner.z * Math.cos(this.rotation);
      return { x: x + this.position.x, z: z + this.position.z };
    });

    const minX = Math.min(...rotatedCorners.map((c) => c.x));
    const maxX = Math.max(...rotatedCorners.map((c) => c.x));
    const minZ = Math.min(...rotatedCorners.map((c) => c.z));
    const maxZ = Math.max(...rotatedCorners.map((c) => c.z));

    return { minX, maxX, minZ, maxZ };
  }
}

export { SKINS };
