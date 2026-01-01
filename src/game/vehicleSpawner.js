// Using global THREE from CDN - no import needed

export class VehicleSpawner {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.model = null;
    this.wheelMinY = Infinity;
  }

  async loadVehicle(gltfPath) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.GLTFLoader();

      loader.load(
        gltfPath,
        (gltf) => {
          this.model = gltf.scene;

          // Remove all imported materials (broken)
          this.model.traverse(child => {
            if (child.isMesh) {
              child.material = null;
            }
          });

          // Apply standard red material
          this.applyRedMaterial();

          // Scale to exactly 4.5 units long
          this.scaleTo4_5();

          // Detect wheels and auto-orient
          this.detectWheels();
          this.autoOrient();

          // Position on ground
          this.model.position.y = 2.0;

          resolve(this.model);
        },
        undefined,
        (error) => {
          console.error('Error loading vehicle:', error);
          reject(error);
        }
      );
    });
  }

  applyRedMaterial() {
    const redMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      roughness: 0.3,
      metalness: 0.6
    });

    this.model.traverse(child => {
      if (child.isMesh) {
        child.material = redMaterial;
      }
    });
  }

  scaleTo4_5() {
    const box = new THREE.Box3().setFromObject(this.model);
    const size = new THREE.Vector3();
    box.getSize(size);

    const scaleFactor = 4.5 / size.z;
    this.model.scale.multiplyScalar(scaleFactor);
  }

  detectWheels() {
    this.wheelMinY = Infinity;

    this.model.traverse(child => {
      if (child.isMesh) {
        const name = child.name ? child.name.toLowerCase() : '';

        // Check if it looks like a wheel
        const isWheel = name.includes('wheel') ||
                       name.includes('tire') ||
                       name.includes('rim') ||
                       name.includes('rueda') ||
                       this.isCylindricalGeometry(child);

        if (isWheel) {
          // Get world position Y
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);
          this.wheelMinY = Math.min(this.wheelMinY, worldPos.y);
        }
      }
    });

    // If no wheels detected, use lowest point of model
    if (this.wheelMinY === Infinity) {
      const box = new THREE.Box3().setFromObject(this.model);
      this.wheelMinY = box.min.y;
    }
  }

  isCylindricalGeometry(mesh) {
    if (!mesh.geometry) return false;
    const type = mesh.geometry.type;
    return type === 'CylinderGeometry' || type === 'CylinderBufferGeometry';
  }

  autoOrient() {
    // If wheel minY is not at 0, rotate to put it there
    if (Math.abs(this.wheelMinY) > 0.01) {
      this.model.rotation.x = -Math.PI / 2;
      // Recalculate wheel Y after rotation
      this.detectWheels();
    }

    // Check if front is facing Z+
    const box = new THREE.Box3().setFromObject(this.model);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Sample a point slightly in +Z direction from center
    const frontPoint = new THREE.Vector3(center.x, center.y, center.z + 1);
    const frontLocal = frontPoint.clone().sub(this.model.position).applyEuler(this.model.rotation.clone().invert());

    // If the Z extent is negative, model is backward
    const size = new THREE.Vector3();
    box.getSize(size);
    if (size.z < 0 || center.z < this.model.position.z) {
      this.model.rotation.y = Math.PI;
    }
  }

  getModel() {
    return this.model;
  }
}
