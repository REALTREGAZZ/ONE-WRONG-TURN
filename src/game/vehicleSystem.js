// vehicleSystem.js - Clean vehicle loading system
// NO assumptions, uses REAL measurements from model

export class VehicleSystem {
  constructor() {
    this.modelPath = './assets/models/low_poly/scene.gltf'; // Relative to src/index.html
    this.targetLength = 4.5; // Target length in units
    this.model = null;
    this.wheels = [];
  }

  async loadModel(car, scene) {
    try {
      // Ensure GLTFLoader is available
      if (typeof window.GLTFLoader === 'undefined') {
        console.error('GLTFLoader not available');
        return false;
      }

      const loader = new window.GLTFLoader();
      
      return new Promise((resolve, reject) => {
        loader.load(
          this.modelPath,
          (gltf) => {
            console.log('Model loaded successfully');
            this.model = gltf.scene;
            
            // Step 1: Measure model BEFORE any modifications
            this.measureModel();
            
            // Step 2: Scale to EXACTLY 4.5 units
            this.scaleToTarget();
            
            // Step 3: Auto-orient (detect wheels, fix rotation)
            this.autoOrient();
            
            // Step 4: Clean materials and apply standard red material
            this.cleanMaterials();
            
            // Step 5: Calculate collider
            this.calculateCollider(car);
            
            // Step 6: Attach to car
            this.attachToCar(car);
            
            // Step 7: Set safe spawn position
            car.group.position.set(0, 2.0, 0);
            
            console.log('Vehicle system setup complete');
            resolve(true);
          },
          (progress) => {
            const percent = (progress.loaded / progress.total * 100).toFixed(0);
            console.log(`Loading: ${percent}%`);
          },
          (error) => {
            console.error('Failed to load model:', error);
            reject(error);
          }
        );
      });
      
    } catch (error) {
      console.error('Error in loadModel:', error);
      return false;
    }
  }

  measureModel() {
    if (!this.model) return;
    
    const box = new THREE.Box3().setFromObject(this.model);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    console.log('Original model size:', {
      x: size.x.toFixed(3),
      y: size.y.toFixed(3),
      z: size.z.toFixed(3)
    });
    
    this.originalSize = size.clone();
  }

  scaleToTarget() {
    if (!this.model || !this.originalSize) return;
    
    // Scale based on Z axis (length)
    const scaleFactor = this.targetLength / this.originalSize.z;
    this.model.scale.multiplyScalar(scaleFactor);
    
    console.log(`Scaled by ${scaleFactor.toFixed(3)} to reach target length ${this.targetLength}`);
    
    // Verify new size
    const box = new THREE.Box3().setFromObject(this.model);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    console.log('Scaled model size:', {
      x: size.x.toFixed(3),
      y: size.y.toFixed(3),
      z: size.z.toFixed(3)
    });
  }

  autoOrient() {
    if (!this.model) return;
    
    console.log('Auto-orienting model...');
    
    // Step 1: Find wheels
    this.detectWheels();
    
    if (this.wheels.length === 0) {
      console.warn('No wheels detected, using default orientation');
      this.model.position.y = 0;
      return;
    }
    
    // Step 2: Get minimum Y position of wheels
    let minWheelY = Infinity;
    this.wheels.forEach(wheel => {
      const worldPos = new THREE.Vector3();
      wheel.getWorldPosition(worldPos);
      minWheelY = Math.min(minWheelY, worldPos.y);
    });
    
    console.log(`Wheels minimum Y: ${minWheelY.toFixed(3)}`);
    
    // Step 3: If wheels are NOT at Y ≈ 0, adjust model position
    if (Math.abs(minWheelY) > 0.1) {
      this.model.position.y = -minWheelY;
      console.log(`Adjusted model Y position to ${this.model.position.y.toFixed(3)}`);
    }
    
    // Step 4: Check if front faces +Z (forward)
    // We'll use a simple heuristic: the longest dimension should be Z
    const box = new THREE.Box3().setFromObject(this.model);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    // If model is rotated wrong (longest axis not Z), rotate it
    if (size.x > size.z) {
      console.log('Model appears to be rotated, fixing orientation');
      this.model.rotation.y = Math.PI / 2;
    }
    
    console.log(`Auto-orientation complete. Wheels detected: ${this.wheels.length}`);
  }

  detectWheels() {
    if (!this.model) return;
    
    this.wheels = [];
    
    this.model.traverse((child) => {
      if (!child.isMesh) return;
      
      const name = child.name.toLowerCase();
      
      // Check if name contains wheel-related keywords
      if (name.includes('wheel') || 
          name.includes('tire') || 
          name.includes('rim') ||
          name.includes('roue')) {
        this.wheels.push(child);
        console.log(`Found wheel: ${child.name}`);
        return;
      }
      
      // Check if it's a cylinder (wheels are typically cylinders)
      if (child.geometry && child.geometry.type === 'CylinderGeometry') {
        // Check if it's small enough to be a wheel (not the body)
        const box = new THREE.Box3().setFromObject(child);
        const size = new THREE.Vector3();
        box.getSize(size);
        
        // Small cylinder = likely a wheel
        if (size.x < 1.0 && size.y < 1.0 && size.z < 1.0) {
          this.wheels.push(child);
          console.log(`Found wheel (cylinder): ${child.name}`);
        }
      }
    });
  }

  cleanMaterials() {
    if (!this.model) return;
    
    console.log('Cleaning and applying standard materials...');
    
    // Step 1: Remove all existing materials
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.material = null;
      }
    });
    
    // Step 2: Create ONE standard material for everything
    const standardMat = new THREE.MeshStandardMaterial({
      color: 0xFF0000,  // Red
      roughness: 0.3,
      metalness: 0.5,
    });
    
    // Step 3: Apply to all meshes
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.material = standardMat;
      }
    });
    
    console.log('Materials cleaned and applied: Red metallic');
  }

  calculateCollider(car) {
    if (!this.model) return;
    
    const box = new THREE.Box3().setFromObject(this.model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    
    car.collider = {
      box: box,
      size: size,
      center: center,
      halfExtents: new THREE.Vector3(size.x / 2, size.y / 2, size.z / 2)
    };
    
    car.radius = size.x * 0.45;
    
    console.log('Collider calculated:', {
      width: size.x.toFixed(3),
      height: size.y.toFixed(3),
      length: size.z.toFixed(3),
      radius: car.radius.toFixed(3)
    });
  }

  attachToCar(car) {
    if (!this.model) return;
    
    // Clear existing model
    while (car.model.children.length > 0) {
      car.model.remove(car.model.children[0]);
    }
    
    // Add new model
    car.model.add(this.model);
    
    // Update car properties
    car.currentModel = this.model;
    car.modelType = 'glb';
    car.wheels = this.wheels;
    
    console.log('Model attached to car');
  }
}
