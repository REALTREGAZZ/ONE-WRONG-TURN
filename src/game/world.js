import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { clamp, difficulty01, lerp, randRange, randSigned, smoothstep } from './helpers.js';

class RoadGenerator {
  constructor(config) {
    this.config = config;
    this.reset();
  }

  reset() {
    this.knots = [{ z: 0, x: 0 }];
    this._lastKnotZ = 0;
    this._lastX = 0;
  }

  _difficultyAtZ(z) {
    return difficulty01(z, this.config.difficulty.maxDistance);
  }

  ensureUpTo(z) {
    while (this._lastKnotZ < z) {
      const d = this._difficultyAtZ(this._lastKnotZ);
      const interval = lerp(this.config.turns.baseInterval, this.config.turns.minInterval, d);

      const nextZ = this._lastKnotZ + interval;
      const maxDelta = lerp(this.config.turns.baseDeltaX, this.config.turns.maxDeltaX, d);

      const nextX = clamp(
        this._lastX + randSigned() * randRange(maxDelta * 0.55, maxDelta),
        -this.config.turns.maxOffset,
        this.config.turns.maxOffset,
      );

      this.knots.push({ z: nextZ, x: nextX });
      this._lastKnotZ = nextZ;
      this._lastX = nextX;
    }
  }

  sample(z) {
    this.ensureUpTo(z + 120);

    let i = 0;
    // Knot count is small; a linear search is fine and predictable.
    while (i < this.knots.length - 2 && this.knots[i + 1].z < z) i += 1;

    const a = this.knots[i];
    const b = this.knots[i + 1];

    const t = (z - a.z) / Math.max(0.0001, b.z - a.z);
    const eased = smoothstep(t);

    const centerX = lerp(a.x, b.x, eased);
    const d = this._difficultyAtZ(z);
    const width = lerp(this.config.road.baseWidth, this.config.road.minWidth, d);

    return { centerX, width };
  }
}

export class World {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;

    this._tmpMatrix = new THREE.Matrix4();
    this._tmpPos = new THREE.Vector3();
    this._tmpQuat = new THREE.Quaternion();
    this._tmpScale = new THREE.Vector3();

    this.segmentCount = config.road.visibleSegments;
    this.segLen = config.road.segmentLength;

    this.roadGen = new RoadGenerator(config);

    this._createEnvironment();
    this._createRoadMeshes();
    this._createBuildings();

