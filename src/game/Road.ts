import * as THREE from 'three';

interface RoadSegment {
  angle: number;
  length: number;
}

interface Wall {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const ROAD_WIDTH = 8;
const WALL_HEIGHT = 2;
const SEGMENT_WIDTH = 10;

const SEGMENT_POOL: RoadSegment[] = [
  { angle: 0, length: 30 },
  { angle: 0, length: 40 },
  { angle: 0.3, length: 25 },
  { angle: -0.3, length: 25 },
  { angle: 0.5, length: 20 },
  { angle: -0.5, length: 20 },
  { angle: 0.7, length: 18 },
  { angle: -0.7, length: 18 },
  { angle: 0, length: 35 },
  { angle: 0.4, length: 22 },
  { angle: -0.4, length: 22 },
  { angle: 0.6, length: 20 },
  { angle: -0.6, length: 20 },
];

export class Road {
  private group: THREE.Group;
  private segments: RoadSegment[] = [];
  private walls: Wall[] = [];
  private currentAngle = 0;
  private currentX = 0;
  private currentZ = 0;
  private segmentIndex = 0;
  private shuffledPool: RoadSegment[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.shuffleSegments();
    this.generateInitialRoad();
  }

  private shuffleSegments(): void {
    this.shuffledPool = [...SEGMENT_POOL].sort(() => Math.random() - 0.5);
  }

  private getNextSegment(): RoadSegment {
    if (this.segmentIndex >= this.shuffledPool.length) {
      this.shuffleSegments();
      this.segmentIndex = 0;
    }
    return this.shuffledPool[this.segmentIndex++];
  }

  private generateInitialRoad(): void {
    for (let i = 0; i < 10; i++) {
      this.addSegment();
    }
  }

  private addSegment(): void {
    const segment = this.getNextSegment();
    this.segments.push(segment);

    const steps = Math.ceil(segment.length / SEGMENT_WIDTH);

    for (let i = 0; i < steps; i++) {
      const stepLength = SEGMENT_WIDTH;
      const startX = this.currentX;
      const startZ = this.currentZ;

      this.currentAngle += segment.angle / steps;
      this.currentX += Math.sin(this.currentAngle) * stepLength;
      this.currentZ -= Math.cos(this.currentAngle) * stepLength;

      const endX = this.currentX;
      const endZ = this.currentZ;

      this.createRoadPiece(startX, startZ, endX, endZ);
      this.createWalls(startX, startZ, endX, endZ);
    }
  }

  private createRoadPiece(startX: number, startZ: number, endX: number, endZ: number): void {
    const dx = endX - startX;
    const dz = endZ - startZ;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, -dz);

    const geometry = new THREE.PlaneGeometry(ROAD_WIDTH, length);
    const material = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.1,
      roughness: 0.9,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = angle;
    mesh.position.set((startX + endX) / 2, 0, (startZ + endZ) / 2);
    mesh.receiveShadow = true;

    this.group.add(mesh);

    const lineGeometry = new THREE.PlaneGeometry(0.2, length);
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      opacity: 0.8,
      transparent: true,
    });

    const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.rotation.z = angle;
    centerLine.position.set((startX + endX) / 2, 0.01, (startZ + endZ) / 2);

    this.group.add(centerLine);
  }

  private createWalls(startX: number, startZ: number, endX: number, endZ: number): void {
    const dx = endX - startX;
    const dz = endZ - startZ;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, -dz);

    const halfWidth = ROAD_WIDTH / 2;
    const perpX = Math.cos(angle);
    const perpZ = Math.sin(angle);

    const geometry = new THREE.BoxGeometry(0.5, WALL_HEIGHT, length);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0xff00ff,
      emissiveIntensity: 0.2,
    });

    const leftWall = new THREE.Mesh(geometry, material);
    const leftX = (startX + endX) / 2 - perpX * halfWidth;
    const leftZ = (startZ + endZ) / 2 - perpZ * halfWidth;
    leftWall.position.set(leftX, WALL_HEIGHT / 2, leftZ);
    leftWall.rotation.y = angle;
    leftWall.castShadow = true;
    this.group.add(leftWall);

    const rightWall = new THREE.Mesh(geometry, material);
    const rightX = (startX + endX) / 2 + perpX * halfWidth;
    const rightZ = (startZ + endZ) / 2 + perpZ * halfWidth;
    rightWall.position.set(rightX, WALL_HEIGHT / 2, rightZ);
    rightWall.rotation.y = angle;
    rightWall.castShadow = true;
    this.group.add(rightWall);

    const wallPadding = 0.5;
    const minX = Math.min(leftX, rightX) - wallPadding;
    const maxX = Math.max(leftX, rightX) + wallPadding;
    const minZ = Math.min(leftZ, rightZ, startZ, endZ) - length / 2;
    const maxZ = Math.max(leftZ, rightZ, startZ, endZ) + length / 2;

    this.walls.push({ minX, maxX, minZ, maxZ });
  }

  public update(carPosition: THREE.Vector3): void {
    const carZ = carPosition.z;

    if (this.currentZ - carZ < 200) {
      this.addSegment();
    }

    const removeThreshold = carZ + 50;
    while (this.walls.length > 0 && this.walls[0].maxZ > removeThreshold) {
      this.walls.shift();
    }

    const childrenToRemove = [];
    for (let i = 0; i < this.group.children.length; i++) {
      const child = this.group.children[i];
      if (child.position.z > carZ + 50) {
        childrenToRemove.push(child);
      }
    }

    childrenToRemove.forEach((child) => {
      this.group.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  public reset(): void {
    this.group.clear();
    this.segments = [];
    this.walls = [];
    this.currentAngle = 0;
    this.currentX = 0;
    this.currentZ = 0;
    this.segmentIndex = 0;
    this.shuffleSegments();
    this.generateInitialRoad();
  }

  public getMesh(): THREE.Group {
    return this.group;
  }

  public getWalls(): Wall[] {
    return this.walls;
  }
}
