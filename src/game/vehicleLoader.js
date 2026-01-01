// Vehicle loader for GLB models with procedural fallback
// Uses global THREE from CDN and GLTFLoader from local file

export class VehicleLoader {
  // Shared loading manager
  static loadingManager = new THREE.LoadingManager();
  static isAllLoaded = false;
  
  // Vehicle configurations with local GLTF models
  static VEHICLE_MODELS = {
    'vehicle-1': {
      name: 'Cyber Sportster',
      url: './assets/models/low_poly/scene.gltf',
      scale: 2.2,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: Math.PI, z: 0 },
      defaultSkin: 'cyber-yellow'
    },
    'vehicle-2': {
      name: 'Neon Racer',
      url: './assets/models/free/scene.gltf',
      scale: 0.015,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: Math.PI, z: 0 },
      defaultSkin: 'neon-blue'
    },
    'vehicle-3': {
      name: 'Synthwave Coupe',
      url: './assets/models/muscle/scene.gltf',
      scale: 0.012,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: Math.PI, z: 0 },
      defaultSkin: 'magenta-dream'
    },
    'vehicle-4': {
      name: 'Future Speedster',
      url: './assets/models/blnk/scene.gltf',
      scale: 0.6,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: Math.PI, z: 0 },
      defaultSkin: 'orange-blaze'
    }
  };

  // Cache for loaded models
  static modelCache = new Map();

  // Cache for GLTFLoaders per vehicle type
  static loaderCache = new Map();

  /**
   * Get or create a GLTFLoader for a specific vehicle
   */
  static getLoader(vehicleId) {
    if (!this.loaderCache.has(vehicleId)) {
      if (typeof window.GLTFLoader === 'undefined') {
        console.warn('GLTFLoader not available globally');
        return null;
      }
      const loader = new window.GLTFLoader(this.loadingManager);
      this.loaderCache.set(vehicleId, loader);
    }
    return this.loaderCache.get(vehicleId);
  }

  /**
   * Load and instantiate a GLB vehicle model
   */
  static async loadVehicleModel(vehicleId, car) {
    const modelConfig = this.VEHICLE_MODELS[vehicleId];
    if (!modelConfig) {
      console.warn(`Unknown vehicle type: ${vehicleId}`);
      return this.loadProceduralFallback(car, modelConfig?.defaultSkin);
    }

    // Check cache first
    if (this.modelCache.has(vehicleId)) {
      const cachedModel = this.modelCache.get(vehicleId);
      this.attachModelToCar(cachedModel.clone(), car, modelConfig);
      return true;
    }

    try {
      const loader = this.getLoader(vehicleId);
      if (!loader) {
        throw new Error('GLTFLoader not available');
      }

      console.log(`Loading GLB model for ${vehicleId}: ${modelConfig.url}`);
      
      return new Promise((resolve, reject) => {
        // Set timeout fallback
        const timeout = setTimeout(() => {
          console.warn(`Load timeout for ${vehicleId}, using fallback`);
          this.loadProceduralFallback(car, modelConfig.defaultSkin);
          resolve(false);
        }, 5000);

        loader.load(
          modelConfig.url,
          (gltf) => {
            clearTimeout(timeout);
            const model = gltf.scene;
            
            // Fix materials and orientation
            this.prepareModel(model);
            
            // Cache the loaded model
            this.modelCache.set(vehicleId, model.clone());
            
            // Attach to car
            this.attachModelToCar(model, car, modelConfig);
            
            console.log(`Successfully loaded GLB model for ${vehicleId}`);
            resolve(true);
          },
          (progress) => {
            if (progress.total > 0) {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              // console.log(`Loading ${vehicleId}: ${percent}%`);
            }
          },
          (error) => {
            clearTimeout(timeout);
            console.warn(`Failed to load GLB model for ${vehicleId}:`, error);
            this.loadProceduralFallback(car, modelConfig.defaultSkin);
            resolve(false);
          }
        );
      });

    } catch (error) {
      console.warn(`Error loading GLB model for ${vehicleId}:`, error);
      this.loadProceduralFallback(car, modelConfig.defaultSkin);
      return false;
    }
  }

  /**
   * Prepare model: fix orientation, materials, calculate collider, etc.
   */
  static prepareModel(model) {
    let meshCount = 0;
    const materials = new Set();
    model.originalColors = new Map();

    model.traverse(child => {
      if (child.isMesh) {
        meshCount++;
        const oldMat = child.material;

        // Preserve original color from GLTF (CRITICAL for model fidelity)
        let originalColor = new THREE.Color(0xff0000); // fallback red
        if (oldMat.color) {
          originalColor = oldMat.color.clone();
        } else if (oldMat.pbrMetallicRoughness && oldMat.pbrMetallicRoughness.baseColorFactor) {
          const bc = oldMat.pbrMetallicRoughness.baseColorFactor;
          originalColor.setRGB(bc[0], bc[1], bc[2]);
        }

        // Store original color for later use
        model.originalColors.set(child.uuid, originalColor);

        // Get metallic and roughness from PBR materials
        let metallic = 0.5;
        let roughness = 0.4;
        if (oldMat.metallic !== undefined) {
          metallic = oldMat.metallic;
        } else if (oldMat.pbrMetallicRoughness && oldMat.pbrMetallicRoughness.metallicFactor !== undefined) {
          metallic = oldMat.pbrMetallicRoughness.metallicFactor;
        }
        if (oldMat.roughness !== undefined) {
          roughness = oldMat.roughness;
        } else if (oldMat.pbrMetallicRoughness && oldMat.pbrMetallicRoughness.roughnessFactor !== undefined) {
          roughness = oldMat.pbrMetallicRoughness.roughnessFactor;
        }

        // Get emissive properties
        let emissive = new THREE.Color(0x000000);
        let emissiveIntensity = 0;
        if (oldMat.emissive) {
          emissive = oldMat.emissive.clone();
        }
        if (oldMat.emissiveIntensity !== undefined) {
          emissiveIntensity = oldMat.emissiveIntensity;
        } else if (oldMat.emissiveFactor) {
          emissive.setRGB(oldMat.emissiveFactor[0], oldMat.emissiveFactor[1], oldMat.emissiveFactor[2]);
        }

        // Convert to MeshStandardMaterial for proper lighting
        child.material = new THREE.MeshStandardMaterial({
          color: originalColor,
          metalness: metallic || 0.5,
          roughness: roughness || 0.4,
          side: THREE.DoubleSide,
          map: oldMat.map,
          normalMap: oldMat.normalMap,
          emissive: emissive,
          emissiveIntensity: emissiveIntensity
        });

        if (child.material.map) materials.add('texture');
        materials.add(child.material.type);

        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Debug log with detailed material information
    console.log(`Model preparation complete:
      Meshes: ${meshCount}
      Materials: ${Array.from(materials).join(', ')}
      Hierarchy: ${model.children.length} root children`);

    // Calculate bounding box for precise collision detection
    return model;
  }

  /**
   * Attach a loaded model to the car
   */
  static attachModelToCar(model, car, modelConfig) {
    // Clear existing model
    while (car.model.children.length > 0) {
      car.model.remove(car.model.children[0]);
    }

    // Apply model configuration - scale first
    if (typeof modelConfig.scale === 'number') {
      model.scale.setScalar(modelConfig.scale);
    } else if (modelConfig.scale) {
      model.scale.set(modelConfig.scale.x, modelConfig.scale.y, modelConfig.scale.z);
    }

    // Fix orientation: Models typically come facing -Z or need rotation to face +Z
    // The current config has rotation.y = Math.PI, which faces backwards
    // Remove or adjust to face forward (Z positive)
    if (modelConfig.rotation) {
      // For most car models, we want them facing +Z (forward)
      // If the model comes from Sketchfab, it might face -Z, so we rotate Y by PI
      // But if it already faces +Z, no rotation needed
      model.rotation.set(modelConfig.rotation.x, 0, modelConfig.rotation.z); // Remove Y rotation
    }

    // Safe spawn: position at +2 units above ground to prevent clipping
    // This ensures physics engine doesn't detect the car inside the ground
    if (modelConfig.position) {
      model.position.set(modelConfig.position.x, 2.0, modelConfig.position.z); // Force Y = 2.0
    } else {
      model.position.set(0, 2.0, 0);
    }

    // Add to car model
    car.model.add(model);

    // Set reference for skin application
    car.currentModel = model;
    car.modelType = 'glb';

    // Find wheels in GLB model
    car.wheels = [];
    model.traverse(child => {
      if (child.isMesh && (child.name.toLowerCase().includes('wheel') || child.name.toLowerCase().includes('tire'))) {
        car.wheels.push(child);
      }
    });

    // Calculate precise bounding box for collision detection
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Store bounding box data for precise collision
    car.collider = {
      box: box,
      size: size,
      center: center,
      halfExtents: new THREE.Vector3(size.x / 2, size.y / 2, size.z / 2)
    };

    // Update car radius based on model width (X axis)
    // Use a bit of margin for better gameplay
    car.radius = size.x * 0.45;

    // Adjust car spawn height based on model dimensions
    // Wheels should touch the ground (ground at Y = -0.5)
    // The model is at Y = 2.0 relative to car.model
    // We need to adjust car.group.position so wheels are at ground level
    const wheelBottom = center.y - size.y / 2;
    const groundLevel = -0.5;
    const spawnY = groundLevel - wheelBottom + 0.15; // +0.15 for wheel clearance

    // Update car position to spawn safely above ground
    car.group.position.y = spawnY;

    console.log(`Loaded vehicle: ${modelConfig.name}`);
    console.log(`  Size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
    console.log(`  Collider half-extents: [${car.collider.halfExtents.x.toFixed(2)}, ${car.collider.halfExtents.y.toFixed(2)}, ${car.collider.halfExtents.z.toFixed(2)}]`);
    console.log(`  Car radius: ${car.radius.toFixed(2)}`);
    console.log(`  Wheels found: ${car.wheels.length}`);
    console.log(`  Spawn Y: ${spawnY.toFixed(2)}`);
  }

  /**
   * Load procedural fallback when GLB fails
   */
  static loadProceduralFallback(car, skinId = 'cyber-yellow') {
    console.log('Loading procedural vehicle fallback');
    
    // Clear any existing GLB model
    while (car.model.children.length > 0) {
      car.model.remove(car.model.children[0]);
    }
    
    // Recreate procedural vehicle
    car.createProceduralVehicle();
    
    // Apply skin
    car.applySkin(skinId);
    
    // Mark as procedural
    car.modelType = 'procedural';
    car.currentModel = null;
  }

  /**
   * Apply vehicle skin to either GLB or procedural model
   */
  static async applyVehicleSkin(car, skinId) {
    if (car.modelType === 'glb' && car.currentModel) {
      // For GLB models, try to find and modify materials
      this.applySkinToGLBModel(car.currentModel, skinId);
    } else {
      // For procedural models, use existing method
      car.applySkin(skinId);
    }
  }

  /**
   * Apply skin to GLB model by modifying materials
   * Preserves original model characteristics where possible
   */
  static applySkinToGLBModel(model, skinId) {
    const skinColors = {
      'cyber-yellow': 0xffff00,
      'neon-blue': 0x00ffff,
      'magenta-dream': 0xff00ff,
      'orange-blaze': 0xff6b35,
      'ghost-cyan': 0x00ffff,
      'synth-pink': 0xff1493,
      'lime-neon': 0x32cd32,
      'purple-haze': 0x8a2be2
    };

    const color = skinColors[skinId] || 0xffff00;

    // Traverse model and modify materials
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        // Ensure we are using MeshStandardMaterial for better lighting
        if (!(child.material instanceof THREE.MeshStandardMaterial)) {
          const oldMat = child.material;
          child.material = new THREE.MeshStandardMaterial({
            map: oldMat.map,
            normalMap: oldMat.normalMap,
            side: THREE.DoubleSide,
            color: oldMat.color,
            metalness: oldMat.metalness || 0.5,
            roughness: oldMat.roughness || 0.4
          });
        }

        // We only want to change the color of the "body" parts.
        // Heuristic: if it's not a wheel/tire and not glass/window
        const name = child.name.toLowerCase();
        const isBody = !name.includes('wheel') && !name.includes('tire') &&
                       !name.includes('glass') && !name.includes('window') &&
                       !name.includes('light') && !name.includes('headlight') &&
                       !name.includes('taillight');

        if (isBody) {
          child.material.color.setHex(color);
          // Preserve metallic feel but enhance it
          child.material.metalness = Math.max(child.material.metalness, 0.7);
          child.material.roughness = Math.min(child.material.roughness, 0.3);

          // Add subtle emissive glow for Synthwave aesthetic
          if (child.material.emissive) {
            child.material.emissive.setHex(color);
            child.material.emissiveIntensity = 0.15;
          }
        }

        child.material.needsUpdate = true;
      }
    });
  }

  /**
   * Apply accessories to either GLB or procedural model
   */
  static async applyAccessory(car, accessoryId) {
    if (car.modelType === 'glb' && car.currentModel) {
      // For GLB models, add accessories as additional meshes
      this.addAccessoryToGLBModel(car.currentModel, accessoryId);
    } else {
      // For procedural models, use existing method
      car.applyAccessories([accessoryId]);
    }
  }

  /**
   * Add accessory to GLB model
   */
  static addAccessoryToGLBModel(model, accessoryId) {
    // This would need to be expanded based on specific accessories
    // For now, we'll use the procedural accessory system as reference
    
    if (accessoryId === 'chrome-wheels') {
      // Could modify wheel materials if they exist in the GLB
      model.traverse((child) => {
        if (child.isMesh && child.material && 
            child.material.color && 
            (child.material.color.getHex() === 0x333333 || child.material.color.getHex() === 0x1a1a1a)) {
          child.material.color.setHex(0xff6b35);
          child.material.metalness = 0.9;
          child.material.roughness = 0.1;
          child.material.needsUpdate = true;
        }
      });
    }
    // Add more accessory types as needed
  }

  /**
   * Preload all vehicle models (optional optimization)
   */
  static async preloadAllModels() {
    const promises = Object.keys(this.VEHICLE_MODELS).map(vehicleId => {
      // Create a dummy car for preloading
      const dummyCar = { model: { children: [] }, modelType: 'procedural' };
      return this.loadVehicleModel(vehicleId, dummyCar);
    });

    try {
      await Promise.all(promises);
      console.log('All vehicle models preloaded successfully');
    } catch (error) {
      console.warn('Some vehicle models failed to preload:', error);
    }
  }

  /**
   * Get vehicle model info
   */
  static getVehicleInfo(vehicleId) {
    return this.VEHICLE_MODELS[vehicleId] || null;
  }

  /**
   * Clear model cache (useful for memory management)
   */
  static clearCache() {
    this.modelCache.clear();
    console.log('Vehicle model cache cleared');
  }
}