    this.reset();
  }

  _createEnvironment() {
    const groundGeo = new THREE.PlaneGeometry(this.config.road.groundWidth, this.config.road.groundWidth, 1, 1);
    const groundMat = new THREE.MeshStandardMaterial({
      color: this.config.road.groundColor,
      roughness: 1,
      metalness: 0,
    });

    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.11;
    this.ground.receiveShadow = false;
    this.scene.add(this.ground);
  }

  _createRoadMeshes() {
    const unitBox = new THREE.BoxGeometry(1, 1, 1);

    const roadMat = new THREE.MeshStandardMaterial({
      color: this.config.road.roadColor,
      roughness: 0.35,
      metalness: 0.0,
      emissive: new THREE.Color(0x041512),
      emissiveIntensity: 0.45,
    });

    const wallMat = new THREE.MeshStandardMaterial({
      color: this.config.road.wallColor,
      roughness: 0.55,
      metalness: 0,
    });

    this.roadMesh = new THREE.InstancedMesh(unitBox, roadMat, this.segmentCount);
    this.leftWallMesh = new THREE.InstancedMesh(unitBox, wallMat, this.segmentCount);
    this.rightWallMesh = new THREE.InstancedMesh(unitBox, wallMat, this.segmentCount);

    this.roadMesh.frustumCulled = false;
    this.leftWallMesh.frustumCulled = false;
    this.rightWallMesh.frustumCulled = false;

    this.scene.add(this.roadMesh, this.leftWallMesh, this.rightWallMesh);
  }

  _createBuildings() {
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x39a0ff,
      roughness: 0.75,
      metalness: 0.05,
    });

    this.buildingCount = this.segmentCount * 2;
    this.buildings = new THREE.InstancedMesh(unitBox, mat, this.buildingCount);
    this.buildings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.buildings.frustumCulled = false;

    this._buildingColor = new THREE.Color();
    this.scene.add(this.buildings);
  }

  reset() {
    this.baseZ = 0;
    this.headIndex = 0;
    this.roadGen.reset();

    for (let i = 0; i < this.segmentCount; i += 1) {
      const zStart = this.baseZ + i * this.segLen;
      this._writeSegment(i, zStart);
    }

    this._markDirty();
  }

  sampleRoad(z) {
    return this.roadGen.sample(z);
  }

  update(carZ) {
    // Keep the plane under the action (cheap infinite ground illusion).
    this.ground.position.z = carZ + this.config.road.groundWidth * 0.25;

    const recycleBehind = this.segLen * 10;
    while (carZ - this.baseZ > recycleBehind) {
      this._recycleOne();
    }
  }

  _recycleOne() {
    const idx = this.headIndex;
    this.headIndex = (this.headIndex + 1) % this.segmentCount;

    this.baseZ += this.segLen;

    const farZStart = this.baseZ + this.segmentCount * this.segLen;
    this._writeSegment(idx, farZStart);

    this._markDirty();
  }

  _writeSegment(instanceIndex, zStart) {
    const zCenter = zStart + this.segLen * 0.5;
    const { centerX, width } = this.sampleRoad(zCenter);

    // Road floor.
    this._tmpPos.set(centerX, -0.12, zCenter);
    this._tmpScale.set(width, 0.22, this.segLen);
    this._tmpMatrix.compose(this._tmpPos, this._tmpQuat.identity(), this._tmpScale);
    this.roadMesh.setMatrixAt(instanceIndex, this._tmpMatrix);

    // Walls.
    const wallXOffset = width * 0.5 + this.config.road.wallThickness * 0.5;

    this._tmpPos.set(centerX - wallXOffset, this.config.road.wallHeight * 0.5, zCenter);
    this._tmpScale.set(this.config.road.wallThickness, this.config.road.wallHeight, this.segLen);
    this._tmpMatrix.compose(this._tmpPos, this._tmpQuat.identity(), this._tmpScale);
    this.leftWallMesh.setMatrixAt(instanceIndex, this._tmpMatrix);

    this._tmpPos.set(centerX + wallXOffset, this.config.road.wallHeight * 0.5, zCenter);
    this._tmpMatrix.compose(this._tmpPos, this._tmpQuat.identity(), this._tmpScale);
    this.rightWallMesh.setMatrixAt(instanceIndex, this._tmpMatrix);

    // Buildings (simple cuboids; spawn density ramps pressure without affecting collision).
    this._writeBuildingsForSegment(instanceIndex, zCenter, centerX, width);
  }

  _writeBuildingsForSegment(segmentIndex, zCenter, centerX, width) {
    const leftIdx = segmentIndex * 2;
    const rightIdx = segmentIndex * 2 + 1;

    this._writeBuildingInstance(leftIdx, -1, zCenter, centerX, width);
    this._writeBuildingInstance(rightIdx, 1, zCenter, centerX, width);
  }

  _writeBuildingInstance(instanceIndex, side, zCenter, centerX, width) {
    const cfg = this.config.city;

    const shouldSpawn = Math.random() < cfg.spawnChancePerSegment;
    if (!shouldSpawn) {
      this._tmpPos.set(0, -999, 0);
      this._tmpScale.set(0.001, 0.001, 0.001);
      this._tmpMatrix.compose(this._tmpPos, this._tmpQuat.identity(), this._tmpScale);
      this.buildings.setMatrixAt(instanceIndex, this._tmpMatrix);
      return;
    }

    const sideOffset = width * 0.5 + this.config.road.wallThickness + randRange(cfg.nearOffset, cfg.farOffset);

    const footprintX = randRange(cfg.minFootprint, cfg.maxFootprint);
    const footprintZ = randRange(cfg.minFootprint, cfg.maxFootprint);
    const height = randRange(cfg.minHeight, cfg.maxHeight);

    this._tmpPos.set(centerX + side * sideOffset, height * 0.5, zCenter + randRange(-0.25, 0.25) * this.segLen);
    this._tmpScale.set(footprintX, height, footprintZ);
    this._tmpMatrix.compose(this._tmpPos, this._tmpQuat.identity(), this._tmpScale);
    this.buildings.setMatrixAt(instanceIndex, this._tmpMatrix);

    const h = (0.55 + Math.random() * 0.45) % 1;
    this._buildingColor.setHSL(h, 0.72, 0.55);
    this.buildings.setColorAt(instanceIndex, this._buildingColor);
  }

  _markDirty() {
    this.roadMesh.instanceMatrix.needsUpdate = true;
    this.leftWallMesh.instanceMatrix.needsUpdate = true;
    this.rightWallMesh.instanceMatrix.needsUpdate = true;
    this.buildings.instanceMatrix.needsUpdate = true;
    if (this.buildings.instanceColor) this.buildings.instanceColor.needsUpdate = true;
  }
}
