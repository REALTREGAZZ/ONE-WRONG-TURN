// Using global THREE from CDN - no import needed
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
    // Ground/Floor mejorado - más ancho
    const groundGeo = new THREE.PlaneGeometry(50, 2000); // Más ancho y largo
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a3e,
      metalness: 0.3,
      roughness: 0.7,
      wireframe: false
    });
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.5;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Agregar "bermas" (bordes del camino) para evitar traspaso
    const bermaLeft = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.2, 2000),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    bermaLeft.position.set(-5, -0.35, 0);
    this.scene.add(bermaLeft);

    const bermaRight = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.2, 2000),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    bermaRight.position.set(5, -0.35, 0);
    this.scene.add(bermaRight);
  }

  _createRoadMeshes() {
    const unitBox = new THREE.BoxGeometry(1, 1, 1);

    // Synthwave dark blue road with glow
    const roadMat = new THREE.MeshStandardMaterial({
      color: this.config.synthwave.road.color,
      roughness: 0.3,
      metalness: 0.5,
      emissive: new THREE.Color(0x0a0a2e),
      emissiveIntensity: 0.3,
    });

    // Cyan neon wall (left)
    const leftWallMat = new THREE.MeshStandardMaterial({
      color: this.config.synthwave.walls.left.color,
      emissive: this.config.synthwave.walls.left.emissive,
      emissiveIntensity: this.config.synthwave.walls.left.emissiveIntensity,
      roughness: 0.2,
      metalness: 0.8,
    });

    // Magenta neon wall (right)
    const rightWallMat = new THREE.MeshStandardMaterial({
      color: this.config.synthwave.walls.right.color,
      emissive: this.config.synthwave.walls.right.emissive,
      emissiveIntensity: this.config.synthwave.walls.right.emissiveIntensity,
      roughness: 0.2,
      metalness: 0.8,
    });

    this.roadMesh = new THREE.InstancedMesh(unitBox, roadMat, this.segmentCount);
    this.leftWallMesh = new THREE.InstancedMesh(unitBox, leftWallMat, this.segmentCount);
    this.rightWallMesh = new THREE.InstancedMesh(unitBox, rightWallMat, this.segmentCount);

    this.roadMesh.frustumCulled = false;
    this.leftWallMesh.frustumCulled = false;
    this.rightWallMesh.frustumCulled = false;

    this.scene.add(this.roadMesh, this.leftWallMesh, this.rightWallMesh);

    // Create neon grid lines on the road
    this._createGridLines();
  }

  _createGridLines() {
    // Yellow neon grid lines
    const gridColor = this.config.synthwave.road.gridColor;
    const lineMaterial = new THREE.LineBasicMaterial({
      color: gridColor,
      transparent: true,
      opacity: 0.6,
    });

    // Create horizontal grid lines that span across the road
    const gridCount = 80;
    const gridSpacing = 2;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(gridCount * 2 * 3);

    // Initialize grid line positions
    for (let i = 0; i < gridCount; i++) {
      const z = i * gridSpacing;
      const idx = i * 6;

      // Each line goes from left to right across the road
      positions[idx] = -10;     // x1
      positions[idx + 1] = -0.1; // y1 (slightly below road surface)
      positions[idx + 2] = z;   // z1

      positions[idx + 3] = 10;  // x2
      positions[idx + 4] = -0.1; // y2
      positions[idx + 5] = z;   // z2
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.gridLines = new THREE.LineSegments(geometry, lineMaterial);
    this.gridLines.frustumCulled = false;
    this.gridLineCount = gridCount;
    this.gridSpacing = gridSpacing;
    this.gridBaseZ = 0;

    this.scene.add(this.gridLines);
  }

  _createBuildings() {
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    const cfg = this.config.synthwave.buildings;

    // Matriz de colores más variados para edificios
    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color1,
      roughness: 0.4,
      metalness: 0.6,
      emissive: cfg.color1,
      emissiveIntensity: cfg.emissiveIntensity,
      vertexColors: true,
    });

    // Paleta extendida de colores para más variedad
    this._buildingPalette = [0xff6b35, 0xff1493, 0x00ffff, 0x9933ff, 0xff0000, 0xffff00, 0x00ff00];

    this.buildingCount = this.segmentCount * 2;
    this.buildings = new THREE.InstancedMesh(unitBox, mat, this.buildingCount);
    this.buildings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.buildings.frustumCulled = false;

    this._buildingColor = new THREE.Color();
    this.scene.add(this.buildings);

    // Crear geometría de ventanas para edificios
    this._createWindowDetails();
  }

  _createWindowDetails() {
    // Crear ventanas como detalles adicionales
    const windowGeo = new THREE.PlaneGeometry(0.3, 0.3);
    const windowMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      transparent: true,
      opacity: 0.8
    });

    this.windowMeshes = [];
    
    // Crear unos pocos meshes de ventana que se reusarán
    for (let i = 0; i < 20; i++) {
      const windowMesh = new THREE.Mesh(windowGeo, windowMat.clone());
      windowMesh.visible = false;
      this.scene.add(windowMesh);
      this.windowMeshes.push(windowMesh);
    }
  }

  reset() {
    this.baseZ = 0;
    this.headIndex = 0;
    this.roadGen.reset();
    this.gridBaseZ = 0;

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

    // Update grid lines to scroll with the road
    this._updateGridLines(carZ);
  }

  _updateGridLines(carZ) {
    // Calculate the offset to make grid lines appear to scroll
    const gridOffset = (carZ % this.gridSpacing) / this.gridSpacing;
    const positions = this.gridLines.geometry.attributes.position.array;

    for (let i = 0; i < this.gridLineCount; i++) {
      const baseZ = i * this.gridSpacing;
      const effectiveZ = baseZ - carZ + gridOffset * this.gridSpacing;
      const idx = i * 6;

      positions[idx + 2] = effectiveZ;     // z1
      positions[idx + 5] = effectiveZ;     // z2
    }

    this.gridLines.geometry.attributes.position.needsUpdate = true;
    this.gridLines.position.z = carZ;
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

    // Synthwave building colors from palette
    const palette = this._buildingPalette;
    const colorIndex = Math.floor(Math.random() * palette.length);
    this._buildingColor.setHex(palette[colorIndex]);
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
